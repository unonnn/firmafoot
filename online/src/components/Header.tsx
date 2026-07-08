'use client';

interface HeaderProps {
  team?: {
    name: string;
    balance: number;
    primaryColor?: string | null;
    boardConfidence: number;
  };
}

function corConfianca(confidence: number) {
  if (confidence >= 60) return 'var(--success-color)';
  if (confidence >= 30) return 'var(--warning-color)';
  return 'var(--danger-color)';
}

export default function Header({ team }: HeaderProps) {
  return (
    <header className="app-header" style={{ justifyContent: 'flex-end' }}>
      <div className="header-user-info">
        <div className="club-indicator" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <span className="club-color-dot" id="user-club-color" style={{ background: team?.primaryColor || 'var(--accent-color)' }}></span>
            <span id="user-club-name" style={{fontWeight: 700}}>{team?.name || 'Desconhecido'}</span>
          </div>
          <span id="user-board-confidence" style={{fontSize: '0.7rem', color: corConfianca(team?.boardConfidence ?? 70), fontWeight: 600}} title="Confiança da Diretoria">
            Diretoria: {team?.boardConfidence ?? 70}%
          </span>
        </div>
        <div className="balance-badge" id="user-club-balance">
          {team?.balance ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(team.balance) : 'R$ 0'}
        </div>
      </div>
    </header>
  );
}
