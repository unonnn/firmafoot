'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams, players, conversationTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { returnPlayerFromLoan } from "@/lib/game/round/loans";

async function requireOwnPlayer(playerId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec?.teamId) throw new Error("Você não tem um time.");

  const [player] = await db.select().from(players).where(eq(players.id, playerId));
  if (!player || player.teamId !== userRec.teamId) throw new Error("Esse jogador não pertence ao seu time.");

  const [team] = await db.select().from(teams).where(eq(teams.id, userRec.teamId));
  if (!team) throw new Error("Time não encontrado.");

  return { player, team };
}

// Catálogo de conversas (elogiar/cobrar/folga), editável no Admin — ver
// src/db/seed-catalogs.ts e AdminConfigPanel (Fase 7 vai trazer um CRUD dedicado).
export async function getConversationTypesAction() {
  return db.select().from(conversationTypes);
}

// Portado de js/components/tactics.js:797-828 (elogiar/cobrar foco/dar folga).
export async function talkToPlayerAction(playerId: number, conversationKey: string) {
  const { player } = await requireOwnPlayer(playerId);

  if (player.conversationCooldown > 0) {
    throw new Error(`Aguarde ${player.conversationCooldown} rodada(s) para conversar com este jogador novamente.`);
  }

  const [tipo] = await db.select().from(conversationTypes).where(eq(conversationTypes.key, conversationKey));
  if (!tipo) throw new Error("Tipo de conversa inválido.");

  const sucesso = Math.random() * 100 < tipo.successChance;
  const efeitoMoral = sucesso ? tipo.moraleEffect : tipo.moraleEffectAlt ?? tipo.moraleEffect;

  const novaMoral = Math.max(0, Math.min(100, player.morale + efeitoMoral));
  const novoFisico = Math.max(0, Math.min(100, player.fitness + tipo.fitnessEffect));

  await db.update(players).set({
    morale: novaMoral,
    fitness: novoFisico,
    conversationCooldown: tipo.cooldownRounds,
  }).where(eq(players.id, playerId));

  return { success: sucesso, moraleChange: efeitoMoral, fitnessChange: tipo.fitnessEffect };
}

// Portado de js/components/tactics.js:830-845.
export async function renewContractAction(playerId: number) {
  const { player, team } = await requireOwnPlayer(playerId);
  const custoLuvas = 10000;

  if (team.balance < custoLuvas) throw new Error("Saldo insuficiente para pagar as luvas de renovação.");

  await db.update(teams).set({ balance: team.balance - custoLuvas }).where(eq(teams.id, team.id));
  await db.update(players).set({
    salary: Math.round(player.salary * 1.15),
    morale: 100,
  }).where(eq(players.id, playerId));
}

// Portado de js/components/tactics.js:847-852.
export async function toggleTransferListedAction(playerId: number) {
  const { player } = await requireOwnPlayer(playerId);
  await db.update(players).set({ transferListed: !player.transferListed }).where(eq(players.id, playerId));
}

// Portado de js/components/tactics.js:854-873. Diferente do antigo (que apagava o
// jogador do jogo): aqui ele vira agente livre (teamId nulo), disponível pro mercado
// (Fase 4) — o schema já suporta times sem clube.
export async function terminateContractAction(playerId: number) {
  const { player, team } = await requireOwnPlayer(playerId);
  const multa = Math.round(player.salary * 5);

  if (team.balance < multa) throw new Error(`Saldo insuficiente. É necessário ${multa} para pagar a multa rescisória.`);

  await db.update(teams).set({ balance: team.balance - multa }).where(eq(teams.id, team.id));
  await db.update(players).set({ teamId: null, characteristic: null, transferListed: false }).where(eq(players.id, playerId));
}

// Portado de js/components/tactics.js:875-901.
export async function returnLoanedPlayerAction(playerId: number) {
  const { player } = await requireOwnPlayer(playerId);
  if (!player.loanFromTeamId) throw new Error("Este jogador não está emprestado.");
  await returnPlayerFromLoan(playerId);
}
