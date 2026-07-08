'use client';
import { useState } from 'react';
import { createSponsorAction, updateSponsorAction, deleteSponsorAction } from '@/app/actions';

const SLOTS = ['material', 'master', 'mangas', 'costas', 'calcao'];
const GOAL_TYPES = ['none', 'win', 'clean_sheet', 'three_goals'];

const NOVO_PADRAO = { slot: 'master', name: '', baseValue: 0, royaltyPct: 0, goalType: 'none', bonusValue: 0, minReputation: 0, active: true };

export default function AdminSponsorsPanel({ initial }: { initial: any[] }) {
  const [rows, setRows] = useState(initial);
  const [novo, setNovo] = useState<any>(NOVO_PADRAO);
  const [busy, setBusy] = useState(false);

  const atualizarCampo = (id: number, campo: string, valor: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r)));
  };

  const salvar = async (row: any) => {
    setBusy(true);
    try {
      await updateSponsorAction(row.id, row);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar.');
    }
    setBusy(false);
  };

  const remover = async (id: number) => {
    if (!confirm('Remover este patrocinador do catálogo?')) return;
    setBusy(true);
    try {
      await deleteSponsorAction(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao remover.');
    }
    setBusy(false);
  };

  const adicionar = async () => {
    if (!novo.name.trim()) return alert('Nome é obrigatório.');
    setBusy(true);
    try {
      await createSponsorAction(novo);
      setRows((prev) => [...prev, { ...novo, id: Math.max(0, ...prev.map((r) => r.id)) + 1 }]);
      setNovo(NOVO_PADRAO);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar.');
    }
    setBusy(false);
  };

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div className="section-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Catálogo de Patrocinadores</div>
      <div className="table-responsive">
        <table className="custom-table" style={{ fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th>Slot</th><th>Nome</th><th>Valor Base</th><th>Royalty %</th><th>Meta</th><th>Bônus Meta</th><th>Rep. Mín.</th><th>Ativo</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <select value={r.slot} onChange={(e) => atualizarCampo(r.id, 'slot', e.target.value)} className="form-control">
                    {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td><input className="form-control" value={r.name} onChange={(e) => atualizarCampo(r.id, 'name', e.target.value)} style={{ width: '120px' }} /></td>
                <td><input type="number" className="form-control" value={r.baseValue} onChange={(e) => atualizarCampo(r.id, 'baseValue', Number(e.target.value))} style={{ width: '100px' }} /></td>
                <td><input type="number" className="form-control" value={r.royaltyPct} onChange={(e) => atualizarCampo(r.id, 'royaltyPct', Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td>
                  <select value={r.goalType} onChange={(e) => atualizarCampo(r.id, 'goalType', e.target.value)} className="form-control">
                    {GOAL_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </td>
                <td><input type="number" className="form-control" value={r.bonusValue} onChange={(e) => atualizarCampo(r.id, 'bonusValue', Number(e.target.value))} style={{ width: '90px' }} /></td>
                <td><input type="number" className="form-control" value={r.minReputation} onChange={(e) => atualizarCampo(r.id, 'minReputation', Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={r.active} onChange={(e) => atualizarCampo(r.id, 'active', e.target.checked)} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => salvar(r)}>Salvar</button>
                  <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger-color)', marginLeft: '4px' }} disabled={busy} onClick={() => remover(r.id)}>🗑</button>
                </td>
              </tr>
            ))}
            <tr style={{ background: 'rgba(0,240,255,0.03)' }}>
              <td>
                <select value={novo.slot} onChange={(e) => setNovo({ ...novo, slot: e.target.value })} className="form-control">
                  {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td><input className="form-control" placeholder="Nome" value={novo.name} onChange={(e) => setNovo({ ...novo, name: e.target.value })} style={{ width: '120px' }} /></td>
              <td><input type="number" className="form-control" value={novo.baseValue} onChange={(e) => setNovo({ ...novo, baseValue: Number(e.target.value) })} style={{ width: '100px' }} /></td>
              <td><input type="number" className="form-control" value={novo.royaltyPct} onChange={(e) => setNovo({ ...novo, royaltyPct: Number(e.target.value) })} style={{ width: '70px' }} /></td>
              <td>
                <select value={novo.goalType} onChange={(e) => setNovo({ ...novo, goalType: e.target.value })} className="form-control">
                  {GOAL_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </td>
              <td><input type="number" className="form-control" value={novo.bonusValue} onChange={(e) => setNovo({ ...novo, bonusValue: Number(e.target.value) })} style={{ width: '90px' }} /></td>
              <td><input type="number" className="form-control" value={novo.minReputation} onChange={(e) => setNovo({ ...novo, minReputation: Number(e.target.value) })} style={{ width: '70px' }} /></td>
              <td></td>
              <td><button className="btn btn-primary btn-sm" disabled={busy} onClick={adicionar}>+ Adicionar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
