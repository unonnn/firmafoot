import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface AuctionData {
  auctionId: string;
  playerId: string;
  playerName: string;
  lanceAtual: number;
  maiorLanceUserId: string | null;
  maiorLanceUserName: string;
  dataExpiracao: string;
}

export function useMarketSocket(serverUrl: string = 'http://localhost:3000/market') {
  const [activeAuctions, setActiveAuctions] = useState<Record<string, AuctionData>>({});
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(serverUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('auctionUpdate', (data: AuctionData) => {
      setActiveAuctions((prev) => ({
        ...prev,
        [data.auctionId]: data,
      }));
    });

    socket.on('auctionError', (err: { message: string }) => {
      setError(err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  const placeBid = useCallback((auctionId: string, managerId: string, bidAmount: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('placeBid', { auctionId, managerId, bidAmount });
    } else {
      setError('Conexão com o mercado não estabelecida.');
    }
  }, [isConnected]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    activeAuctions,
    isConnected,
    error,
    placeBid,
    clearError,
  };
}
