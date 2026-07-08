'use client';
import { useState } from 'react';
import { negotiateTransferAction } from '@/app/actions';

interface NegotiateModalProps {
  player: any;
  isFreeAgent: boolean;
  onClose: () => void;
  onDone: () => void;
}

// Modal de negociação de compra/empréstimo — portado de
// js/components/market.js:246-595 (compra vs empréstimo, % do valor, % de salário,
// divisão do salário no empréstimo e duração).
export default function NegotiateModal({ player, isFreeAgent, onClose, onDone }: NegotiateModalProps) {
  const [type, setType] = useState<'buy' | 'loan'>('buy');
  const [feePct, setFeePct] = useState(100);
  const [salaryPct, setSalaryPct] = useState(100);
  const [loanSalarySplitPct, setLoanSalarySplitPct] = useState(100);
  const [loanDuration, setLoanDuration] = useState<'10' | 'season'>('10');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const custoEstimado = Math.round(player.value * (feePct / 100));

  const handleSubmit = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const resultado = await negotiateTransferAction({
        playerId: player.id,
        type: isFreeAgent ? 'buy' : type,
        feePct,
        salaryPct,
        loanSalarySplitPct: type === 'loan' ? loanSalarySplitPct : undefined,
        loanRounds: loanDuration === '10' ? 10 : null,
      });
      setFeedback(resultado.message);
      if (resultado.success) {
        setTimeout(() => { onDone(); onClose(); }, 1200);
      }
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Erro ao negociar.');
    }
    setBusy(false);
  };

  return (
    <div className="modal active">
      <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{player.name}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {player.position} · Força {player.strength} · Valor R$ {player.value.toLocaleString('pt-BR')}
          </span>
        </div>

        {!isFreeAgent && (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Tipo de Proposta</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`btn btn-sm ${type === 'buy' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setType('buy')}>Compra Definitiva</button>
              <button className={`btn btn-sm ${type === 'loan' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setType('loan')}>Empréstimo</button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>% do valor de mercado oferecido: <strong style={{ color: 'var(--accent-color)' }}>{feePct}%</strong></label>
          <input type="range" min={90} max={120} step={10} value={feePct} onChange={(e) => setFeePct(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>% do salário atual oferecido ao jogador: <strong style={{ color: 'var(--accent-color)' }}>{salaryPct}%</strong></label>
          <input type="range" min={100} max={150} step={25} value={salaryPct} onChange={(e) => setSalaryPct(Number(e.target.value))} style={{ width: '100%' }} />
        </div>

        {!isFreeAgent && type === 'loan' && (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Salário pago pelo seu clube: <strong style={{ color: 'var(--accent-color)' }}>{loanSalarySplitPct}%</strong></label>
              <input type="range" min={50} max={100} step={50} value={loanSalarySplitPct} onChange={(e) => setLoanSalarySplitPct(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Duração</label>
              <select value={loanDuration} onChange={(e) => setLoanDuration(e.target.value as '10' | 'season')} className="form-control" style={{ width: '100%' }}>
                <option value="10">10 rodadas</option>
                <option value="season">Até o fim da temporada</option>
              </select>
            </div>
          </>
        )}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Custo estimado: <strong style={{ color: 'var(--success-color)' }}>R$ {custoEstimado.toLocaleString('pt-BR')}</strong>
        </p>

        {feedback && <p style={{ fontSize: '0.85rem', color: 'var(--accent-color)', marginBottom: '12px' }}>{feedback}</p>}

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={handleSubmit}>
            {busy ? 'Negociando...' : 'Enviar Proposta'}
          </button>
        </div>
      </div>
    </div>
  );
}
