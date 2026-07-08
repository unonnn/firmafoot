import { db } from "@/db";
import { standings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Atualiza a linha de classificação de um time com o resultado de uma partida.
// Portado de js/state.js:91-119 (critério de desempate oficial: Pontos > Vitórias >
// Saldo de Gols > Gols Pró é aplicado na hora de ORDENAR, em getStandingsAction).
export async function applyMatchResultToStandings(
  division: string,
  homeTeamId: number,
  awayTeamId: number,
  homeGoals: number,
  awayGoals: number
) {
  const [homeRow] = await db.select().from(standings).where(and(eq(standings.teamId, homeTeamId), eq(standings.division, division)));
  const [awayRow] = await db.select().from(standings).where(and(eq(standings.teamId, awayTeamId), eq(standings.division, division)));
  if (!homeRow || !awayRow) {
    throw new Error(`Linha de classificação ausente para o time ${homeTeamId} ou ${awayTeamId} na divisão ${division}`);
  }

  let homeWon = 0, homeDrawn = 0, homeLost = 0, homePoints = 0;
  let awayWon = 0, awayDrawn = 0, awayLost = 0, awayPoints = 0;

  if (homeGoals > awayGoals) {
    homeWon = 1; homePoints = 3; awayLost = 1;
  } else if (homeGoals < awayGoals) {
    awayWon = 1; awayPoints = 3; homeLost = 1;
  } else {
    homeDrawn = 1; awayDrawn = 1; homePoints = 1; awayPoints = 1;
  }

  await db.update(standings).set({
    played: homeRow.played + 1,
    won: homeRow.won + homeWon,
    drawn: homeRow.drawn + homeDrawn,
    lost: homeRow.lost + homeLost,
    points: homeRow.points + homePoints,
    goalsFor: homeRow.goalsFor + homeGoals,
    goalsAgainst: homeRow.goalsAgainst + awayGoals,
    updatedAt: new Date(),
  }).where(eq(standings.id, homeRow.id));

  await db.update(standings).set({
    played: awayRow.played + 1,
    won: awayRow.won + awayWon,
    drawn: awayRow.drawn + awayDrawn,
    lost: awayRow.lost + awayLost,
    points: awayRow.points + awayPoints,
    goalsFor: awayRow.goalsFor + awayGoals,
    goalsAgainst: awayRow.goalsAgainst + homeGoals,
    updatedAt: new Date(),
  }).where(eq(standings.id, awayRow.id));
}

// Posição atual de um time na tabela (1-based), usada por finanças (royalties de
// material esportivo) e confiança da diretoria.
export async function getTeamRank(division: string, teamId: number): Promise<number> {
  const rows = await db.select().from(standings).where(eq(standings.division, division));
  const sorted = rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    const sgA = a.goalsFor - a.goalsAgainst;
    const sgB = b.goalsFor - b.goalsAgainst;
    if (sgB !== sgA) return sgB - sgA;
    return b.goalsFor - a.goalsFor;
  });
  const idx = sorted.findIndex((r) => r.teamId === teamId);
  return idx === -1 ? sorted.length : idx + 1;
}
