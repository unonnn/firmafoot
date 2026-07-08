'use server';
import { signIn, signOut, auth } from "@/auth";
import { db } from "@/db";
import { users, teams, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const username = formData.get("username");
  if (!username) return;

  await signIn("credentials", {
    username,
    redirectTo: "/",
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function assignTeamAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const teamBaseId = formData.get("teamBaseId") as string;
  const teamName = formData.get("teamName") as string;

  // Em vez de criar um novo, atualiza um time existente do campeonato
  const teamIdNum = parseInt(teamBaseId);
  if (isNaN(teamIdNum)) return;

  await db.update(teams).set({ userId: session.user.id }).where(eq(teams.id, teamIdNum));

  // Atualiza o user com o teamId
  await db.update(users).set({ teamId: teamIdNum }).where(eq(users.id, session.user.id));

  // Gera emails iniciais
  await db.insert(messages).values([
    {
      userId: session.user.id,
      sender: 'Diretoria (Presidente)',
      subject: 'Expectativas da Temporada',
      content: `Bem-vindo ao ${teamName}.\n\nEsperamos que você consiga no mínimo uma vaga na libertadores neste ano. O investimento foi alto e a torcida exige resultados imediatos.\n\nConfio no seu trabalho!\n\nSaudações,\nA Diretoria.`,
    },
    {
      userId: session.user.id,
      sender: 'Departamento Médico',
      subject: 'Relatório de Lesões',
      content: 'Treinador,\n\nFelizmente, não temos nenhum jogador no DM atualmente. O trabalho físico da pré-temporada foi excelente e todos estão à disposição para a estreia.\n\nFicaremos de olho na fadiga dos atletas.\n\nDr. Roberto (Chefe do DM)',
    }
  ]);

  revalidatePath("/");
}

export async function resetCareerAction() {
  const session = await auth();
  if (!session?.user?.id) return;

  const userRecord = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

  if (userRecord[0] && userRecord[0].teamId) {
    const tId = userRecord[0].teamId;

    // 1. Remove o time do user
    await db.update(users).set({ teamId: null }).where(eq(users.id, session.user.id));

    // 2. Retira a posse do time, deixando-o disponível para outro jogador assumir (o progresso fica salvo!)
    await db.update(teams).set({ userId: null }).where(eq(teams.id, tId));

    // 3. Deleta mensagens pessoais do usuário
    await db.delete(messages).where(eq(messages.userId, session.user.id));
  }

  revalidatePath("/");
}
