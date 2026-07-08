'use client';
import { useState, useEffect } from 'react';
import { assignTeamAction, getTeamsAction } from '@/app/actions';

export default function TeamSelectionView() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    getTeamsAction().then(data => {
      setTeams(data);
      setLoadingTeams(false);
    });
  }, []);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('teamBaseId', selectedTeam.toString());
    
    const t = teams.find(t => t.id === selectedTeam);
    formData.append('teamName', t?.name || '');
    
    await assignTeamAction(formData);
  };

  const serieA = teams.filter(t => t.reputation >= 80);
  const serieB = teams.filter(t => t.reputation < 80);

  return (
    <div id="tela-inicial" className="screen active">
      <div className="glass-container text-center hero-section">
        <h1 className="title" style={{ fontSize: '3rem', marginBottom: '10px' }}>Assuma o Controle</h1>
        <p className="subtitle">Selecione o clube que você deseja treinar</p>
        
        <div style={{ marginTop: '40px', maxHeight: '500px', overflowY: 'auto', padding: '10px' }}>
          {loadingTeams ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>Carregando times do campeonato...</div>
          ) : (
            <>
              {/* Série A */}
              <h2 style={{ textAlign: 'left', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Série A</h2>
              <div className="grid-teams" style={{ marginBottom: '30px' }}>
                {serieA.map(t => {
                  const isTaken = t.userId !== null;
                  return (
                    <div 
                      key={t.id}
                      className={`team-selection-card ${selectedTeam === t.id ? 'selected' : ''}`}
                      onClick={() => !isTaken && setSelectedTeam(t.id)}
                      style={{ 
                        opacity: isTaken ? 0.5 : 1, 
                        cursor: isTaken ? 'not-allowed' : 'pointer', 
                        position: 'relative',
                        padding: '15px',
                        background: 'rgba(255,255,255,0.05)',
                        border: selectedTeam === t.id ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt={t.name} width="60" height="60" style={{ objectFit: 'contain', marginBottom: '10px' }} />
                        ) : null}
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{t.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.acronym}</div>
                      </div>
                      {isTaken && <div style={{position: 'absolute', top: 5, right: 5, fontSize: '0.6rem', background: 'var(--danger-color)', color: '#fff', padding: '2px 4px', borderRadius: '4px'}}>Ocupado</div>}
                    </div>
                  );
                })}
              </div>

              {/* Série B */}
              <h2 style={{ textAlign: 'left', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Série B</h2>
              <div className="grid-teams">
                {serieB.map(t => {
                  const isTaken = t.userId !== null;
                  return (
                    <div 
                      key={t.id}
                      className={`team-selection-card ${selectedTeam === t.id ? 'selected' : ''}`}
                      onClick={() => !isTaken && setSelectedTeam(t.id)}
                      style={{ 
                        opacity: isTaken ? 0.5 : 1, 
                        cursor: isTaken ? 'not-allowed' : 'pointer', 
                        position: 'relative',
                        padding: '15px',
                        background: 'rgba(255,255,255,0.05)',
                        border: selectedTeam === t.id ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt={t.name} width="60" height="60" style={{ objectFit: 'contain', marginBottom: '10px' }} />
                        ) : null}
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{t.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.acronym}</div>
                      </div>
                      {isTaken && <div style={{position: 'absolute', top: 5, right: 5, fontSize: '0.6rem', background: 'var(--danger-color)', color: '#fff', padding: '2px 4px', borderRadius: '4px'}}>Ocupado</div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {selectedTeam && (
          <form onSubmit={handleConfirm} style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ width: '100%', maxWidth: '300px' }}>
              {loading ? 'Assinando Contrato...' : 'Confirmar e Iniciar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
