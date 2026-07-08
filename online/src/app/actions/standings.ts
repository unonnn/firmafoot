'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams, standings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getStandingsAction(division: string = 'A') {
  const session = await auth();
  const userId = session?.user?.id;

  let userTeamId: number | null = null;
  if (userId) {
    const [userRec] = await db.select().from(users).where(eq(users.id, userId));
    if (userRec) userTeamId = userRec.teamId;
  }

  // Join standings with teams
  const results = await db.select({
    id: standings.id,
    teamId: standings.teamId,
    division: standings.division,
    points: standings.points,
    played: standings.played,
    won: standings.won,
    drawn: standings.drawn,
    lost: standings.lost,
    goalsFor: standings.goalsFor,
    goalsAgainst: standings.goalsAgainst,
    team: teams,
  })
  .from(standings)
  .innerJoin(teams, eq(standings.teamId, teams.id))
  .where(eq(standings.division, division));

  // Ordenar: Pontos > Vitórias > Saldo de Gols > Gols Pró
  const sorted = results.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    const sgA = a.goalsFor - a.goalsAgainst;
    const sgB = b.goalsFor - b.goalsAgainst;
    if (sgB !== sgA) return sgB - sgA;
    return b.goalsFor - a.goalsFor;
  });

  return sorted.map((row, index) => ({
    ...row,
    pos: index + 1,
    sg: row.goalsFor - row.goalsAgainst,
    isUser: row.teamId === userTeamId
  }));
}
