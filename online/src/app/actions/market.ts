'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams, players, transferOffers, messages } from "@/db/schema";
import { eq, isNull, and, ne, sql } from "drizzle-orm";
import { calcularChanceAcordo, LIMITE_ELENCO, MINIMO_ELENCO_PARA_VENDA, DESAGIO_VENDA_INSTANTANEA } from "@/lib/game/market/negotiate";
import { gerarProspectosScout } from "@/lib/game/market/scout";

async function requireOwnTeam() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec?.teamId) throw new Error("Você não tem um time.");

  const [team] = await db.select().from(teams).where(eq(teams.id, userRec.teamId));
  if (!team) throw new Error("Time não encontrado.");

  return { session, team };
}

export async function getOtherTeamsAction() {
  const { team } = await requireOwnTeam();
  return db.select().from(teams).where(ne(teams.id, team.id));
}

export async function getTeamRosterAction(teamId: number) {
  return db.select().from(players).where(eq(players.teamId, teamId));
}

export async function getFreeAgentsAction() {
  return db.select().from(players).where(isNull(players.teamId));
}

export async function getMySquadSizeAction() {
  const { team } = await requireOwnTeam();
  const squad = await db.select().from(players).where(eq(players.teamId, team.id));
  return { count: squad.length, limit: LIMITE_ELENCO };
}

interface NegociarInput {
  playerId: number;
  type: "buy" | "loan";
  feePct: number; // 90 | 100 | 120
  salaryPct: number; // 100 | 125 | 150
  loanSalarySplitPct?: number; // 50 | 100 (só empréstimo)
  loanRounds?: number | null; // null = até o fim da temporada
}

// Negocia a contratação (compra ou empréstimo) de um jogador de outro clube, ou a
// assinatura direta de um agente livre. Portado de js/components/market.js:246-595,
// simplificado: resolução por um único sorteio (sem contraproposta iterativa da IA).
export async function negotiateTransferAction(input: NegociarInput) {
  const { team: buyerTeam } = await requireOwnTeam();

  const [player] = await db.select().from(players).where(eq(players.id, input.playerId));
  if (!player) throw new Error("Jogador não encontrado.");
  if (player.teamId === buyerTeam.id) throw new Error("Esse jogador já joga no seu time.");

  const squad = await db.select().from(players).where(eq(players.teamId, buyerTeam.id));
  if (squad.length >= LIMITE_ELENCO) throw new Error(`Elenco no limite máximo (${LIMITE_ELENCO} jogadores).`);

  // Agente livre: assinatura direta, sem negociação com outro clube.
  if (!player.teamId) {
    const custo = Math.round(player.value * (input.feePct / 100));
    if (buyerTeam.balance < custo) throw new Error("Saldo insuficiente para pagar a taxa de assinatura.");

    await db.update(teams).set({ balance: buyerTeam.balance - custo }).where(eq(teams.id, buyerTeam.id));
    await db.update(players).set({
      teamId: buyerTeam.id,
      salary: Math.round(player.salary * (input.salaryPct / 100)),
      characteristic: null,
    }).where(eq(players.id, player.id));

    return { success: true, message: `${player.name} assinou com o clube!` };
  }

  const [sellerTeam] = await db.select().from(teams).where(eq(teams.id, player.teamId));
  if (!sellerTeam) throw new Error("Clube vendedor não encontrado.");

  const isTitular = player.characteristic?.startsWith("pitch-") ?? false;
  const chance = calcularChanceAcordo({
    tipoOferta: input.type,
    isTitular,
    reputacaoCompradora: buyerTeam.reputation,
    reputacaoVendedora: sellerTeam.reputation,
    percentualValorOferecido: input.feePct,
    percentualSalarioOferecido: input.salaryPct,
  });

  if (Math.random() * 100 >= chance) {
    return { success: false, message: `O ${sellerTeam.name} recusou a proposta por ${player.name}.` };
  }

  if (input.type === "buy") {
    const custo = Math.round(player.value * (input.feePct / 100));
    if (buyerTeam.balance < custo) throw new Error("Saldo insuficiente para fechar a compra.");

    await db.update(teams).set({ balance: buyerTeam.balance - custo }).where(eq(teams.id, buyerTeam.id));
    await db.update(teams).set({ balance: sellerTeam.balance + custo }).where(eq(teams.id, sellerTeam.id));
    await db.update(players).set({
      teamId: buyerTeam.id,
      salary: Math.round(player.salary * (input.salaryPct / 100)),
      characteristic: null,
      transferListed: false,
    }).where(eq(players.id, player.id));

    return { success: true, message: `Negócio fechado! ${player.name} agora joga pelo ${buyerTeam.name}.` };
  }

  // Empréstimo
  const novoSalario = Math.round(player.salary * (input.salaryPct / 100));
  await db.update(players).set({
    teamId: buyerTeam.id,
    loanFromTeamId: sellerTeam.id,
    loanRoundsLeft: input.loanRounds ?? null,
    originalSalary: player.salary,
    salary: Math.round(novoSalario * ((input.loanSalarySplitPct ?? 100) / 100)),
    characteristic: null,
    transferListed: false,
  }).where(eq(players.id, player.id));

  return { success: true, message: `Empréstimo acertado! ${player.name} está emprestado ao ${buyerTeam.name}.` };
}

