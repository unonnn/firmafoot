'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { getSquadAction, saveTacticsAction, getFormationAction, getConversationTypesAction } from '@/app/actions';
import { FORMATIONS, obterFatorPosicao } from '@/lib/game/positions';
import PlayerModal from './PlayerModal';
import TrainingFocus from './TrainingFocus';

function estaIndisponivel(player: any): boolean {
  return Boolean(player.isInjured || player.redCard || player.yellowCards >= 2);
}

function DraggablePlayer({ player, onOpen }: { player: any; onOpen: (player: any) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: player.id.toString(),
    data: player,
  });

  const indisponivel = estaIndisponivel(player);

  const style: React.CSSProperties = {
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="player-list-item"
      onClick={() => onOpen(player)}
    >
      <div style={{ flex: '1', fontWeight: 600 }}>
        {player.name}
        {indisponivel && <span title="Lesionado/Suspenso" style={{ marginLeft: '6px', color: 'var(--danger-color)' }}>⚠</span>}
      </div>
      <div style={{ width: '60px', textAlign: 'center' }}><span className={`player-badge-pos ${player.position}`}>{player.position}</span></div>
      <div style={{ width: '50px', textAlign: 'center', fontWeight: 700 }}>{player.strength}</div>
      <div style={{ width: '60px', textAlign: 'center' }}>{player.fitness}%</div>
      <div style={{ width: '60px', textAlign: 'center' }}>
        <span style={{ color: player.status !== 'reserva' ? 'var(--success-color)' : 'var(--accent-color)', fontWeight: 700 }}>
          {player.status !== 'reserva' ? 'CAMPO' : 'RES'}
        </span>
      </div>
    </div>
  );
}

function DroppablePitchPosition({
  id,
  player,
  top,
  left,
  tacticalPosition,
  onOpen,
}: {
  id: string;
  player: any;
  top: number;
  left: number;
  tacticalPosition: string;
  onOpen: (player: any) => void;
}) {
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: id,
    data: { isPitchSlot: true },
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: player ? player.id.toString() : `empty-${id}`,
    data: player,
    disabled: !player,
  });

  // Ref combinado precisa de identidade estável: uma arrow function inline aqui
  // seria recriada a cada render e faria o dnd-kit desregistrar/registrar o nó
  // repetidamente durante o próprio arraste, quebrando a detecção de destino.
  const setRefs = useCallback((node: HTMLElement | null) => {
    setDroppableRef(node);
    if (player) setDraggableRef(node);
  }, [player, setDroppableRef, setDraggableRef]);

  const fator = player ? obterFatorPosicao(player.position, player.secondaryPosition, tacticalPosition) : 1;
  const forcaEfetiva = player ? Math.round(player.strength * fator) : null;

  let forceClass = 'pitch-player-force';
  let statusIcon: string | null = null;
  let extraClass = '';
  if (player && fator < 1) {
    if (fator === 0.9) {
      forceClass += ' force-sec-pos';
      statusIcon = '⭐';
    } else if (fator <= 0.2) {
      forceClass += ' force-out-pos';
      statusIcon = '⚠️';
      extraClass = ' out-of-position-critical';
    } else {
      forceClass += ' force-out-pos';
      statusIcon = '⚠️';
      extraClass = ' out-of-position-warn';
    }
  }
  if (player && estaIndisponivel(player)) {
    extraClass += ' out-of-position-critical';
  }

  const style = {
    top: `${top}%`,
    left: `${left}%`,
    '--team-color-primary': '#e21a22',
    transform: `translate(-50%, -50%) ${isOver ? 'scale(1.1)' : ''}`,
    border: isOver ? '2px dashed var(--accent-color)' : 'none',
    zIndex: 10,
    opacity: isDragging ? 0.3 : 1,
    cursor: player ? 'grab' : 'default',
  } as React.CSSProperties;

  return (
    <div
      ref={setRefs}
      className={`pitch-player${extraClass}`}
      style={style}
      {...(player ? listeners : {})}
      {...(player ? attributes : {})}
      onClick={() => player && onOpen(player)}
    >
      <div className="pitch-player-shirt" style={{ color: '#fff' }}>{tacticalPosition}</div>
      <div className="pitch-player-name">
        {player?.name?.split(' ')[0] || 'Vazio'} {statusIcon}
      </div>
      {player && <div className={forceClass}>{forcaEfetiva}</div>}
    </div>
  );
}

