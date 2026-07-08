'use server';
import { db } from "@/db";
import { users, teams } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cached } from "@/lib/redis/cache";

// Ranking global de técnicos humanos — substitui o antigo "Firmafoot Cloud"
// (js/components/dashboard.js:167-250, que buscava de um /api/leaderboard próprio).
// No mundo compartilhado isso é só uma consulta direta: todo técnico é uma linha real.
// Cacheado por 30s no Redis (com fallback direto se Redis estiver fora do ar).
export async function getLeaderboardAction() {
  return cached("leaderboard:global", async () => {
    return db
      .select({
        userName: users.name,
        teamName: teams.name,
        boardConfidence: teams.boardConfidence,
        balance: teams.balance,
        reputation: teams.reputation,
      })
      .from(teams)
      .innerJoin(users, eq(teams.userId, users.id))
      .orderBy(desc(teams.boardConfidence));
  }, 30);
}
