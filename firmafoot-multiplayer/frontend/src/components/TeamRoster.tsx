import React, { useEffect, useState } from 'react';

interface Player {
  id: string;
  nome: string;
  posicao: string;
  forca: number;
  salario: number;
  valorMercado: number;
}

interface TeamRosterProps {
  managerId: string;
  apiUrl?: string;
}

export const TeamRoster: React.FC<TeamRosterProps> = ({ managerId, apiUrl = 'http://localhost:3000' }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamName, setTeamName] = useState<string>('');
  const [stadium, setStadium] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/teams/manager/${managerId}`);
        if (!response.ok) {
          throw new Error('Falha ao carregar elenco do time.');
        }
        const data = await response.json();
        
        setTeamName(data.nome);
        setStadium(data.estadio);
        setPlayers(data.jogadores || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
  }, [managerId, apiUrl]);

  if (loading) return <div className="loading" style={{ color: '#aaa', padding: '20px' }}>Carregando elenco do time...</div>;
  if (error) return <div className="error-message" style={{ color: '#ff3366', padding: '20px' }}>Erro: {error}</div>;

  return (
    <div className="team-roster-container" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <header style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{teamName}</h2>
        <span style={{ fontSize: '0.85rem', color: '#888' }}>🏟️ Estádio: {stadium}</span>
      </header>

      <div className="roster-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
        {players.length === 0 ? (
          <p style={{ color: '#888' }}>Nenhum jogador cadastrado neste elenco.</p>
        ) : (
          players.map((player) => (
            <div 
              key={player.id} 
              className="player-card" 
              style={{
                background: 'rgba(255,255,255,0.04)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#fff', fontSize: '1rem' }}>{player.nome}</strong>
                <span 
                  style={{
                    background: '#0070f3',
                    color: '#fff',
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}
                >
                  {player.posicao}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                <span>Força (OVR): <strong style={{ color: '#00ff66' }}>{player.forca}</strong></span>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '4px', display: 'flex', flexDirection: 'column' }}>
                <span>Salário: R$ {player.salario.toLocaleString('pt-BR')}/rodada</span>
                <span>Val. Mercado: R$ {player.valorMercado.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
