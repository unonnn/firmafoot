'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, players, teams } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSquadAction() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec || !userRec.teamId) return [];

  return await db.select().from(players).where(eq(players.teamId, userRec.teamId));
}

// Retorna o esquema tático salvo do time do usuário (ex: "4-4-2"). Usado pela tela de
// Táticas para restaurar a formação entre sessões — antes ficava só em estado local do React.
export async function getFormationAction(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) return "4-4-2";

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec || !userRec.teamId) return "4-4-2";

  const [team] = await db.select({ formation: teams.formation }).from(teams).where(eq(teams.id, userRec.teamId));
  return team?.formation ?? "4-4-2";
}

// Retorna os nomes dos jogadores que a UI tentou escalar como titulares mas que
// foram rebaixados pra reserva por estarem lesionados/suspensos — a UI já bloqueia
// isso no drag-and-drop, mas validamos de novo aqui (defesa em profundidade contra
// chamadas diretas da action). Portado da checagem de js/components/tactics.js:131-134.
export async function saveTacticsAction(
  squadUpdates: { id: number; status: string }[],
  formation?: string
): Promise<{ rejected: string[] }> {
  const session = await auth();
  if (!session?.user?.id) return { rejected: [] };

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec?.teamId) return { rejected: [] };

  const squad = await db.select().from(players).where(eq(players.teamId, userRec.teamId));
  const squadMap = new Map(squad.map((p) => [p.id, p]));

  const rejected: string[] = [];

  for (const upd of squadUpdates) {
    const player = squadMap.get(upd.id);
    if (!player) continue;

    let status = upd.status;
    if (status.startsWith("pitch-")) {
      const indisponivel = player.isInjured || player.redCard || player.yellowCards >= 2;
      if (indisponivel) {
        status = "reserva";
        rejected.push(player.name);
      }
    }

    await db.update(players).set({ characteristic: status }).where(eq(players.id, upd.id));
  }

  if (formation) {
    await db.update(teams).set({ formation }).where(eq(teams.id, userRec.teamId));
  }

  return { rejected };
}
