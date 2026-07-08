'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams, matches } from "@/db/schema";
import { eq, or, and, desc } from "drizzle-orm";

// Última partida já disputada pelo time do usuário — usada pelo botão "Assistir
// Última Partida" no Dashboard (tela de partida ao vivo, ver /api/match/[id]/live).
export async function getLastPlayedMatchAction() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec?.teamId) return null;

  const [team] = await db.select().from(teams).where(eq(teams.id, userRec.teamId));
  if (!team) return null;

  const [match] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.played, true), or(eq(matches.homeTeamId, team.id), eq(matches.awayTeamId, team.id))))
    .orderBy(desc(matches.round))
    .limit(1);

  if (!match) return null;

  const isHome = match.homeTeamId === team.id;
  const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
  const [opponent] = await db.select().from(teams).where(eq(teams.id, opponentId));

  return {
    id: match.id,
    round: match.round,
    isHome,
    opponentName: opponent?.name ?? "Adversário",
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    teamName: team.name,
  };
}