function PlayerDragPreview({ player }: { player: any }) {
  return (
    <div className="pitch-player" style={{ position: 'relative', top: 0, left: 0, transform: 'none', cursor: 'grabbing' }}>
      <div className="pitch-player-shirt" style={{ color: '#fff' }}>{player?.position || '?'}</div>
      <div className="pitch-player-name">{player?.name?.split(" ")[0] || ''}</div>
      <div className="pitch-player-force">{player?.strength || ''}</div>
    </div>
  );
}

export default function Tactics() {
  const [subAba, setSubAba] = useState<'campo' | 'treino'>('campo');
  const [esquema, setEsquema] = useState("4-4-2");
  const [squad, setSquad] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationTypes, setConversationTypes] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [activePlayer, setActivePlayer] = useState<any>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  // O card de origem não se move de verdade no DOM durante o arraste (só o
  // DragOverlay visualmente segue o cursor) — então o navegador dispara um "click"
  // sintético no card de origem logo após o drop. Sem essa flag, todo drag-and-drop
  // reabriria o modal do jogador por acidente.
  const dragOcorreuRef = useRef(false);
  const abrirModal = useCallback((player: any) => {
    if (dragOcorreuRef.current) return;
    setSelectedPlayer(player);
  }, []);

  const carregarDados = useCallback(() => {
    Promise.all([getSquadAction(), getFormationAction(), getConversationTypesAction()]).then(([data, savedFormation, tipos]) => {
      const withStatus = data.map(p => ({
        ...p,
        status: (p.characteristic && p.characteristic.startsWith('pitch-')) ? p.characteristic : 'reserva'
      }));
      setSquad(withStatus);
      setEsquema(savedFormation);
      setConversationTypes(tipos);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Mantém o modal em sincronia com o elenco depois de uma ação (conversa, contrato, etc).
  useEffect(() => {
    if (selectedPlayer) {
      const atualizado = squad.find((p) => p.id === selectedPlayer.id);
      setSelectedPlayer(atualizado ?? null);
    }
  }, [squad]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragStart = (event: DragStartEvent) => {
    dragOcorreuRef.current = true;
    const p = squad.find(s => s.id.toString() === event.active.id.toString());
    setActivePlayer(p || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Reseta só depois do "click" sintético do navegador (se houver) já ter passado
    // pelo guard em `abrirModal`.
    requestAnimationFrame(() => { dragOcorreuRef.current = false; });

    setActivePlayer(null);
    const { active, over } = event;
    if (!over) return;

    const activePlayerId = active.id.toString();
    const overId = over.id.toString(); // Pode ser 'pitch-X'

    const draggedPlayer = squad.find((p) => p.id.toString() === activePlayerId);
    if (!draggedPlayer) return;

    if (over.data?.current?.isPitchSlot && estaIndisponivel(draggedPlayer)) {
      alert(`${draggedPlayer.name} está lesionado ou suspenso e não pode ser escalado como titular.`);
      return;
    }

    setSquad(prev => {
      const newSquad = [...prev];
      const draggedIndex = newSquad.findIndex(p => p.id.toString() === activePlayerId);
      if (draggedIndex === -1) return prev;

      if (over.data?.current?.isPitchSlot) {
        const existingPlayerIndex = newSquad.findIndex(p => p.status === overId);
        if (existingPlayerIndex !== -1) {
          newSquad[existingPlayerIndex].status = newSquad[draggedIndex].status;
        }
        newSquad[draggedIndex].status = overId;
      } else if (over.data?.current?.isBench) {
        newSquad[draggedIndex].status = 'reserva';
      }
      return newSquad;
    });
  };

  const { setNodeRef: setBenchRef } = useDroppable({
    id: 'bench',
    data: { isBench: true },
  });

  const handleSave = async () => {
    setSaving(true);
    const updates = squad.map(p => ({ id: p.id, status: p.status }));
    try {
      const { rejected } = await saveTacticsAction(updates, esquema);
      if (rejected.length > 0) {
        alert(`Alguns jogadores voltaram para a reserva por estarem lesionados/suspensos: ${rejected.join(', ')}`);
        carregarDados();
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const coords = FORMATIONS[esquema] || FORMATIONS["4-4-2"];

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="fade-in">
        <div className="title-section">
          <span>Táticas e Plantel</span>
          {subAba === 'campo' && (
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: '8px' }}>Esquema:</label>
              <select
                value={esquema}
                onChange={(e) => setEsquema(e.target.value)}
                className="form-control"
                style={{ display: 'inline-block', width: 'auto', padding: '4px 8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
              >
                <option value="4-4-2">4-4-2</option>
                <option value="4-3-3">4-3-3</option>
                <option value="3-5-2">3-5-2</option>
                <option value="4-2-3-1">4-2-3-1</option>
                <option value="4-3-1-2">4-3-1-2</option>
                <option value="3-4-3">3-4-3</option>
                <option value="5-3-2">5-3-2</option>
                <option value="5-4-1">5-4-1</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', justifyContent: 'space-between' }}>
          <div>
            <button
              className={`btn btn-sm ${subAba === 'campo' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ marginRight: '10px' }}
              onClick={() => setSubAba('campo')}
            >
              Escalação & Campo
            </button>
            <button
              className={`btn btn-sm ${subAba === 'treino' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSubAba('treino')}
            >
              Foco de Treinamento
            </button>
          </div>
          {subAba === 'campo' && (
            <button className="btn btn-sm" onClick={handleSave} disabled={saving} style={{ background: 'var(--success-color)', color: '#fff' }}>
              {saving ? 'Salvando...' : 'Salvar Tática'}
            </button>
          )}
        </div>

        {subAba === 'treino' ? (
          <TrainingFocus />
        ) : (
        <div className="tactics-layout">
          {/* LADO ESQUERDO: Campo Visual */}
          <div className="soccer-pitch-container">
            <div className="soccer-pitch" id="visual-pitch">
              <div className="center-line"></div>
              <div className="center-circle"></div>
              <div className="penalty-area-top"></div>
              <div className="penalty-area-bottom"></div>

              {/* Renderiza as posições FIXAS (Droppables) baseadas no esquema */}
              {coords.map((pos, i) => {
                const slotId = `pitch-${i}`;
                const playerInSlot = squad.find(p => p.status === slotId);
                return (
                  <DroppablePitchPosition
                    key={slotId}
                    id={slotId}
                    player={playerInSlot}
                    top={pos.top}
                    left={pos.left}
                    tacticalPosition={pos.pos}
                    onOpen={abrirModal}
                  />
                );
              })}
            </div>
          </div>

          {/* LADO DIREITO: Tabela com Jogadores (Draggables) */}
          <div className="glass-card" style={{ padding: '16px', overflowY: 'auto', height: '850px' }}>
            <div className="section-title">Elenco Geral</div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Carregando elenco...</div>
            ) : squad.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Você ainda não escolheu um time ou o time não tem jogadores.</div>
            ) : (
              <div className="player-list-container">
                <div style={{ display: 'flex', padding: '10px 12px', fontWeight: 800, borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ flex: '1' }}>Nome</div>
                  <div style={{ width: '60px', textAlign: 'center' }}>Pos</div>
                  <div style={{ width: '50px', textAlign: 'center' }}>For</div>
                  <div style={{ width: '60px', textAlign: 'center' }}>Físico</div>
                  <div style={{ width: '60px', textAlign: 'center' }}>Status</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.05)', fontWeight: 800, color: 'var(--success-color)', textTransform: 'uppercase', padding: '10px 12px' }}>
                  Escalados no Campo
                </div>
                {squad.filter(p => p.status !== 'reserva').map(p => (
                  <DraggablePlayer key={p.id} player={p} onOpen={abrirModal} />
                ))}

                <div ref={setBenchRef} style={{ minHeight: '200px', paddingBottom: '20px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', fontWeight: 800, color: 'var(--accent-color)', textTransform: 'uppercase', padding: '10px 12px', marginTop: '10px' }}>
                    Reservas (Arraste jogadores para cá para tira-los do campo)
                  </div>
                  {squad.filter(p => p.status === 'reserva').map(p => (
                    <DraggablePlayer key={p.id} player={p} onOpen={abrirModal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      <DragOverlay dropAnimation={null}>
        {activePlayer ? <PlayerDragPreview player={activePlayer} /> : null}
      </DragOverlay>

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          conversationTypes={conversationTypes}
          onClose={() => setSelectedPlayer(null)}
          onChanged={carregarDados}
        />
      )}
    </DndContext>
  );
}
