import { db } from "@/db";
import { users, teams, gameConfig, sponsors, conversationTypes } from "@/db/schema";
import AdminTabs from "./admin/AdminTabs";

export default async function AdminPanel() {
  const [allUsers, allTeams, allConfig, allSponsors, allConversationTypes] = await Promise.all([
    db.select().from(users).orderBy(users.createdAt),
    db.select().from(teams),
    db.select().from(gameConfig).orderBy(gameConfig.key),
    db.select().from(sponsors).orderBy(sponsors.slot, sponsors.name),
    db.select().from(conversationTypes).orderBy(conversationTypes.key),
  ]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="glow-text" style={{ fontSize: '2rem', margin: 0 }}>Painel de <span>Administração</span></h1>
          <p style={{ color: 'var(--text-muted)' }}>Times, jogadores, catálogos e parâmetros do simulador.</p>
        </div>
      </div>

      <AdminTabs
        users={allUsers}
        teams={allTeams}
        sponsors={allSponsors}
        conversationTypes={allConversationTypes}
        gameConfig={allConfig}
      />
    </div>
  );
}
