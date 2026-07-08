'use client';
import { useEffect, useState, useCallback } from 'react';
import { getOtherTeamsAction, getTeamRosterAction, getFreeAgentsAction, getSquadAction, sellPlayerAction, scoutAction } from '@/app/actions';
import NegotiateModal from './NegotiateModal';

const POSICOES = ['GOL', 'ZAG', 'LE', 'LD', 'VOL', 'MEI', 'PE', 'PD', 'CA'];

export default function Market() {
  const [tab, setTab] = useState<'comprar' | 'vender'>('comprar');
  const [origem, setOrigem] = useState('LIVRES');
  const [otherTeams, setOtherTeams] = useState<any[]>([]);
  const [jogadores, setJogadores] = useState<any[]>([]);
  const [meuElenco, setMeuElenco] = useState<any[]>([]);
  const [filtroPosicao, setFiltroPosicao] = useState('TODAS');
  const [filtroForcaMin, setFiltroForcaMin] = useState(50);
  const [selecionado, setSelecionado] = useState<any>(null);
  const [scouting, setScouting] = useState(false);
  const [loading, setLoading] = useState(true);

  const carregarJogadores = useCallback(() => {
    setLoading(true);
    const promise = origem === 'LIVRES' ? getFreeAgentsAction() : getTeamRosterAction(Number(origem));
    promise.then((data) => {
      setJogadores(data);
      setLoading(false);
    });
  }, [origem]);

  const carregarMeuElenco = useCallback(() => {
    getSquadAction().then(setMeuElenco);
  }, []);

  useEffect(() => {
    getOtherTeamsAction().then(setOtherTeams);
    carregarMeuElenco();
  }, [carregarMeuElenco]);

  useEffect(() => {
    if (tab === 'comprar') carregarJogadores();
  }, [tab, carregarJogadores]);

  const handleScout = async () => {
    setScouting(true);
    try {
      const resultado = await scoutAction();
      alert(`Scout contratado! ${resultado.quantidade} novos agentes livres apareceram no mercado.`);
      if (origem === 'LIVRES') carregarJogadores();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao contratar scout.');
    }
    setScouting(false);
  };

  const handleVender = async (player: any) => {
    if (!confirm(`Vender ${player.name} por R$ ${Math.round(player.value * 0.8).toLocaleString('pt-BR')}?`)) return;
    try {
      const resultado = await sellPlayerAction(player.id);
      alert(`Vendido! +R$ ${resultado.valorVenda.toLocaleString('pt-BR')}`);
      carregarMeuElenco();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao vender.');
    }
  };

  const filtrados = jogadores.filter((j) => {
    const matchPos = filtroPosicao === 'TODAS' || j.position === filtroPosicao;
    const matchForca = j.strength >= filtroForcaMin;
    return matchPos && matchForca;
  });

  return (
    <div className="fade-in">
      <div className="title-section">
        <span>Mercado de Transferências</span>
        <button onClick={handleScout} disabled={scouting} className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--accent-color)', fontWeight: 600 }}>
          🔍 {scouting ? 'Contratando...' : 'Contratar Scout'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <button className={`btn btn-sm ${tab === 'comprar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('comprar')}>
          Comprar/Empréstimo
        </button>
        <button className={`btn btn-sm ${tab === 'vender' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('vender')}>
          Lista de Venda (Elenco)
        </button>
      </div>

      {tab === 'comprar' ? (
        <div>
          <div className="search-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>BUSCAR EM</label>
              <select value={origem} onChange={(e) => setOrigem(e.target.value)} className="form-control" style={{ padding: '6px 12px', width: '200px' }}>
                <option value="LIVRES">Jogadores Livres</option>
                {otherTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>FILTRAR POSIÇÃO</label>
              <select value={filtroPosicao} onChange={(e) => setFiltroPosicao(e.target.value)} className="form-control" style={{ padding: '6px 12px', width: '140px' }}>
                <option value="TODAS">Todas</option>
                {POSICOES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, minWidth: '150px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                <span>FORÇA MÍNIMA</span>
                <span style={{ color: 'var(--accent-color)', fontWeight: 800 }}>{filtroForcaMin}</span>
              </div>
              <input type="range" min={30} max={99} value={filtroForcaMin} onChange={(e) => setFiltroForcaMin(Number(e.target.value))} style={{ width: '100%', marginTop: '6px' }} />
            </div>
          </div>

          <div className="market-player-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Carregando...</div>
            ) : filtrados.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                Nenhum jogador encontrado com os filtros selecionados.
              </div>
            ) : (
              filtrados.map((j) => (
                <div key={j.id} className="player-card glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="player-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`player-badge-pos ${j.position}`}>{j.position}</span>
                    <span className="player-card-force">{j.strength}</span>
                  </div>
                  <div className="player-card-name">{j.name}</div>
                  <div className="player-card-detail" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Idade: {j.age}</span>
                    {j.transferListed && <span style={{ color: 'var(--warning-color)' }}>Listado</span>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Salário: R$ {j.salary.toLocaleString('pt-BR')}/rodada</div>
                  <div className="player-card-price">R$ {j.value.toLocaleString('pt-BR')}</div>
                  <button className="btn btn-primary btn-sm" onClick={() => setSelecionado(j)}>Negociar</button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
            Venda instantânea com deságio de 20%. Jogadores emprestados não podem ser vendidos.
          </p>
          <div className="market-player-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {meuElenco.map((j) => (
              <div key={j.id} className="player-card glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="player-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`player-badge-pos ${j.position}`}>{j.position}</span>
                  <span className="player-card-force">{j.strength}</span>
                </div>
                <div className="player-card-name">{j.name}</div>
                <div className="player-card-price">R$ {Math.round(j.value * 0.8).toLocaleString('pt-BR')}</div>
                {j.loanFromTeamId ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Emprestado — não pode vender</span>
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleVender(j)}>Vender</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selecionado && (
        <NegotiateModal
          player={selecionado}
          isFreeAgent={origem === 'LIVRES'}
          onClose={() => setSelecionado(null)}
          onDone={carregarJogadores}
        />
      )}
    </div>
  );
}
