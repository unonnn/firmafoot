'use client';
import { useState } from 'react';
import { createConversationTypeAction, updateConversationTypeAction, deleteConversationTypeAction } from '@/app/actions';

const NOVO_PADRAO = { key: '', label: '', description: '', moraleEffect: 0, moraleEffectAlt: null, fitnessEffect: 0, successChance: 100, cooldownRounds: 3 };

export default function AdminConversationsPanel({ initial }: { initial: any[] }) {
  const [rows, setRows] = useState(initial);
  const [novo, setNovo] = useState<any>(NOVO_PADRAO);
  const [busy, setBusy] = useState(false);

  const atualizarCampo = (id: number, campo: string, valor: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r)));
  };

  const salvar = async (row: any) => {
    setBusy(true);
    try {
      await updateConversationTypeAction(row.id, row);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar.');
    }
    setBusy(false);
  };

  const remover = async (id: number) => {
    if (!confirm('Remover este tipo de conversa?')) return;
    setBusy(true);
    try {
      await deleteConversationTypeAction(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover.');
    }
    setBusy(false);
  };

  const adicionar = async () => {
    if (!novo.key.trim() || !novo.label.trim()) return alert('Chave e rótulo são obrigatórios.');
    setBusy(true);
    try {
      await createConversationTypeAction(novo);
      setRows((prev) => [...prev, { ...novo, id: Math.max(0, ...prev.map((r) => r.id)) + 1 }]);
      setNovo(NOVO_PADRAO);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar.');
    }
    setBusy(false);
  };

  return (
    <div className="glass-card" style={{ padding: '20px', marginTop: '20px' }}>
      <div className="section-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Tipos de Conversa (Modal do Jogador)</div>
      <div className="table-responsive">
        <table className="custom-table" style={{ fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th>Chave</th><th>Rótulo</th><th>Efeito Moral</th><th>Efeito Moral (falha)</th><th>Efeito Físico</th><th>% Sucesso</th><th>Cooldown</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><input className="form-control" value={r.key} onChange={(e) => atualizarCampo(r.id, 'key', e.target.value)} style={{ width: '90px' }} /></td>
                <td><input className="form-control" value={r.label} onChange={(e) => atualizarCampo(r.id, 'label', e.target.value)} style={{ width: '120px' }} /></td>
                <td><input type="number" className="form-control" value={r.moraleEffect} onChange={(e) => atualizarCampo(r.id, 'moraleEffect', Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td><input type="number" className="form-control" value={r.moraleEffectAlt ?? ''} placeholder="—" onChange={(e) => atualizarCampo(r.id, 'moraleEffectAlt', e.target.value === '' ? null : Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td><input type="number" className="form-control" value={r.fitnessEffect} onChange={(e) => atualizarCampo(r.id, 'fitnessEffect', Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td><input type="number" className="form-control" value={r.successChance} onChange={(e) => atualizarCampo(r.id, 'successChance', Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td><input type="number" className="form-control" value={r.cooldownRounds} onChange={(e) => atualizarCampo(r.id, 'cooldownRounds', Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => salvar(r)}>Salvar</button>
                  <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger-color)', marginLeft: '4px' }} disabled={busy} onClick={() => remover(r.id)}>🗑</button>
                </td>
              </tr>
            ))}
            <tr style={{ background: 'rgba(0,240,255,0.03)' }}>
              <td><input className="form-control" placeholder="chave" value={novo.key} onChange={(e) => setNovo({ ...novo, key: e.target.value })} style={{ width: '90px' }} /></td>
              <td><input className="form-control" placeholder="Rótulo" value={novo.label} onChange={(e) => setNovo({ ...novo, label: e.target.value })} style={{ width: '120px' }} /></td>
              <td><input type="number" className="form-control" value={novo.moraleEffect} onChange={(e) => setNovo({ ...novo, moraleEffect: Number(e.target.value) })} style={{ width: '70px' }} /></td>
              <td><input type="number" className="form-control" placeholder="—" onChange={(e) => setNovo({ ...novo, moraleEffectAlt: e.target.value === '' ? null : Number(e.target.value) })} style={{ width: '70px' }} /></td>
              <td><input type="number" className="form-control" value={novo.fitnessEffect} onChange={(e) => setNovo({ ...novo, fitnessEffect: Number(e.target.value) })} style={{ width: '70px' }} /></td>
              <td><input type="number" className="form-control" value={novo.successChance} onChange={(e) => setNovo({ ...novo, successChance: Number(e.target.value) })} style={{ width: '70px' }} /></td>
              <td><input type="number" className="form-control" value={novo.cooldownRounds} onChange={(e) => setNovo({ ...novo, cooldownRounds: Number(e.target.value) })} style={{ width: '70px' }} /></td>
              <td><button className="btn btn-primary btn-sm" disabled={busy} onClick={adicionar}>+ Adicionar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
