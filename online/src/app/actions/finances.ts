'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams, sponsors, teamSponsors } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";

const PRECO_MIN = 10;
const PRECO_MAX = 100;
const PASSO_PRECO = 5;

const CUSTO_EXPANSAO = { 1: { capacidade: 5000, custo: 7_500_000 }, 2: { capacidade: 10_000, custo: 15_000_000 } } as const;

const VALOR_EMPRESTIMO = 5_000_000;
const LIMITE_EMPRESTIMO = 20_000_000;

const SAF_MODELOS = {
  textor: { aporte: 60_000_000, reduzDividaPct: 0.5 },
  city: { aporte: 40_000_000, reduzDividaPct: 0 },
  minoritaria: { aporte: 15_000_000, reduzDividaPct: 0 },
} as const;

async function requireOwnTeam() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec?.teamId) throw new Error("Você não tem um time.");

  const [team] = await db.select().from(teams).where(eq(teams.id, userRec.teamId));
  if (!team) throw new Error("Time não encontrado.");

  return { team };
}

export async function getFinanceOverviewAction() {
  const { team } = await requireOwnTeam();
  return team;
}

// Catálogo de patrocinadores elegíveis (por reputação mínima) pro time do usuário,
// junto com os contratos já assinados por slot. Catálogo é editável no Admin — ver
// src/db/seed-catalogs.ts.
export async function getSponsorCatalogAction() {
  const { team } = await requireOwnTeam();

  const elegiveis = await db.select().from(sponsors).where(
    and(eq(sponsors.active, true), lte(sponsors.minReputation, team.reputation))
  );

  const contratados = await db
    .select({ slot: teamSponsors.slot, sponsor: sponsors })
    .from(teamSponsors)
    .innerJoin(sponsors, eq(teamSponsors.sponsorId, sponsors.id))
    .where(eq(teamSponsors.teamId, team.id));

  return { elegiveis, contratados };
}

// Assina um patrocinador — substitui o contrato anterior do mesmo slot, se houver, e
// paga o bônus de assinatura (baseValue) uma única vez. Portado de
// js/main.js:gerarPropostasPatrocinio/verificarContratosComerciais (420-690).
export async function signSponsorAction(sponsorId: number) {
  const { team } = await requireOwnTeam();

  const [sponsor] = await db.select().from(sponsors).where(eq(sponsors.id, sponsorId));
  if (!sponsor || !sponsor.active) throw new Error("Patrocinador indisponível.");
  if (team.reputation < sponsor.minReputation) throw new Error("Sua reputação não atende ao mínimo exigido por esse patrocinador.");

  await db.delete(teamSponsors).where(and(eq(teamSponsors.teamId, team.id), eq(teamSponsors.slot, sponsor.slot)));

  await db.insert(teamSponsors).values({
    teamId: team.id,
    sponsorId: sponsor.id,
    slot: sponsor.slot,
    signedRound: 0, // TODO(Fase 8): usar a rodada atual da liga quando o histórico de temporada existir
  });

  await db.update(teams).set({ balance: team.balance + sponsor.baseValue }).where(eq(teams.id, team.id));

  return { message: `Contrato assinado com ${sponsor.name}! +R$ ${sponsor.baseValue.toLocaleString("pt-BR")} de bônus.` };
}

export async function updateTicketPriceAction(delta: number) {
  const { team } = await requireOwnTeam();
  const novoPreco = Math.max(PRECO_MIN, Math.min(PRECO_MAX, team.ticketPrice + (delta >= 0 ? PASSO_PRECO : -PASSO_PRECO)));
  await db.update(teams).set({ ticketPrice: novoPreco }).where(eq(teams.id, team.id));
  return { ticketPrice: novoPreco };
}

// Portado de js/components/finances.js:173-183,270-291.
export async function expandStadiumAction(tier: 1 | 2) {
  const { team } = await requireOwnTeam();
  const upgrade = CUSTO_EXPANSAO[tier];
  if (team.balance < upgrade.custo) throw new Error(`Saldo insuficiente. Necessário: R$ ${upgrade.custo.toLocaleString("pt-BR")}.`);

  await db.update(teams).set({
    balance: team.balance - upgrade.custo,
    capacity: (team.capacity ?? 0) + upgrade.capacidade,
  }).where(eq(teams.id, team.id));

  return { novaCapacidade: (team.capacity ?? 0) + upgrade.capacidade };
}

// Portado de js/components/finances.js:185-195,293-330.
export async function takeLoanAction() {
  const { team } = await requireOwnTeam();
  if (team.debt + VALOR_EMPRESTIMO > LIMITE_EMPRESTIMO) {
    throw new Error(`Limite de endividamento é R$ ${LIMITE_EMPRESTIMO.toLocaleString("pt-BR")}.`);
  }

  await db.update(teams).set({
    balance: team.balance + VALOR_EMPRESTIMO,
    debt: team.debt + VALOR_EMPRESTIMO,
  }).where(eq(teams.id, team.id));

  return { novaDivida: team.debt + VALOR_EMPRESTIMO };
}

export async function payLoanAction() {
  const { team } = await requireOwnTeam();
  if (team.debt <= 0) throw new Error("Você não tem dívidas a pagar.");

  const valorPago = Math.min(VALOR_EMPRESTIMO, team.debt);
  if (team.balance < valorPago) throw new Error("Saldo insuficiente para pagar o empréstimo.");

  await db.update(teams).set({
    balance: team.balance - valorPago,
    debt: team.debt - valorPago,
  }).where(eq(teams.id, team.id));

  return { novaDivida: team.debt - valorPago };
}

// Conversão em SAF — portado de js/components/finances.js:197-374. Ação irreversível
// e única (um clube só se torna SAF uma vez).
export async function convertToSafAction(model: "textor" | "city" | "minoritaria") {
  const { team } = await requireOwnTeam();
  if (team.safModel) throw new Error("Seu clube já é uma SAF.");

  const info = SAF_MODELOS[model];
  if (!info) throw new Error("Modelo de SAF inválido.");

  const novaDivida = Math.round(team.debt * (1 - info.reduzDividaPct));

  await db.update(teams).set({
    safModel: model,
    isSaf: true,
    balance: team.balance + info.aporte,
    debt: novaDivida,
  }).where(eq(teams.id, team.id));

  return { message: `Parabéns! Seu clube agora é uma SAF. Aporte de R$ ${info.aporte.toLocaleString("pt-BR")} recebido.` };
}
