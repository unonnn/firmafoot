'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams, players, matches, league, standings } from "@/db/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { getStandingsAction } from "./standings";

export async function getDashboardAction() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec?.teamId) return null;

  const [team] = await db.select().from(teams).where(eq(teams.id, userRec.teamId));
  if (!team) return null;

  const [standingsRow] = await db.select().from(standings).where(eq(standings.teamId, team.id));
  const division = standingsRow?.division ?? "A";

  const fullStandings = await getStandingsAction(division);
  const userPos = fullStandings.find((r) => r.teamId === team.id)?.pos ?? 0;
  const top5 = fullStandings.slice(0, 5).map((r) => ({
    pos: r.pos,
    nome: r.team.name,
    pontos: r.points,
    jogos: r.played,
    isUser: r.isUser,
  }));

  const squad = await db.select().from(players).where(eq(players.teamId, team.id));
  const avgStrength = squad.length > 0 ? Math.round((squad.reduce((sum, p) => sum + p.strength, 0) / squad.length) * 10) / 10 : 0;

  const [leagueRow] = await db.select().from(league).limit(1);
  const round = leagueRow?.currentRound ?? 1;
  const seasonYear = leagueRow?.seasonYear ?? new Date().getFullYear();

  const [nextMatch] = await db.select().from(matches).where(
    and(eq(matches.round, round), or(eq(matches.homeTeamId, team.id), eq(matches.awayTeamId, team.id)))
  );

  let nextMatchInfo = null;
  if (nextMatch) {
    const isHome = nextMatch.homeTeamId === team.id;
    const opponentId = isHome ? nextMatch.awayTeamId : nextMatch.homeTeamId;
    const [opponent] = await db.select().from(teams).where(eq(teams.id, opponentId));
    if (opponent) {
      nextMatchInfo = {
        opponentName: opponent.name,
        opponentPrimaryColor: opponent.primaryColor,
        opponentReputation: opponent.reputation,
        isHome,
        stadium: isHome ? team.stadium : opponent.stadium,
      };
    }
  }

  const topScorersRaw = await db
    .select({ id: players.id, name: players.name, position: players.position, goals: players.goals, teamName: teams.name })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .innerJoin(standings, eq(standings.teamId, teams.id))
    .where(and(eq(standings.division, division)))
    .orderBy(desc(players.goals))
    .limit(5);

  return {
    team: {
      name: team.name,
      stadium: team.stadium,
      capacity: team.capacity,
      formation: team.formation,
    },
    division,
    round,
    seasonYear,
    userPos,
    avgStrength,
    squadCount: squad.length,
    nextMatch: nextMatchInfo,
    top5,
    topScorers: topScorersRaw.filter((p) => p.goals > 0),
  };
}
