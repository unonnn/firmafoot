'use server';
import { db } from "@/db";
import { teams } from "@/db/schema";

export async function getTeamsAction() {
  // Retorna todos os times do banco de dados (40 times)
  return await db.select().from(teams);
}
