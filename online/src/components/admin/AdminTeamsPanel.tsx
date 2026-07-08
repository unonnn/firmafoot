'use client';
import { useState } from 'react';
import { updateTeamAdminAction, releaseTeamAdminAction } from '@/app/actions';

export default function AdminTeamsPanel({ initial }: { initial: any[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [filtro, setFiltro] = useState('');

  const atualizarCampo = (id: number, campo: string, valor: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r)));
  };

  const salvar = async (row: any) => {
    setBusy(true);
    try {
      await updateTeamAdminAction(row.id, {
        reputation: row.reputation,
        balance: row.balance,
        boardConfidence: row.boardConfidence,
        capacity: row.capacity,
        ticketPrice: row.ticketPrice,
        debt: row.debt,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar.');
    }
    setBusy(false);
  };

  const liberar = async (id: number) => {
    if (!confirm('Liberar este clube do técnico atual?')) return;
    setBusy(true);
    try {
      await releaseTeamAdminAction(id);
      atualizarCampo(id, 'userId', null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao liberar.');
    }
    setBusy(false);
  };

  const filtrados = rows.filter((r) => r.name.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="section-title" style={{ fontSize: '1.2rem', margin: 0 }}>Times</div>
        <input className="form-control" placeholder="Filtrar por nome..." value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ width: '220px' }} />
      </div>
      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table className="custom-table" style={{ fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th>Clube</th><th>Reputação</th><th>Saldo</th><th>Confiança</th><th>Capacidade</th><th>Ingresso</th><th>Dívida</th><th>Técnico</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700, color: '#fff' }}>{r.name}</td>
                <td><input type="number" className="form-control" value={r.reputation} onChange={(e) => atualizarCampo(r.id, 'reputation', Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td><input type="number" className="form-control" value={r.balance} onChange={(e) => atualizarCampo(r.id, 'balance', Number(e.target.value))} style={{ width: '110px' }} /></td>
                <td><input type="number" className="form-control" value={r.boardConfidence} onChange={(e) => atualizarCampo(r.id, 'boardConfidence', Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td><input type="number" className="form-control" value={r.capacity ?? 0} onChange={(e) => atualizarCampo(r.id, 'capacity', Number(e.target.value))} style={{ width: '90px' }} /></td>
                <td><input type="number" className="form-control" value={r.ticketPrice} onChange={(e) => atualizarCampo(r.id, 'ticketPrice', Number(e.target.value))} style={{ width: '70px' }} /></td>
                <td><input type="number" className="form-control" value={r.debt} onChange={(e) => atualizarCampo(r.id, 'debt', Number(e.target.value))} style={{ width: '100px' }} /></td>
                <td style={{ fontSize: '0.75rem', color: r.userId ? 'var(--success-color)' : 'var(--text-muted)' }}>{r.userId ? 'Ocupado' : 'Livre'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => salvar(r)}>Salvar</button>
                  {r.userId && (
                    <button className="btn btn-secondary btn-sm" style={{ color: 'var(--warning-color)', marginLeft: '4px' }} disabled={busy} onClick={() => liberar(r.id)}>Liberar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
