'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Aceita um convite de emprego de outro clube (gerado em
// src/lib/game/round/confidence.ts, seja por confiança alta ou por demissão).
// Portado do fluxo de "propostasEmprego" de js/main.js:373-417.
export async function acceptJobOfferAction(messageId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const [msg] = await db.select().from(messages).where(eq(messages.id, messageId));
  if (!msg || msg.userId !== session.user.id) throw new Error("Mensagem não encontrada.");
  if (msg.actionType !== "job_offer" || msg.actionDone) throw new Error("Esta proposta já foi resolvida.");

  const data = msg.actionData as { teamId: number };
  const [novoTime] = await db.select().from(teams).where(eq(teams.id, data.teamId));
  if (!novoTime) throw new Error("Esse clube não existe mais.");
  if (novoTime.userId) throw new Error("Esse clube já foi assumido por outro técnico.");

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (userRec?.teamId) {
    await db.update(teams).set({ userId: null }).where(eq(teams.id, userRec.teamId));
  }

  await db.update(teams).set({ userId: session.user.id, boardConfidence: 70 }).where(eq(teams.id, novoTime.id));
  await db.update(users).set({ teamId: novoTime.id }).where(eq(users.id, session.user.id));

  await db.update(messages).set({ actionDone: true }).where(
    and(eq(messages.userId, session.user.id), eq(messages.actionType, "job_offer"), eq(messages.actionDone, false))
  );

  revalidatePath("/");
  return { teamName: novoTime.name };
}

export async function rejectJobOfferAction(messageId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado.");

  const [msg] = await db.select().from(messages).where(eq(messages.id, messageId));
  if (!msg || msg.userId !== session.user.id) throw new Error("Mensagem não encontrada.");

  await db.update(messages).set({ actionDone: true }).where(eq(messages.id, messageId));
}
