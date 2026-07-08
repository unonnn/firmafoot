import { db } from "@/db";
import { players, teams } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TAXA_LEI_DO_EX } from "../market/negotiate";

// "Lei do ex": jogador emprestado que enfrenta o clube de origem precisa de uma multa
// de 2% do valor de mercado pra poder jogar. Mencionado no README do jogo original
// mas nunca chegou a ser implementado lá — implementado aqui pela primeira vez.
// Cobra automaticamente se o time tiver saldo; senão, o jogador fica indisponível
// só para ESTA partida (não conta como lesão/suspensão real).
// Retorna os ids dos jogadores barrados por falta de saldo pra pagar a multa.
export async function applyLeiDoEx(teamId: number, opponentTeamId: number): Promise<number[]> {
  const afetados = await db.select().from(players).where(
    and(eq(players.teamId, teamId), eq(players.loanFromTeamId, opponentTeamId))
  );
  if (afetados.length === 0) return [];

  const barrados: number[] = [];

  for (const p of afetados) {
    const multa = Math.round(p.value * TAXA_LEI_DO_EX);
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (team && team.balance >= multa) {
      await db.update(teams).set({ balance: team.balance - multa }).where(eq(teams.id, teamId));
    } else {
      barrados.push(p.id);
    }
  }

  return barrados;
}
