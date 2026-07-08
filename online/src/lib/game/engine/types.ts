// Tipos compartilhados pelo motor de simulação (engine/*). Deliberadamente desacoplados
// do schema do Drizzle: o motor trabalha sobre um snapshot em memória; quem chama
// (round/process-round.ts) é responsável por montar esse snapshot a partir do banco
// e por persistir os deltas produzidos depois da simulação.

export type Postura = "ofensiva" | "equilibrada" | "defensiva";
export type Grito = "nenhum" | "exigir" | "concentrar" | "acalmar";

// Estado mutável de um jogador durante a simulação de uma partida.
export interface MatchPlayerState {
  id: number;
  name: string;
  position: string;
  secondaryPosition: string | null;
  age: number;
  morale: number;
  strength: number;
  fitness: number; // 0-100, decai minuto a minuto
  yellowCards: number;
  redCard: boolean;
  goalsThisMatch: number;
  injuredThisMatch: boolean;
  injuryRoundsOut: number; // preenchido só se `injuredThisMatch`
  removedFromMatch: boolean; // true após expulsão/lesão: sai da lista de titulares em campo
}

export interface LineupSlot {
  player: MatchPlayerState;
  tacticalPosition: string; // GOL | LE | LD | ZAG | VOL | MEI | PE | PD | CA
}

export interface TeamPower {
  defesa: number;
  meio: number;
  ataque: number;
  goleiro: MatchPlayerState;
  titulares: LineupSlot[];
  defensores: LineupSlot[];
  meioCampistas: LineupSlot[];
  atacantes: LineupSlot[];
}

export interface MatchEvent {
  min: number;
  texto: string;
  tipo: "gol" | "defesa" | "fora" | "cartao" | "vermelho";
  teamSide: "home" | "away";
}

export interface MatchSideResult {
  goals: number;
  shots: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  scorers: { playerId: number; name: string; min: number }[];
}

export interface MatchSimResult {
  home: MatchSideResult;
  away: MatchSideResult;
  events: MatchEvent[];
  attendance: number;
  revenue: number;
  finalPlayerStates: Map<number, MatchPlayerState>;
}
