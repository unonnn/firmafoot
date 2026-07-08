'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams } from "@/db/schema";
import { eq } from "drizzle-orm";

const FOCOS_VALIDOS = ["fisico", "tatico", "tecnico", "descanso"];

export async function getTrainingFocusAction(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) return "tecnico";

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec?.teamId) return "tecnico";

  const [team] = await db.select({ trainingFocus: teams.trainingFocus }).from(teams).where(eq(teams.id, userRec.teamId));
  return team?.trainingFocus ?? "tecnico";
}

// Efeitos reais são aplicados uma vez por rodada em src/lib/game/round/training.ts;
// esta action só grava a escolha do técnico para a próxima rodada.
export async function setTrainingFocusAction(focus: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");
  if (!FOCOS_VALIDOS.includes(focus)) throw new Error("Foco de treino inválido.");

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!userRec?.teamId) throw new Error("Você precisa escolher um time.");

  await db.update(teams).set({ trainingFocus: focus }).where(eq(teams.id, userRec.teamId));
}
