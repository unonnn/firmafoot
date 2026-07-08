'use client';
import { useState, useEffect } from 'react';
import { getMessagesAction, markMessageAsReadAction, deleteMessageAction, acceptJobOfferAction, rejectJobOfferAction, resolveTransferOfferAction } from '@/app/actions';

interface InboxProps {
  setUnreadCount?: React.Dispatch<React.SetStateAction<number>>;
}

export default function Inbox({ setUnreadCount }: InboxProps) {
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const carregar = () => {
    getMessagesAction().then(data => {
      setEmails(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    getMessagesAction().then(data => {
      setEmails(data);
      if (data.length > 0) setSelectedId(data[0].id);
      setLoading(false);
    });
  }, []);

  const selectedEmail = emails.find(e => e.id === selectedId);

  const handleAceitarEmprego = async () => {
    if (!selectedEmail) return;
    setBusy(true);
    try {
      const r = await acceptJobOfferAction(selectedEmail.id);
      alert(`Bem-vindo ao ${r.teamName}! Recarregue a página para ver seu novo time.`);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao aceitar proposta.');
    }
    setBusy(false);
  };

  const handleRecusarEmprego = async () => {
    if (!selectedEmail) return;
    setBusy(true);
    try {
      await rejectJobOfferAction(selectedEmail.id);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao recusar proposta.');
    }
    setBusy(false);
  };

  const handleResolverTransferencia = async (accept: boolean) => {
    if (!selectedEmail?.actionData?.offerId) return;
    setBusy(true);
    try {
      await resolveTransferOfferAction(selectedEmail.actionData.offerId, accept);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao resolver proposta.');
    }
    setBusy(false);
  };

  const handleSelectEmail = async (id: number) => {
    setSelectedId(id);
    const email = emails.find(e => e.id === id);
    if (email && !email.isRead) {
      setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e));
      if (setUnreadCount) setUnreadCount(prev => Math.max(0, prev - 1));
      await markMessageAsReadAction(id);
    }
  };

  const handleDelete = async () => {
    if (selectedId) {
      await deleteMessageAction(selectedId);
      setEmails(prev => prev.filter(e => e.id !== selectedId));
      setSelectedId(null);
    }
  };

  const formatarData = (dataStr: string) => {
    const d = new Date(dataStr);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="title-section" style={{ flexShrink: 0 }}>
        <span>Caixa de Entrada</span>
      </div>

      <div className="glass-card" style={{ padding: 0, display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Painel Esquerdo: Lista de Emails */}
        <div style={{ width: '320px', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', fontWeight: 700, color: 'var(--text-muted)' }}>
            Caixa de Entrada ({emails.filter(e => !e.isRead).length} não lidas)
          </div>
          
          <div style={{ flexGrow: 1, overflowY: 'auto' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>}
            {!loading && emails.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Caixa vazia</div>}
            
            {emails.map((email) => (
              <div 
                key={email.id}
                onClick={() => handleSelectEmail(email.id)}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  background: selectedId === email.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                  borderLeft: !email.isRead ? '3px solid var(--accent-color)' : '3px solid transparent',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => {
                  if (selectedId !== email.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
                onMouseOut={(e) => {
                  if (selectedId !== email.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: !email.isRead ? 700 : 600, color: !email.isRead ? '#fff' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {email.sender}
                  </span>
                </div>
                <div style={{ fontWeight: !email.isRead ? 700 : 500, fontSize: '0.95rem', color: !email.isRead ? 'var(--accent-color)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {email.subject}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {formatarData(email.date)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Painel Direito: Leitura do Email */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)' }}>
          {selectedEmail ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Header do Email */}
              <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', color: '#fff' }}>{selectedEmail.subject}</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {selectedEmail.sender.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{selectedEmail.sender}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Para: Treinador</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {formatarData(selectedEmail.date)}
                  </div>
                </div>
              </div>
              
              {/* Corpo do Email */}
              <div style={{ padding: '30px', flexGrow: 1, overflowY: 'auto', fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                {selectedEmail.content}
              </div>
              
              {/* Ações específicas de mensagens acionáveis (convite de emprego / proposta de transferência) */}
              {selectedEmail.actionType === 'job_offer' && !selectedEmail.actionDone && (
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '12px', background: 'rgba(0,240,255,0.03)' }}>
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={handleAceitarEmprego}>✅ Aceitar Proposta</button>
                  <button className="btn btn-secondary btn-sm" disabled={busy} onClick={handleRecusarEmprego}>Recusar</button>
                </div>
              )}
              {selectedEmail.actionType === 'transfer_offer' && !selectedEmail.actionDone && (
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '12px', background: 'rgba(0,240,255,0.03)' }}>
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => handleResolverTransferencia(true)}>✅ Aceitar Oferta</button>
                  <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => handleResolverTransferencia(false)}>Recusar</button>
                </div>
              )}
              {selectedEmail.actionType === 'fired' && (
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--glass-border)', background: 'rgba(255,23,68,0.05)', color: 'var(--danger-color)', fontWeight: 600, fontSize: '0.85rem' }}>
                  ⚠️ Você foi demitido deste clube.
                </div>
              )}

              {/* Ações (Apagar) */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger-color)', borderColor: 'rgba(var(--danger-color-rgb), 0.3)' }} onClick={handleDelete}>Apagar</button>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '3rem', opacity: 0.2 }}>✉️</span>
              <p>Selecione uma mensagem para ler.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
