'use client';
import { useEffect, useState } from 'react';
import { getTrainingFocusAction, setTrainingFocusAction } from '@/app/actions';

const FOCOS = [
  { key: 'fisico', label: '🏃 Físico & Condição', desc: 'Recondicionamento físico: +3% de condição física para todo o elenco na próxima rodada.' },
  { key: 'tatico', label: '🧠 Organização Tática', desc: 'Acumula +1% de bônus de organização defensiva para a próxima partida (reseta após o jogo).' },
  { key: 'tecnico', label: '⚽ Técnico & Base', desc: 'Promessas da base (menores de 23 anos) têm 20% de chance de evoluir +1 de força por rodada.' },
  { key: 'descanso', label: '🧘 Folga & Grupo', desc: '+5 de moral e +5% de condição física para todo o elenco.' },
];

export default function TrainingFocus() {
  const [foco, setFoco] = useState<string>('tecnico');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTrainingFocusAction().then((f) => {
      setFoco(f);
      setLoading(false);
    });
  }, []);

  const escolher = async (key: string) => {
    setSaving(true);
    setFoco(key);
    try {
      await setTrainingFocusAction(key);
    } catch (e) {
      console.error(e);
      alert('Não foi possível salvar o foco de treino.');
    }
    setSaving(false);
  };

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Carregando foco de treino...</div>;
  }

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="section-title">Escolher Foco Tático/Físico da Próxima Rodada</div>
      {FOCOS.map((f) => {
        const ativo = foco === f.key;
        return (
          <div
            key={f.key}
            onClick={() => !saving && escolher(f.key)}
            style={{
              background: ativo ? 'rgba(0,240,255,0.03)' : 'rgba(255,255,255,0.01)',
              border: `1px solid ${ativo ? 'var(--accent-color)' : 'var(--glass-border)'}`,
              padding: '14px',
              borderRadius: '12px',
              cursor: saving ? 'wait' : 'pointer',
              transition: 'var(--transition-smooth)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#fff', fontSize: '1.05rem' }}>{f.label}</strong>
              {ativo && (
                <span style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.75rem', border: '1px solid var(--accent-color)', padding: '2px 6px', borderRadius: '4px' }}>
                  ATIVO
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{f.desc}</p>
          </div>
        );
      })}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        O efeito é aplicado automaticamente quando a rodada é processada (ver botão &quot;Marcar Pronto&quot; no Painel do Técnico).
      </p>
    </div>
  );
}
