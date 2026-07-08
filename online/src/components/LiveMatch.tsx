'use client';
import { useEffect, useRef, useState } from 'react';

interface LiveMatchProps {
  matchId: number;
  onClose: () => void;
}

interface NarrationLine {
  min: number;
  texto: string;
  tipo: string;
  teamSide: 'home' | 'away';
}

interface MetaPayload {
  round: number;
  homeTeamName: string;
  awayTeamName: string;
}

// Renderiza `**Nome**` (padrão usado pelos bancos de narrativa do motor) em negrito.
function renderTexto(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

// Assiste à reprodução ritmada de uma partida já simulada, via SSE (ver
// /api/match/[id]/live/route.ts). A simulação é instantânea (roda no worker da
// rodada); esta tela só existe para dar a sensação de "jogo ao vivo".
export default function LiveMatch({ matchId, onClose }: LiveMatchProps) {
  const [meta, setMeta] = useState<MetaPayload | null>(null);
  const [minute, setMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [lines, setLines] = useState<NarrationLine[]>([]);
  const [finished, setFinished] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`/api/match/${matchId}/live`);

    es.onmessage = (e) => {
      const payload = JSON.parse(e.data);

      if (payload.type === 'meta') {
        setMeta(payload);
      } else if (payload.type === 'tick') {
        setMinute(payload.minute);
      } else if (payload.type === 'final') {
        setHomeScore(payload.homeScore ?? 0);
        setAwayScore(payload.awayScore ?? 0);
        setFinished(true);
        es.close();
      } else if (payload.tipo) {
        setLines((prev) => [...prev, payload]);
        if (payload.tipo === 'gol') {
          if (payload.teamSide === 'home') setHomeScore((s) => s + 1);
          else setAwayScore((s) => s + 1);
        }
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [matchId]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="glass-card" style={{ padding: '20px', marginTop: '20px' }}>
      <div className="match-live-board">
        <div className="live-team">
          <div className="live-team-badge"></div>
          <h3>{meta?.homeTeamName ?? '...'}</h3>
          <span className="live-posture">Mandante</span>
        </div>

        <div className="live-scoreboard">
          <div className="live-timer">{finished ? 'FIM DE JOGO' : `${minute}'`}</div>
          <div className="live-scores">
            <span>{homeScore}</span>
            <span className="colon">:</span>
            <span>{awayScore}</span>
          </div>
        </div>

        <div className="live-team">
          <div className="live-team-badge"></div>
          <h3>{meta?.awayTeamName ?? '...'}</h3>
          <span className="live-posture">Visitante</span>
        </div>
      </div>

      <div className="match-simulation-body">
        <div className="match-narration">
          <div className="section-title">Narração</div>
          <div className="narration-log" ref={logRef}>
            {lines.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Aguardando o início da partida...</span>}
            {lines.map((l, i) => (
              <div key={i} className={`narrative-line ${l.tipo}`}>
                <strong>{l.min}&apos;</strong> {renderTexto(l.texto)}
              </div>
            ))}
          </div>
        </div>
        <div className="match-live-tactics">
          <div className="section-title">Rodada {meta?.round ?? '-'}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {finished ? 'Partida encerrada.' : 'Partida em andamento...'}
          </p>
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
