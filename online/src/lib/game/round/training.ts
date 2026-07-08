import { db } from "@/db";
import { players, teams } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";

const CHANCE_EVOLUCAO_JOVEM = 0.2;
const IDADE_LIMITE_PROMESSA = 23;

// Aplica o efeito do foco de treino escolhido pelo técnico ANTES da partida da
// rodada ser simulada (o bônus tático só faz sentido se existir quando o motor
// calcula o poder do time). Portado de js/main.js:773-855, adaptado de "por dia" (o
// antigo tinha 7 dias por rodada) para "uma vez por rodada".
export async function applyTrainingBeforeMatch(teamId: number, focus: string): Promise<string[]> {
  const log: string[] = [];

  if (focus === "fisico") {
    const squad = await db.select().from(players).where(eq(players.teamId, teamId));
    for (const p of squad) {
      await db.update(players).set({ fitness: Math.min(100, p.fitness + 3) }).where(eq(players.id, p.id));
    }
    log.push("Treino físico: +3% de condição física para todo o elenco.");
  } else if (focus === "tatico") {
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (team) {
      await db.update(teams).set({ tacticalBonus: team.tacticalBonus + 1 }).where(eq(teams.id, teamId));
      log.push("Treino tático: +1% de organização defensiva acumulado para a próxima partida.");
    }
  } else if (focus === "tecnico") {
    const jovens = await db.select().from(players).where(and(eq(players.teamId, teamId), lt(players.age, IDADE_LIMITE_PROMESSA)));
    for (const jovem of jovens) {
      if (Math.random() < CHANCE_EVOLUCAO_JOVEM) {
        await db.update(players).set({ strength: jovem.strength + 1 }).where(eq(players.id, jovem.id));
        log.push(`${jovem.name} evoluiu (+1 de força) com o treino técnico!`);
      }
    }
  } else if (focus === "descanso") {
    const squad = await db.select().from(players).where(eq(players.teamId, teamId));
    for (const p of squad) {
      await db.update(players).set({
        morale: Math.min(100, p.morale + 5),
        fitness: Math.min(100, p.fitness + 5),
      }).where(eq(players.id, p.id));
    }
    log.push("Folga e gestão de grupo: +5 de moral e +5% de condição física para o elenco.");
  }

  return log;
}

// O bônus tático "reseta no dia da partida" — ou seja, some depois de ser usado na
// simulação desta rodada, independentemente do foco atual.
export async function resetTacticalBonusAfterMatch(teamId: number) {
  await db.update(teams).set({ tacticalBonus: 0 }).where(eq(teams.id, teamId));
}
