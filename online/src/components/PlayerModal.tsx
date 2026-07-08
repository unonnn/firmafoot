'use client';
import { useState } from 'react';
import {
  talkToPlayerAction,
  renewContractAction,
  toggleTransferListedAction,
  terminateContractAction,
  returnLoanedPlayerAction,
} from '@/app/actions';

interface ConversationType {
  key: string;
  label: string;
  description: string | null;
  cooldownRounds: number;
}

interface PlayerModalProps {
  player: any;
  conversationTypes: ConversationType[];
  onClose: () => void;
  onChanged: () => void;
}

// Modal de detalhes/ações do jogador — conversas (banco `conversation_types`,
// editável no Admin), renovação de contrato, lista de transferência, rescisão e
// devolução de empréstimo. Portado de js/components/tactics.js:705-915.
export default function PlayerModal({ player, conversationTypes, onClose, onChanged }: PlayerModalProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>, mensagemSucesso?: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      await fn();
      if (mensagemSucesso) setFeedback(mensagemSucesso);
      onChanged();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Ocorreu um erro.');
    }
    setBusy(false);
  };

  const handleTalk = (key: string, label: string) =>
    run(async () => {
      const resultado = await talkToPlayerAction(player.id, key);
      setFeedback(
        `${label}: ${resultado.success ? 'deu certo' : 'não foi bem recebido'} (moral ${resultado.moraleChange >= 0 ? '+' : ''}${resultado.moraleChange}${resultado.fitnessChange ? `, físico +${resultado.fitnessChange}` : ''}).`
      );
      onChanged();
    });

  const handleRenovar = () =>
    run(() => renewContractAction(player.id), `Contrato de ${player.name} renovado!`);

  const handleListar = () =>
    run(() => toggleTransferListedAction(player.id), player.transferListed ? 'Removido da lista de transferências.' : 'Jogador listado para transferência.');

  const handleRescindir = () => {
    if (!confirm(`Rescindir com ${player.name}? Isso cobra uma multa e libera o jogador como agente livre.`)) return;
    run(async () => {
      await terminateContractAction(player.id);
      onClose();
    });
  };

  const handleDevolverEmprestimo = () => {
    if (!confirm(`Devolver ${player.name} ao clube de origem agora?`)) return;
    run(async () => {
      await returnLoanedPlayerAction(player.id);
      onClose();
    });
  };

  const suspenso = player.redCard || player.yellowCards >= 2;

  return (
    <div className="modal active">
      <div className="modal-content glass-card" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{player.name}</h2>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {player.position}{player.secondaryPosition ? ` / ${player.secondaryPosition}` : ''}
            {player.isInjured && <span style={{ color: 'var(--warning-color)' }}> · LESIONADO</span>}
            {suspenso && <span style={{ color: 'var(--danger-color)' }}> · SUSPENSO</span>}
            {player.loanFromTeamId && <span style={{ color: 'var(--accent-color)' }}> · EMPRESTADO</span>}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px' }}>
          <div>
            <div style={{ marginBottom: '6px' }}>Força: <strong style={{ color: 'var(--accent-color)' }}>{player.strength}</strong></div>
            <div style={{ marginBottom: '6px' }}>Idade: <strong>{player.age} anos</strong></div>
            <div style={{ marginBottom: '6px' }}>Físico: <strong>{player.fitness}%</strong></div>
          </div>
          <div>
            <div style={{ marginBottom: '6px' }}>Moral: <strong style={{ color: 'var(--success-color)' }}>{player.morale}/100</strong></div>
            <div style={{ marginBottom: '6px' }}>Salário: <strong>R$ {player.salary.toLocaleString('pt-BR')}</strong></div>
            <div style={{ marginBottom: '6px' }}>Valor: <strong>R$ {player.value.toLocaleString('pt-BR')}</strong></div>
          </div>
        </div>

        <div className="section-title">Estatísticas na Temporada</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{player.matchesPlayed}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jogos</span>
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--warning-color)' }}>{player.goals}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gols</span>
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-color)' }}>{player.assists}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assists</span>
          </div>
        </div>

        <div className="section-title">Ações e Conversas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '10px', background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '6px' }}>💬 Conversar com o Jogador</span>
            {player.conversationCooldown > 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--warning-color)', margin: 0 }}>Disponível em {player.conversationCooldown} rodada(s).</p>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                {conversationTypes.map((tipo) => (
                  <button
                    key={tipo.key}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, fontSize: '0.72rem', padding: '4px' }}
                    disabled={busy}
                    onClick={() => handleTalk(tipo.key, tipo.label)}
                    title={tipo.description ?? undefined}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {player.loanFromTeamId ? (
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, borderColor: 'var(--danger-color)', color: 'var(--danger-color)', fontSize: '0.78rem' }} disabled={busy} onClick={handleDevolverEmprestimo}>
                ↩️ Devolver Empréstimo
              </button>
            ) : (
              <>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, borderColor: 'var(--success-color)', color: 'var(--success-color)', fontSize: '0.78rem' }} disabled={busy} onClick={handleRenovar}>
                  💰 Renovar
                </button>
                <button className={`btn btn-secondary btn-sm ${player.transferListed ? 'btn-primary' : ''}`} style={{ flex: 1, fontSize: '0.78rem' }} disabled={busy} onClick={handleListar}>
                  📢 {player.transferListed ? 'Remover Venda' : 'Listar Venda'}
                </button>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, borderColor: 'var(--danger-color)', color: 'var(--danger-color)', fontSize: '0.78rem' }} disabled={busy} onClick={handleRescindir}>
                  ❌ Rescindir
                </button>
              </>
            )}
          </div>
        </div>

        {feedback && (
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-color)', marginBottom: '12px' }}>{feedback}</p>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