// Venda instantânea de um jogador do próprio elenco, com deságio — portado de
// js/components/market.js:204-244,597-622.
export async function sellPlayerAction(playerId: number) {
  const { team } = await requireOwnTeam();

  const [player] = await db.select().from(players).where(eq(players.id, playerId));
  if (!player || player.teamId !== team.id) throw new Error("Esse jogador não pertence ao seu time.");
  if (player.loanFromTeamId) throw new Error("Jogadores emprestados não podem ser vendidos.");

  const squad = await db.select().from(players).where(eq(players.teamId, team.id));
  if (squad.length <= MINIMO_ELENCO_PARA_VENDA) {
    throw new Error(`Seu elenco não pode ter menos de ${MINIMO_ELENCO_PARA_VENDA} jogadores.`);
  }

  const valorVenda = Math.round(player.value * DESAGIO_VENDA_INSTANTANEA);
  await db.update(teams).set({ balance: team.balance + valorVenda }).where(eq(teams.id, team.id));
  await db.update(players).set({ teamId: null, characteristic: null, transferListed: false }).where(eq(players.id, playerId));

  return { valorVenda };
}

// Contrata um scout: paga uma taxa e sorteia novos agentes livres pro mercado.
// Portado de js/components/market.js:125-137,627-640.
export async function scoutAction() {
  const { team } = await requireOwnTeam();
  const custo = team.safModel === "city" ? 25000 : 50000;

  if (team.balance < custo) throw new Error(`Saldo insuficiente para pagar a taxa de scout (R$ ${custo.toLocaleString("pt-BR")}).`);

  const prospectos = gerarProspectosScout(team.reputation);
  await db.insert(players).values(prospectos.map((p) => ({ ...p, teamId: null })));
  await db.update(teams).set({ balance: team.balance - custo }).where(eq(teams.id, team.id));

  return { quantidade: prospectos.length, custo };
}

// Aceita ou recusa uma proposta de compra recebida (gerada automaticamente pela CPU
// em src/lib/game/round/transfer-offers.ts para jogadores listados). A tela de inbox
// que expõe isso ao usuário fica pra Fase 6; a action já fica pronta aqui.
export async function resolveTransferOfferAction(offerId: number, accept: boolean) {
  const { session, team: sellerTeam } = await requireOwnTeam();

  const [offer] = await db.select().from(transferOffers).where(eq(transferOffers.id, offerId));
  if (!offer || offer.status !== "pending") throw new Error("Proposta não encontrada ou já resolvida.");
  if (offer.toTeamId !== sellerTeam.id) throw new Error("Essa proposta não é para o seu time.");

  if (!accept) {
    await db.update(transferOffers).set({ status: "rejected" }).where(eq(transferOffers.id, offerId));
  } else {
    const [player] = await db.select().from(players).where(eq(players.id, offer.playerId));
    const [buyerTeam] = await db.select().from(teams).where(eq(teams.id, offer.fromTeamId));
    if (!player || !buyerTeam) throw new Error("Dados da proposta inconsistentes.");

    await db.update(teams).set({ balance: buyerTeam.balance - offer.feeValue }).where(eq(teams.id, buyerTeam.id));
    await db.update(teams).set({ balance: sellerTeam.balance + offer.feeValue }).where(eq(teams.id, sellerTeam.id));
    await db.update(players).set({ teamId: buyerTeam.id, characteristic: null, transferListed: false }).where(eq(players.id, player.id));
    await db.update(transferOffers).set({ status: "accepted" }).where(eq(transferOffers.id, offerId));
  }

  await db.update(messages).set({ actionDone: true }).where(
    and(eq(messages.userId, session.user!.id!), sql`(${messages.actionData}->>'offerId')::int = ${offerId}`)
  );

  return { accepted: accept };
}
