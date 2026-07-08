import { auth } from "@/auth";
import { db } from "@/db";
import { users, teams, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import LoginView from "@/components/LoginView";
import TeamSelectionView from "@/components/TeamSelectionView";
import GameClient from "@/components/GameClient";
import AdminPanel from "@/components/AdminPanel";

export default async function Home() {
  const session = await auth();

  // If no session, show the login form
  if (!session?.user?.id) {
    return <LoginView />;
  }

  // Fetch the latest user state from DB
  const userRecord = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const currentUser = userRecord[0];

  if (!currentUser) {
    return <LoginView />;
  }

  // Se o treinador não tem um time associado, mostrar a tela de seleção
  if (!currentUser.teamId) {
    return <TeamSelectionView />;
  }

  // Fetch the user's team
  const teamRecord = await db.select().from(teams).where(eq(teams.id, currentUser.teamId)).limit(1);
  const currentTeam = teamRecord[0];

  // Fetch unread messages count
  const unreadMessages = await db.select().from(messages).where(
    and(
      eq(messages.userId, session.user.id),
      eq(messages.isRead, false)
    )
  );
  const unreadCount = unreadMessages.length;

  // If logged in and has a team, show the main game client
  return (
    <GameClient 
      user={currentUser} 
      team={currentTeam}
      unreadCount={unreadCount}
      adminPanel={currentUser.role === 'admin' ? <AdminPanel /> : undefined}
    />
  );
}
