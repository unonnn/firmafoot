'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  getFinanceOverviewAction,
  getSponsorCatalogAction,
  signSponsorAction,
  updateTicketPriceAction,
  expandStadiumAction,
  takeLoanAction,
  payLoanAction,
  convertToSafAction,
} from '@/app/actions';

const formatarDinheiro = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor);

const NOMES_SLOT: Record<string, string> = {
  material: 'Material Esportivo',
  master: 'Patrocinador Master',
  mangas: 'Mangas',
  costas: 'Costas',
  calcao: 'Calção',
};

const SAF_INFO = [
  { key: 'textor', nome: 'Modelo Imperial (estilo Textor)', aporte: 60_000_000, desc: 'Amortiza 50% das dívidas. Investidor fica com 15% de royalties sobre a bilheteria.' },
  { key: 'city', nome: 'Modelo Grupo Global (estilo City)', aporte: 40_000_000, desc: 'Investidor fica com 10% de royalties sobre a bilheteria. Scout mais barato.' },
  { key: 'minoritaria', nome: 'SAF Minoritária', aporte: 15_000_000, desc: 'Controle político mantido pelo clube. Royalties mínimos: 4% sobre a bilheteria.' },
] as const;

export default function Finances() {
  const [tab, setTab] = useState<'geral' | 'patrocinios' | 'saf'>('geral');
  const [team, setTeam] = useState<any>(null);
  const [catalogo, setCatalogo] = useState<{ elegiveis: any[]; contratados: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(() => {
    Promise.all([getFinanceOverviewAction(), getSponsorCatalogAction()]).then(([t, cat]) => {
      setTeam(t);
      setCatalogo(cat);
      setLoading(false);
    });
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const acao = async (fn: () => Promise<any>, mensagem?: (r: any) => string) => {
    setBusy(true);
    try {
      const r = await fn();
      if (mensagem) alert(mensagem(r));
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ocorreu um erro.');
    }
    setBusy(false);
  };

  if (loading || !team) {
    return <div className="fade-in" style={{ padding: '20px' }}>Carregando finanças...</div>;
  }

  const porSlot = (slot: string) => catalogo?.contratados.find((c) => c.slot === slot);

  return (
    <div className="fade-in">
      <div className="title-section">
        <span>Departamento Financeiro & Estádio</span>
        {!team.safModel && (
          <button className="btn btn-secondary btn-sm" style={{ borderColor: 'var(--success-color)', color: 'var(--success-color)', fontWeight: 600 }} onClick={() => setTab('saf')}>
            💼 Transformar em SAF
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
        <button className={`btn btn-sm ${tab === 'geral' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('geral')}>Visão Geral</button>
        <button className={`btn btn-sm ${tab === 'patrocinios' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('patrocinios')}>Patrocínios Comerciais</button>
        <button className={`btn btn-sm ${tab === 'saf' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('saf')}>SAF</button>
      </div>

      {tab === 'geral' && (
        <div className="grid-2col">
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="section-title">Balanço Atual</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: team.balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {formatarDinheiro(team.balance)}
            </div>

            <div className="section-title" style={{ marginTop: '10px' }}>Empréstimo Bancário</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Dívida Atual:</span>
              <strong style={{ color: team.debt > 0 ? 'var(--danger-color)' : 'var(--text-muted)' }}>{formatarDinheiro(team.debt)}</strong>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} disabled={busy} onClick={() => acao(takeLoanAction, () => 'Empréstimo de R$ 5.000.000 tomado.')}>
                Tomar R$ 5M
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} disabled={busy || team.debt === 0} onClick={() => acao(payLoanAction, () => 'Empréstimo pago.')}>
                Pagar R$ 5M
              </button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="section-title">Gestão do Estádio</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{team.stadium}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Capacidade Atual: {(team.capacity ?? 0).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} disabled={busy} onClick={() => acao(() => expandStadiumAction(1), (r) => `Estádio ampliado! Nova capacidade: ${r.novaCapacidade.toLocaleString('pt-BR')}`)}>
                + 5.000 (R$ 7,5M)
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} disabled={busy} onClick={() => acao(() => expandStadiumAction(2), (r) => `Estádio ampliado! Nova capacidade: ${r.novaCapacidade.toLocaleString('pt-BR')}`)}>
                + 10.000 (R$ 15M)
              </button>
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Preço do Ingresso</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => acao(() => updateTicketPriceAction(-5))}>- R$5</button>
                <span style={{ fontWeight: 700, color: 'var(--accent-color)', flex: 1, textAlign: 'center' }}>R$ {team.ticketPrice}</span>
                <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => acao(() => updateTicketPriceAction(5))}>+ R$5</button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--warning-color)', display: 'block', marginTop: '4px' }}>
                * Ingressos caros reduzem o público estimado nos jogos em casa.
              </span>
            </div>
          </div>
        </div>
      )}

      {tab === 'patrocinios' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          {Object.entries(NOMES_SLOT).map(([slot, label]) => {
            const atual = porSlot(slot);
            const opcoes = catalogo?.elegiveis.filter((s) => s.slot === slot) ?? [];
            return (
              <div key={slot} style={{ marginBottom: '20px' }}>
                <div className="section-title">{label}</div>
                {atual ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', marginBottom: '10px' }}>
                    <strong style={{ color: '#fff' }}>{atual.sponsor.name}</strong>
                    <span style={{ color: 'var(--success-color)', fontWeight: 700 }}>
                      {atual.sponsor.royaltyPct > 0 ? `${atual.sponsor.royaltyPct}% royalties` : `+R$ ${atual.sponsor.bonusValue.toLocaleString('pt-BR')} por meta`}
                    </span>
                  </div>
                ) : (
                  <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '10px' }}>Nenhum patrocinador contratado neste espaço.</p>
                )}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {opcoes.map((s) => (
                    <button
                      key={s.id}
                      className="btn btn-secondary btn-sm"
                      disabled={busy || atual?.sponsor.id === s.id}
                      onClick={() => acao(() => signSponsorAction(s.id), (r) => r.message)}
                    >
                      {s.name} (+R$ {s.baseValue.toLocaleString('pt-BR')})
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'saf' && (
        <div className="glass-card" style={{ padding: '20px' }}>
          {team.safModel ? (
            <div style={{ background: 'rgba(0,230,118,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0,230,118,0.2)' }}>
              <strong style={{ color: 'var(--success-color)' }}>SAF Ativa: {SAF_INFO.find((s) => s.key === team.safModel)?.nome}</strong>
              <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {SAF_INFO.find((s) => s.key === team.safModel)?.desc}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SAF_INFO.map((s) => (
                <div key={s.key} style={{ background: 'rgba(255,255,255,0.01)', padding: '14px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: '#fff' }}>{s.nome}</strong>
                    <span style={{ color: 'var(--success-color)', fontWeight: 700 }}>+ {formatarDinheiro(s.aporte)}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>{s.desc}</p>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={busy}
                    onClick={() => {
                      if (!confirm(`Converter seu clube em SAF (${s.nome})? Essa ação é irreversível.`)) return;
                      acao(() => convertToSafAction(s.key), (r) => r.message);
                    }}
                  >
                    Converter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
