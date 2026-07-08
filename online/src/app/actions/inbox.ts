'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getMessagesAction() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await db.select().from(messages).where(eq(messages.userId, session.user.id)).orderBy(desc(messages.date));
}

export async function markMessageAsReadAction(messageId: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId));
  revalidatePath("/");
}

export async function deleteMessageAction(messageId: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db.delete(messages).where(eq(messages.id, messageId));
  revalidatePath("/");
}
