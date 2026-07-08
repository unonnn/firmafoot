import { FORMATIONS } from "../positions";
import type { MatchPlayerState, LineupSlot } from "../engine/types";

export interface EligiblePlayer {
  id: number;
  name: string;
  position: string;
  secondaryPosition: string | null;
  age: number;
  morale: number;
  strength: number;
  fitness: number;
  yellowCards: number;
  redCard: boolean;
  isInjured: boolean;
  characteristic: string | null; // guarda o slot salvo pela tela de Táticas ("pitch-N" | "reserva" | null)
}

function toMatchPlayerState(p: EligiblePlayer): MatchPlayerState {
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    secondaryPosition: p.secondaryPosition,
    age: p.age,
    morale: p.morale,
    strength: p.strength,
    fitness: p.fitness,
    yellowCards: p.yellowCards,
    redCard: p.redCard,
    goalsThisMatch: 0,
    injuredThisMatch: false,
    injuryRoundsOut: 0,
    removedFromMatch: false,
  };
}

function estaDisponivel(p: EligiblePlayer): boolean {
  return !p.isInjured && !p.redCard && p.yellowCards < 2;
}

// Resolve o lineup efetivo de um time para uma partida: respeita a escalação salva pelo
// técnico (coluna `characteristic` = "pitch-N", ver Tactics.tsx) quando o jogador está
// apto; preenche qualquer posição vaga (time sem tática definida, ou jogador
// lesionado/suspenso) com o melhor jogador disponível por posição — fallback necessário
// enquanto a Fase 3 (regras completas de escalação, tactics/lineup.ts) não existe, e
// também serve permanentemente para times sem técnico humano.
export function resolveEffectiveLineup(players: EligiblePlayer[], formation: string): LineupSlot[] {
  const coords = FORMATIONS[formation] || FORMATIONS["4-4-2"];
  const disponiveis = players.filter(estaDisponivel);
  const usados = new Set<number>();

  const slots: (LineupSlot | null)[] = coords.map(() => null);

  // 1ª passada: respeita o slot salvo pelo técnico, se o jogador estiver apto.
  coords.forEach((coord, idx) => {
    const slotId = `pitch-${idx}`;
    const salvo = disponiveis.find((p) => p.characteristic === slotId && !usados.has(p.id));
    if (salvo) {
      slots[idx] = { player: toMatchPlayerState(salvo), tacticalPosition: coord.pos };
      usados.add(salvo.id);
    }
  });

  const porForca = (a: EligiblePlayer, b: EligiblePlayer) => b.strength - a.strength;

  // 2ª passada: preenche vagas restantes — primeiro por posição principal, depois
  // secundária, depois qualquer jogador de linha restante (goleiro nunca improvisa aqui).
  coords.forEach((coord, idx) => {
    if (slots[idx]) return;

    const pool = disponiveis.filter((p) => !usados.has(p.id));
    let escolhido =
      pool.filter((p) => p.position === coord.pos).sort(porForca)[0] ??
      pool.filter((p) => p.secondaryPosition === coord.pos).sort(porForca)[0];

    if (!escolhido && coord.pos !== "GOL") {
      escolhido = pool.filter((p) => p.position !== "GOL").sort(porForca)[0];
    }
    if (!escolhido) {
      escolhido = pool.sort(porForca)[0];
    }

    if (escolhido) {
      slots[idx] = { player: toMatchPlayerState(escolhido), tacticalPosition: coord.pos };
      usados.add(escolhido.id);
    }
  });

  return slots.filter((s): s is LineupSlot => s !== null);
}
