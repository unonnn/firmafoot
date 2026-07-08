'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams, league } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { markUserReady, isUserReady, countReady } from "@/lib/redis/readiness";
import { enqueueRoundProcessing } from "@/lib/redis/queue";
import { getConfigValue, CONFIG_KEYS } from "@/lib/game/config";

async function contarTecnicosAtivos(): Promise<number> {
  const rows = await db.select({ userId: teams.userId }).from(teams).where(isNotNull(teams.userId));
  return rows.length;
}

export async function getRoundStatusAction() {
  const [leagueRow] = await db.select().from(league).limit(1);
  if (!leagueRow) return null;

  const session = await auth();
  const [readyCount, totalActive, userIsReady] = await Promise.all([
    countReady(leagueRow.currentRound),
    contarTecnicosAtivos(),
    session?.user?.id ? isUserReady(leagueRow.currentRound, session.user.id) : Promise.resolve(false),
  ]);

  return {
    round: leagueRow.currentRound,
    phase: leagueRow.phase,
    readyCount,
    totalActive,
    userIsReady,
  };
}

// Marca o técnico logado como "pronto" para a rodada atual. Se isso cruzar o
// percentual configurado (game_config: round_ready_threshold_pct, padrão 70%) de
// técnicos humanos ativos, enfileira o processamento da rodada imediatamente — sem
// precisar esperar o cron diário de segurança (ver src/worker.ts).
export async function markReadyAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec?.teamId) throw new Error("Você precisa escolher um time antes de marcar presença na rodada.");

  const [leagueRow] = await db.select().from(league).limit(1);
  if (!leagueRow) throw new Error("Liga não inicializada.");

  await markUserReady(leagueRow.currentRound, session.user.id);
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, session.user.id));

  const [readyCount, totalActive] = await Promise.all([
    countReady(leagueRow.currentRound),
    contarTecnicosAtivos(),
  ]);

  const threshold = await getConfigValue(CONFIG_KEYS.roundReadyThresholdPct, 0.7);
  if (totalActive > 0 && readyCount / totalActive >= threshold) {
    await enqueueRoundProcessing(leagueRow.currentRound, { reason: "readiness" });
  }

  return { round: leagueRow.currentRound, readyCount, totalActive };
}
