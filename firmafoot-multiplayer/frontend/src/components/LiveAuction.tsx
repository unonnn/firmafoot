import React, { useState, useEffect } from 'react';
import { useMarketSocket, AuctionData } from '../hooks/useMarketSocket';

interface LiveAuctionProps {
  managerId: string;
  serverUrl?: string;
}

export const LiveAuction: React.FC<LiveAuctionProps> = ({ managerId, serverUrl }) => {
  const { activeAuctions, isConnected, error, placeBid, clearError } = useMarketSocket(serverUrl);
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleInputChange = (auctionId: string, value: string) => {
    setBidInputs((prev) => ({
      ...prev,
      [auctionId]: value,
    }));
  };

  const handleSendBid = (e: React.FormEvent, auctionId: string) => {
    e.preventDefault();
    const bidValue = parseFloat(bidInputs[auctionId]);
    
    if (isNaN(bidValue) || bidValue <= 0) {
      alert('Por favor, insira um valor de lance válido.');
      return;
    }

    placeBid(auctionId, managerId, bidValue);
    
    setBidInputs((prev) => ({
      ...prev,
      [auctionId]: '',
    }));
  };

  const auctionsList = Object.values(activeAuctions);

  return (
    <div className="live-auction-container" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <header style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Leilões em Tempo Real</h2>
          <span style={{ fontSize: '0.85rem', color: '#888' }}>
            Participe dos leilões de jogadores e dispute com seus colegas de trabalho.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#00ff66' : '#ff3366',
              display: 'inline-block'
            }}
          />
          <span style={{ fontSize: '0.8rem', color: '#ccc' }}>
            {isConnected ? 'Mercado Conectado' : 'Mercado Desconectado'}
          </span>
        </div>
      </header>

      {error && (
        <div 
          style={{
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            color: '#ff3366',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>⚠️ {error}</span>
          <button 
            onClick={clearError} 
            style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {auctionsList.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>
          Nenhum jogador em leilão no momento. Aguarde o início de novas rodadas.
        </p>
      ) : (
        <div className="auctions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {auctionsList.map((auction) => {
            const minNextBid = Math.ceil(auction.lanceAtual * 1.05);
            const timeRemaining = Math.max(0, new Date(auction.dataExpiracao).getTime() - Date.now());
            const minutesRemaining = Math.ceil(timeRemaining / 60000);

            return (
              <div 
                key={auction.auctionId} 
                className="auction-card" 
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>{auction.playerName}</h3>
                    <span style={{ fontSize: '0.78rem', color: '#ffcc00', fontWeight: 'bold' }}>
                      ⏳ Expira em: {minutesRemaining > 0 ? `${minutesRemaining} min` : 'Expirando'}
                    </span>
                  </div>
                </div>

                <div 
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.02)'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '4px' }}>Lance Atual:</div>
                  <div style={{ fontSize: '1.4rem', color: '#00ff66', fontWeight: 'bold' }}>
                    R$ {auction.lanceAtual.toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '6px' }}>
                    Dono do Lance: <strong style={{ color: '#fff' }}>{auction.maiorLanceUserName}</strong>
                  </div>
                </div>

                <form onSubmit={(e) => handleSendBid(e, auction.auctionId)} style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <input
                    type="number"
                    placeholder={`Min R$ ${minNextBid}`}
                    value={bidInputs[auction.auctionId] || ''}
                    min={minNextBid}
                    onChange={(e) => handleInputChange(auction.auctionId, e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '8px 12px',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#0070f3',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    Dar Lance
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
