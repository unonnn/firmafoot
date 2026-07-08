'use client';
import { useState } from 'react';
import { updateGameConfigAction } from '@/app/actions';

interface ConfigRow {
  key: string;
  value: number;
  label: string;
  description: string | null;
}

export default function AdminConfigPanel({ initialConfig }: { initialConfig: ConfigRow[] }) {
  const [rows, setRows] = useState(initialConfig);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, value: Number(value) } : r)));
  };

  const handleSave = async (key: string) => {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    setSavingKey(key);
    try {
      await updateGameConfigAction(key, row.value);
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar. Você é admin?');
    }
    setSavingKey(null);
  };

  return (
    <div className="glass-card" style={{ padding: '20px', marginTop: '20px' }}>
      <div className="section-title" style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Parâmetros do Simulador</div>
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Parâmetro</th>
              <th style={{ width: '140px' }}>Valor</th>
              <th>Descrição</th>
              <th style={{ width: '90px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td style={{ fontWeight: 700, color: '#fff' }}>{row.label}</td>
                <td>
                  <input
                    type="number"
                    step="any"
                    value={row.value}
                    onChange={(e) => handleChange(row.key, e.target.value)}
                    className="form-control"
                    style={{ width: '100%' }}
                  />
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.description}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSave(row.key)}
                    disabled={savingKey === row.key}
                  >
                    {savingKey === row.key ? 'Salvando...' : 'Salvar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
