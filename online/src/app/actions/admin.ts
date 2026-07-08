'use server';
import { auth } from "@/auth";
import { db } from "@/db";
import { gameConfig, sponsors, conversationTypes, teams, players } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { invalidateConfigCache } from "@/lib/game/config";

async function requireAdmin() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") {
    throw new Error("Apenas administradores podem fazer isso.");
  }
}

export async function getGameConfigAction() {
  await requireAdmin();
  return db.select().from(gameConfig).orderBy(gameConfig.key);
}

export async function updateGameConfigAction(key: string, value: number) {
  await requireAdmin();
  if (!Number.isFinite(value)) throw new Error("Valor inválido.");

  await db.update(gameConfig).set({ value }).where(eq(gameConfig.key, key));
  await invalidateConfigCache();
  revalidatePath("/");
}

// --- PATROCINADORES (sponsors) --- //

export async function getSponsorsAdminAction() {
  await requireAdmin();
  return db.select().from(sponsors).orderBy(sponsors.slot, sponsors.name);
}

export async function createSponsorAction(data: typeof sponsors.$inferInsert) {
  await requireAdmin();
  await db.insert(sponsors).values(data);
  revalidatePath("/");
}

export async function updateSponsorAction(id: number, data: Partial<typeof sponsors.$inferInsert>) {
  await requireAdmin();
  await db.update(sponsors).set(data).where(eq(sponsors.id, id));
  revalidatePath("/");
}

export async function deleteSponsorAction(id: number) {
  await requireAdmin();
  await db.delete(sponsors).where(eq(sponsors.id, id));
  revalidatePath("/");
}

// --- TIPOS DE CONVERSA (conversation_types) --- //

export async function getConversationTypesAdminAction() {
  await requireAdmin();
  return db.select().from(conversationTypes).orderBy(conversationTypes.key);
}

export async function createConversationTypeAction(data: typeof conversationTypes.$inferInsert) {
  await requireAdmin();
  await db.insert(conversationTypes).values(data);
  revalidatePath("/");
}

export async function updateConversationTypeAction(id: number, data: Partial<typeof conversationTypes.$inferInsert>) {
  await requireAdmin();
  await db.update(conversationTypes).set(data).where(eq(conversationTypes.id, id));
  revalidatePath("/");
}

export async function deleteConversationTypeAction(id: number) {
  await requireAdmin();
  await db.delete(conversationTypes).where(eq(conversationTypes.id, id));
  revalidatePath("/");
}

// --- TIMES (edição administrativa) --- //

export async function updateTeamAdminAction(id: number, data: Partial<typeof teams.$inferInsert>) {
  await requireAdmin();
  await db.update(teams).set(data).where(eq(teams.id, id));
  revalidatePath("/");
}

// Libera um clube do técnico atual (uso administrativo — ex: resolver disputa/abandono).
export async function releaseTeamAdminAction(id: number) {
  await requireAdmin();
  await db.update(teams).set({ userId: null }).where(eq(teams.id, id));
  revalidatePath("/");
}

// --- JOGADORES (busca + edição administrativa) --- //
// Sem listagem completa de propósito: o banco tem 1300+ jogadores reais, então o
// admin busca por nome em vez de rolar uma tabela gigante.

export async function searchPlayersAdminAction(query: string) {
  await requireAdmin();
  if (!query || query.trim().length < 2) return [];
  return db.select().from(players).where(ilike(players.name, `%${query.trim()}%`)).limit(25);
}

export async function updatePlayerAdminAction(id: number, data: Partial<typeof players.$inferInsert>) {
  await requireAdmin();
  await db.update(players).set(data).where(eq(players.id, id));
  revalidatePath("/");
}
