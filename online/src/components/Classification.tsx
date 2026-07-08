'use client';
import { useState, useEffect } from 'react';
import { getStandingsAction, getRoundStatusAction } from '@/app/actions';

const TOTAL_RODADAS = 38;

export default function Classification() {
  const [division, setDivision] = useState('A');
  const [tableData, setTableData] = useState<any[]>([]);
  const [round, setRound] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getStandingsAction(division), getRoundStatusAction()]).then(([data, status]) => {
      setTableData(data);
      setRound(status?.round ?? null);
      setLoading(false);
    });
  }, [division]);

  return (
    <div className="fade-in">
      <div className="title-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          Classificação do Campeonato
          {round && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '10px' }}>Rodada {round} de {TOTAL_RODADAS}</span>}
        </span>
        <div>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
          >
            <option value="A">Série A</option>
            <option value="B">Série B</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', overflowY: 'auto' }}>
        <div className="table-responsive">
          <table className="custom-table" style={{ fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '40px' }}>Pos</th>
                <th>Clube</th>
                <th style={{ textAlign: 'center', width: '40px' }}>PTS</th>
                <th style={{ textAlign: 'center', width: '40px' }}>J</th>
                <th style={{ textAlign: 'center', width: '40px' }}>V</th>
                <th style={{ textAlign: 'center', width: '40px' }}>E</th>
                <th style={{ textAlign: 'center', width: '40px' }}>D</th>
                <th style={{ textAlign: 'center', width: '40px' }}>GP</th>
                <th style={{ textAlign: 'center', width: '40px' }}>GC</th>
                <th style={{ textAlign: 'center', width: '40px' }}>SG</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>Carregando tabela...</td></tr>
              ) : (
                tableData.map((row) => {
                  let posColor = '';
                  if (division === 'A') {
                    if (row.pos <= 4) posColor = 'var(--success-color)'; // G4 — Libertadores
                    else if (row.pos <= 6) posColor = '#007bff'; // G6 — pré-Libertadores
                  } else if (row.pos <= 4) {
                    posColor = '#007bff'; // Acesso à Série A
                  }
                  if (row.pos >= 17) posColor = 'var(--danger-color)'; // Z4 — rebaixamento

                  return (
                    <tr key={row.id} style={row.isUser ? { background: 'rgba(var(--accent-color-rgb), 0.15)' } : {}}>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: posColor || 'var(--text-muted)' }}>
                        {row.pos}
                      </td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: row.isUser ? 800 : 600, color: row.isUser ? '#fff' : 'inherit' }}>
                        {row.team.logoUrl ? <img src={row.team.logoUrl} alt={row.team.name} width="24" height="24" style={{ objectFit: 'contain' }} /> : null}
                        {row.team.name}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--accent-color)' }}>{row.points}</td>
                      <td style={{ textAlign: 'center' }}>{row.played}</td>
                      <td style={{ textAlign: 'center' }}>{row.won}</td>
                      <td style={{ textAlign: 'center' }}>{row.drawn}</td>
                      <td style={{ textAlign: 'center' }}>{row.lost}</td>
                      <td style={{ textAlign: 'center' }}>{row.goalsFor}</td>
                      <td style={{ textAlign: 'center' }}>{row.goalsAgainst}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.sg}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {division === 'A' ? (
            <>
              <span><span style={{ color: 'var(--success-color)', fontWeight: 800 }}>■</span> G4 — Libertadores</span>
              <span><span style={{ color: '#007bff', fontWeight: 800 }}>■</span> G6 — Pré-Libertadores</span>
            </>
          ) : (
            <span><span style={{ color: '#007bff', fontWeight: 800 }}>■</span> G4 — Acesso à Série A</span>
          )}
          <span><span style={{ color: 'var(--danger-color)', fontWeight: 800 }}>■</span> Z4 — Rebaixamento</span>
        </div>
      </div>
    </div>
  );
}
