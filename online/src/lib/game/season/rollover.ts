import { db } from "@/db";
import { teams, standings, matches, players, championsHistory, league, messages } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { generateRoundRobin } from "./calendar";

const TIMES_PROMOVIDOS_REBAIXADOS = 4;

async function getSortedStandings(division: string) {
  const rows = await db.select().from(standings).where(eq(standings.division, division));
  return rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    const sgA = a.goalsFor - a.goalsAgainst;
    const sgB = b.goalsFor - b.goalsAgainst;
    if (sgB !== sgA) return sgB - sgA;
    return b.goalsFor - a.goalsFor;
  });
}

// Vira a temporada: registra os campeões, promove/rebaixa 4 times entre Série A e B,
// zera estatísticas anuais dos jogadores, gera um calendário novo e reinicia o
// relógio da liga. Portado de js/main.js:1658-1769 (recomecarTemporada), adaptado
// para o mundo compartilhado com duas divisões reais (o antigo não tinha acesso/
// rebaixamento entre divisões — isso é um adendo desta migração, coerente com o
// README, que já falava de Série A/B).
export async function performSeasonRollover() {
  const [leagueRow] = await db.select().from(league).limit(1);
  if (!leagueRow) throw new Error("Liga não inicializada.");

  const standingsA = await getSortedStandings("A");
  const standingsB = await getSortedStandings("B");

  if (standingsA[0]) {
    await db.insert(championsHistory).values({ year: leagueRow.seasonYear, division: "A", teamId: standingsA[0].teamId });
  }
  if (standingsB[0]) {
    await db.insert(championsHistory).values({ year: leagueRow.seasonYear, division: "B", teamId: standingsB[0].teamId });
  }

  const rebaixadosIds = standingsA.slice(-TIMES_PROMOVIDOS_REBAIXADOS).map((s) => s.teamId);
  const promovidosIds = standingsB.slice(0, TIMES_PROMOVIDOS_REBAIXADOS).map((s) => s.teamId);

  const permanecemA = standingsA.map((s) => s.teamId).filter((id) => !rebaixadosIds.includes(id));
  const permanecemB = standingsB.map((s) => s.teamId).filter((id) => !promovidosIds.includes(id));

  const novaSerieA = [...permanecemA, ...promovidosIds];
  const novaSerieB = [...permanecemB, ...rebaixadosIds];

  // Zera estatísticas anuais de todo mundo (portado de js/main.js:~1660-1700).
  await db.update(players).set({ goals: 0, assists: 0, matchesPlayed: 0 });

  // Reseta a classificação com a composição nova das divisões.
  await db.delete(standings);
  for (const teamId of novaSerieA) {
    await db.insert(standings).values({ teamId, division: "A" });
  }
  for (const teamId of novaSerieB) {
    await db.insert(standings).values({ teamId, division: "B" });
  }

  // Gera o calendário da nova temporada.
  await db.delete(matches);
  const fixturesA = generateRoundRobin(novaSerieA.map((id) => ({ id })), "A");
  const fixturesB = generateRoundRobin(novaSerieB.map((id) => ({ id })), "B");
  const todasPartidas = [...fixturesA, ...fixturesB];

  const chunkSize = 100;
  for (let i = 0; i < todasPartidas.length; i += chunkSize) {
    await db.insert(matches).values(todasPartidas.slice(i, i + chunkSize));
  }

  await db.update(league).set({
    seasonYear: leagueRow.seasonYear + 1,
    currentRound: 1,
    phase: "in_season",
    updatedAt: new Date(),
  }).where(eq(league.id, leagueRow.id));

  // Avisa os técnicos humanos sobre o resultado da temporada.
  const timesComTecnico = await db.select().from(teams).where(isNotNull(teams.userId));
  for (const t of timesComTecnico) {
    let aviso: string;
    if (rebaixadosIds.includes(t.id)) {
      aviso = "Infelizmente seu time foi rebaixado para a Série B.";
    } else if (promovidosIds.includes(t.id)) {
      aviso = "Parabéns! Seu time foi promovido para a Série A.";
    } else {
      aviso = "Seu time se mantém na mesma divisão.";
    }

    await db.insert(messages).values({
      userId: t.userId!,
      sender: "Confederação Brasileira de Futebol",
      subject: `Temporada ${leagueRow.seasonYear} encerrada!`,
      content: `A temporada ${leagueRow.seasonYear} chegou ao fim. ${aviso} Um novo calendário para ${leagueRow.seasonYear + 1} já está disponível.`,
    });
  }

  return {
    seasonEnded: leagueRow.seasonYear,
    campeaoA: standingsA[0]?.teamId ?? null,
    campeaoB: standingsB[0]?.teamId ?? null,
    promovidos: promovidosIds,
    rebaixados: rebaixadosIds,
  };
}
