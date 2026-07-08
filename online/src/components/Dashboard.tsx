'use client';
import { useEffect, useState } from 'react';
import { getDashboardAction, getRoundStatusAction, markReadyAction, getLastPlayedMatchAction, getLeaderboardAction } from '@/app/actions';
import LiveMatch from './LiveMatch';

export default function Dashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardAction>> | null>(null);
  const [roundStatus, setRoundStatus] = useState<Awaited<ReturnType<typeof getRoundStatusAction>> | null>(null);
  const [lastMatch, setLastMatch] = useState<Awaited<ReturnType<typeof getLastPlayedMatchAction>> | null>(null);
  const [leaderboard, setLeaderboard] = useState<Awaited<ReturnType<typeof getLeaderboardAction>>>([]);
  const [loading, setLoading] = useState(true);
  const [marcandoPronto, setMarcandoPronto] = useState(false);
  const [assistindo, setAssistindo] = useState(false);

  const carregar = () => {
    Promise.all([getDashboardAction(), getRoundStatusAction(), getLastPlayedMatchAction(), getLeaderboardAction()]).then(([dash, status, last, board]) => {
      setData(dash);
      setRoundStatus(status);
      setLastMatch(last);
      setLeaderboard(board);
      setLoading(false);
    });
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleMarcarPronto = async () => {
    setMarcandoPronto(true);
    try {
      await markReadyAction();
      carregar();
    } catch (e) {
      console.error(e);
      alert('Não foi possível marcar presença na rodada.');
    }
    setMarcandoPronto(false);
  };

  if (loading) {
    return <div className="fade-in" style={{ padding: '20px' }}>Carregando painel...</div>;
  }

  if (!data) {
    return <div className="fade-in" style={{ padding: '20px' }}>Você ainda não escolheu um time.</div>;
  }

  return (
    <div className="fade-in">
      <div className="title-section">
        <span>Painel do Técnico</span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Estilo: {data.team.formation} · Temporada {data.seasonYear}
        </span>
      </div>

      {/* Barra de Rodada e Prontidão da Liga */}
      <div className="next-match-bar">
        <div className="calendar-panel" style={{ minWidth: '250px' }}>
          <span className="next-match-label">RODADA ATUAL</span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>Rodada {data.round}</h3>
          {roundStatus && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
              {roundStatus.readyCount}/{roundStatus.totalActive} técnicos prontos
            </span>
          )}
        </div>

        <div className="next-match-info" style={{ alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '0 30px', flexGrow: 1 }}>
          <span className="next-match-label">PRÓXIMA PARTIDA (Rodada {data.round})</span>
          <div className="match-fixture-preview" style={{ fontSize: '1.1rem', marginTop: '4px' }}>
            {data.nextMatch ? (
              <>
                <span>{data.nextMatch.isHome ? data.team.name : data.nextMatch.opponentName}</span>
                <span className="vs-badge">VS</span>
                <span>{data.nextMatch.isHome ? data.nextMatch.opponentName : data.team.name}</span>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sem partida agendada (fim de temporada)</span>
            )}
          </div>
        </div>

        <div className="calendar-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {lastMatch && (
            <button className="btn btn-secondary" onClick={() => setAssistindo(true)}>
              ▶ Assistir Última Partida
            </button>
          )}
          <button
            className="btn btn-primary btn-pulse"
            onClick={handleMarcarPronto}
            disabled={marcandoPronto || roundStatus?.userIsReady}
          >
            {roundStatus?.userIsReady ? 'PRONTO PARA A RODADA' : marcandoPronto ? 'MARCANDO...' : 'MARCAR PRONTO'}
          </button>
        </div>
      </div>

      {assistindo && lastMatch && (
        <LiveMatch matchId={lastMatch.id} onClose={() => setAssistindo(false)} />
      )}

      {/* Grid de Informações Rápidas */}
      <div className="stats-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sua Posição</span>
          <span style={{ color: 'var(--accent-color)', fontSize: '1.4rem', fontWeight: 700, marginTop: '8px' }}>{data.userPos}º Lugar (Série {data.division})</span>
        </div>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Força Média</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '8px' }}>{data.avgStrength}</span>
        </div>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Jogadores no Elenco</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '8px' }}>{data.squadCount}</span>
        </div>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estádio (Capacidade)</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '8px', whiteSpace: 'nowrap' }}>
            {data.team.stadium} ({data.team.capacity ? (data.team.capacity / 1000).toFixed(0) : '?'}k)
          </span>
        </div>
      </div>

      <div className="grid-3col">
        {/* Próximo Confronto Detalhado */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="section-title">Próximo Adversário</div>
            {data.nextMatch ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '50%',
                    background: data.nextMatch.opponentPrimaryColor || '#555', border: '2px solid #fff', marginBottom: '10px'
                  }}></div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{data.nextMatch.opponentName}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Mandante: {data.nextMatch.isHome ? 'Casa' : 'Fora'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Reputação rival:</span>
                    <span style={{ color: 'var(--warning-color)' }}>{data.nextMatch.opponentReputation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estádio da partida:</span>
                    <span>{data.nextMatch.stadium}</span>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Nenhuma partida pendente nesta rodada.</p>
            )}
          </div>
        </div>

        {/* Tabela Rápida de Classificação */}
        <div className="glass-card" style={{ padding: '16px' }}>
          <div className="section-title">Classificação (Top 5)</div>
          <div className="table-responsive">
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '30px', textAlign: 'center' }}>Pos</th>
                  <th>Time</th>
                  <th style={{ textAlign: 'center' }}>P</th>
                  <th style={{ textAlign: 'center' }}>J</th>
                </tr>
              </thead>
              <tbody>
                {data.top5.map((c) => (
                  <tr key={c.pos} style={c.isUser ? { fontWeight: 800, color: 'var(--accent-color)' } : {}}>
                    <td style={{ textAlign: 'center' }}>{c.pos}</td>
                    <td>{c.nome}</td>
                    <td style={{ textAlign: 'center' }}>{c.pontos}</td>
                    <td style={{ textAlign: 'center' }}>{c.jogos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Artilheiros */}
        <div className="glass-card" style={{ padding: '16px' }}>
          <div className="section-title">Artilharia da Liga</div>
          <div className="table-responsive">
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '30px', textAlign: 'center' }}>#</th>
                  <th>Nome</th>
                  <th>Clube</th>
                  <th style={{ textAlign: 'center' }}>G</th>
                </tr>
              </thead>
              <tbody>
                {data.topScorers.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Ninguém marcou gols ainda.</td></tr>
                ) : (
                  data.topScorers.map((art, i) => (
                    <tr key={art.id}>
                      <td style={{ textAlign: 'center' }}>{i + 1}</td>
                      <td>{art.name} ({art.position})</td>
                      <td>{art.teamName}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-color)' }}>{art.goals}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ranking Global de Técnicos */}
      <div className="glass-card" style={{ marginTop: '20px', padding: '16px' }}>
        <div className="section-title">Ranking Global de Técnicos</div>
        <div className="table-responsive">
          <table className="custom-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ width: '30px', textAlign: 'center' }}>#</th>
                <th>Técnico</th>
                <th>Clube</th>
                <th style={{ textAlign: 'center' }}>Confiança</th>
                <th style={{ textAlign: 'center' }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum técnico ativo ainda.</td></tr>
              ) : (
                leaderboard.slice(0, 10).map((l, i) => (
                  <tr key={i} style={l.teamName === data.team.name ? { fontWeight: 800, color: 'var(--accent-color)' } : {}}>
                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                    <td>{l.userName}</td>
                    <td>{l.teamName}</td>
                    <td style={{ textAlign: 'center' }}>{l.boardConfidence}%</td>
                    <td style={{ textAlign: 'center', color: 'var(--success-color)' }}>R$ {l.balance.toLocaleString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seção de Notícias / Histórico */}
      <div className="glass-card" style={{ marginTop: '20px', padding: '20px' }}>
        <div className="section-title">Informativo da Liga</div>
        <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
          <p><strong>Temporada {data.seasonYear} em andamento!</strong> A diretoria do <strong>{data.team.name}</strong> espera um bom desempenho tático sob o seu comando.</p>
          <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>Dica: Visite a aba <strong>Plantel & Táticas</strong> para definir sua escalação antes de clicar em <strong>MARCAR PRONTO</strong>.</p>
        </div>
      </div>
    </div>
  );
}
