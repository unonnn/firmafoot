'use client';
import { useState } from 'react';
import AdminUsersPanel from './AdminUsersPanel';
import AdminTeamsPanel from './AdminTeamsPanel';
import AdminSponsorsPanel from './AdminSponsorsPanel';
import AdminConversationsPanel from './AdminConversationsPanel';
import AdminPlayersPanel from './AdminPlayersPanel';
import AdminConfigPanel from '../AdminConfigPanel';

type Tab = 'usuarios' | 'times' | 'patrocinios' | 'conversas' | 'jogadores' | 'config';

const ABAS: { key: Tab; label: string }[] = [
  { key: 'usuarios', label: 'Treinadores' },
  { key: 'times', label: 'Times' },
  { key: 'patrocinios', label: 'Patrocinadores' },
  { key: 'conversas', label: 'Conversas' },
  { key: 'jogadores', label: 'Jogadores' },
  { key: 'config', label: 'Parâmetros' },
];

interface AdminTabsProps {
  users: any[];
  teams: any[];
  sponsors: any[];
  conversationTypes: any[];
  gameConfig: any[];
}

export default function AdminTabs({ users, teams, sponsors, conversationTypes, gameConfig }: AdminTabsProps) {
  const [tab, setTab] = useState<Tab>('usuarios');

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {ABAS.map((a) => (
          <button key={a.key} className={`btn btn-sm ${tab === a.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(a.key)}>
            {a.label}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && <AdminUsersPanel users={users} teams={teams} />}
      {tab === 'times' && <AdminTeamsPanel initial={teams} />}
      {tab === 'patrocinios' && <AdminSponsorsPanel initial={sponsors} />}
      {tab === 'conversas' && <AdminConversationsPanel initial={conversationTypes} />}
      {tab === 'jogadores' && <AdminPlayersPanel />}
      {tab === 'config' && <AdminConfigPanel initialConfig={gameConfig} />}
    </div>
  );
}
