'use client';
import { useState } from 'react';
import { searchPlayersAdminAction, updatePlayerAdminAction } from '@/app/actions';

// Sem listagem completa de propósito — o banco tem 1300+ jogadores reais, então
// busca por nome em vez de paginar uma tabela gigante.
export default function AdminPlayersPanel() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  const buscar = async () => {
    setBusy(true);
    const resultado = await searchPlayersAdminAction(query);
    setRows(resultado);
    setSearched(true);
    setBusy(false);
  };

  const atualizarCampo = (id: number, campo: string, valor: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r)));
  };

  const salvar = async (row: any) => {
    setBusy(true);
    try {
      await updatePlayerAdminAction(row.id, {
        strength: row.strength,
        value: row.value,
        salary: row.salary,
        morale: row.morale,
        fitness: row.fitness,
        isInjured: row.isInjured,
        teamId: row.teamId,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar.');
    }
    setBusy(false);
  };

  return (
    <div className="glass-card" style={{ padding: '20px', marginTop: '20px' }}>
      <div className="section-title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Jogadores (busca por nome)</div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          className="form-control"
          placeholder="Buscar jogador por nome..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={buscar}>Buscar</button>
      </div>

      {searched && rows.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhum jogador encontrado.</p>}

      {rows.length > 0 && (
        <div className="table-responsive">
          <table className="custom-table" style={{ fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th>Nome</th><th>Pos</th><th>Time (ID)</th><th>Força</th><th>Valor</th><th>Salário</th><th>Moral</th><th>Físico</th><th>Lesionado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, color: '#fff' }}>{r.name}</td>
                  <td>{r.position}</td>
                  <td><input type="number" className="form-control" value={r.teamId ?? ''} placeholder="livre" onChange={(e) => atualizarCampo(r.id, 'teamId', e.target.value === '' ? null : Number(e.target.value))} style={{ width: '80px' }} /></td>
                  <td><input type="number" className="form-control" value={r.strength} onChange={(e) => atualizarCampo(r.id, 'strength', Number(e.target.value))} style={{ width: '70px' }} /></td>
                  <td><input type="number" className="form-control" value={r.value} onChange={(e) => atualizarCampo(r.id, 'value', Number(e.target.value))} style={{ width: '100px' }} /></td>
                  <td><input type="number" className="form-control" value={r.salary} onChange={(e) => atualizarCampo(r.id, 'salary', Number(e.target.value))} style={{ width: '90px' }} /></td>
                  <td><input type="number" className="form-control" value={r.morale} onChange={(e) => atualizarCampo(r.id, 'morale', Number(e.target.value))} style={{ width: '70px' }} /></td>
                  <td><input type="number" className="form-control" value={r.fitness} onChange={(e) => atualizarCampo(r.id, 'fitness', Number(e.target.value))} style={{ width: '70px' }} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={r.isInjured} onChange={(e) => atualizarCampo(r.id, 'isInjured', e.target.checked)} />
                  </td>
                  <td><button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => salvar(r)}>Salvar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
