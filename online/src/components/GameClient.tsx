'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Tactics from '@/components/Tactics';
import Market from '@/components/Market';
import Finances from '@/components/Finances';
import Classification from '@/components/Classification';
import Inbox from '@/components/Inbox';

interface GameClientProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  team?: {
    name: string;
    balance: number;
    primaryColor?: string | null;
    boardConfidence: number;
  };
  unreadCount?: number;
  adminPanel?: React.ReactNode;
}

export default function GameClient({ user, team, unreadCount: initialUnreadCount = 0, adminPanel }: GameClientProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  return (
    <div className="app-layout">
      {/* Sidebar Component */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user.role} unreadCount={unreadCount} />
      
      {/* Main Content Area */}
      <div className="main-content-area">
        {/* Header Component */}
        <Header team={team} />
        


        {/* Conteúdo Principal Dinâmico */}
        <main className="app-content">
          <section id="conteudo-tela" className="glass-card fade-in" style={{ padding: '0', border: 'none', background: 'transparent' }}>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'inbox' && <Inbox setUnreadCount={setUnreadCount} />}
            {activeTab === 'tactics' && <Tactics />}
            {activeTab === 'classification' && <Classification />}
            {activeTab === 'market' && <Market />}
            {activeTab === 'finances' && <Finances />}
            {activeTab === 'admin' && adminPanel}
          </section>
        </main>
      </div>
    </div>
  );
}
