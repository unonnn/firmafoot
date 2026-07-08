'use client';
import { resetCareerAction } from "@/app/actions";
import { signOut } from "next-auth/react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: string;
  unreadCount?: number;
}

export default function Sidebar({ activeTab, setActiveTab, userRole, unreadCount = 0 }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="brand" style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--glass-border)' }}>
        <span className="logo-text">FIRMA<span style={{ color: 'var(--accent-color)' }}>FOOT</span></span>
        <span className="season-badge" style={{ marginLeft: '8px' }}>2026</span>
      </div>

      <nav className="main-nav-vertical">
        <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
        <button className={`nav-btn ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')}>
          Caixa de Entrada
          {unreadCount > 0 && (
            <span className="badge-unread" style={{ background: 'var(--danger-color)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button className={`nav-btn ${activeTab === 'tactics' ? 'active' : ''}`} onClick={() => setActiveTab('tactics')}>
          Plantel & Táticas
        </button>
        <button className={`nav-btn ${activeTab === 'classification' ? 'active' : ''}`} onClick={() => setActiveTab('classification')}>
          Classificação
        </button>
        <button className={`nav-btn ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>
          Mercado
        </button>
        <button className={`nav-btn ${activeTab === 'finances' ? 'active' : ''}`} onClick={() => setActiveTab('finances')}>
          Finanças & Estádio
        </button>
        
        {userRole === 'admin' && (
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger-color)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Área Restrita</span>
            <button className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')} style={{ width: '100%' }}>
              Painel Admin
            </button>
          </div>
        )}
      </nav>

      <div style={{ marginTop: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <form action={resetCareerAction}>
          <button 
            type="submit" 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}
            onClick={(e) => {
              if(!confirm('Tem certeza que deseja RESETAR sua carreira? Todo o progresso do save atual será perdido.')) {
                e.preventDefault();
              }
            }}
          >
            ⚠️ Resetar Carreira
          </button>
        </form>
        <button 
          type="button" 
          onClick={() => signOut({ callbackUrl: '/' })} 
          className="btn btn-secondary btn-sm" 
          style={{ width: '100%' }}
        >
          Sair (Logout)
        </button>
      </div>
    </aside>
  );
}
