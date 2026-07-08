export default function AdminUsersPanel({ users, teams }: { users: any[]; teams: any[] }) {
  const formatarData = (data: Date) =>
    new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(data));

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div className="section-title" style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Treinadores (Usuários)</div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Role</th>
              <th>Time (Nome)</th>
              <th>Criado em</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Nenhum treinador encontrado.</td></tr>
            )}
            {users.map((user) => {
              const userTeam = teams.find((t) => t.id === user.teamId);
              return (
                <tr key={user.id}>
                  <td style={{ fontWeight: 800, color: '#fff' }}>{user.name}</td>
                  <td>
                    <span style={{
                      background: user.role === 'admin' ? 'rgba(var(--danger-color-rgb), 0.2)' : 'rgba(var(--accent-color-rgb), 0.2)',
                      color: user.role === 'admin' ? 'var(--danger-color)' : 'var(--accent-color)',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {userTeam ? (
                      <span style={{ fontWeight: 600 }}>{userTeam.name}</span>
                    ) : (
                      <span style={{ color: 'var(--warning-color)', fontSize: '0.8rem' }}>Sem clube</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{formatarData(user.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
