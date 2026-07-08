import { obterFatorPosicao } from "../positions";
import type { LineupSlot, MatchPlayerState, Postura, Grito, TeamPower } from "./types";

// Modificador de moral na força efetiva, portado de js/engine.js:17-24.
function modificadorMoral(moral: number): number {
  if (moral >= 90) return 3;
  if (moral >= 70) return 1;
  if (moral >= 40) return 0;
  if (moral >= 20) return -2;
  return -5;
}

// Força efetiva de um jogador na posição tática que ele está ocupando, considerando
// físico, moral e penalidade de posicionamento. Portado de js/engine.js:17-37.
export function forcaEfetiva(player: MatchPlayerState, tacticalPosition: string): number {
  const fatorFisico = player.fitness / 100;
  const baseForca = player.strength * fatorFisico;
  const multPosicao = obterFatorPosicao(player.position, player.secondaryPosition, tacticalPosition);
  const forca = Math.round(baseForca * multPosicao + modificadorMoral(player.morale));
  return Math.max(15, forca);
}

// Calcula os índices de poder (defesa/meio/ataque) de um time a partir do lineup já
// resolvido (11 titulares + posição tática de cada um). Portado de js/engine.js:5-98,
// mas recebe o lineup pronto em vez de recalculá-lo a partir de escalação+esquema —
// essa resolução agora é responsabilidade de quem monta a partida (round/process-round.ts).
export function calcularPoderTime(
  lineup: LineupSlot[],
  opts: { postura?: Postura; grito?: Grito; bonusTatico?: number } = {}
): TeamPower {
  const postura = opts.postura ?? "equilibrada";
  const grito = opts.grito ?? "nenhum";
  const bonusTatico = opts.bonusTatico ?? 0;

  const goleiroSlot = lineup.find((s) => s.tacticalPosition === "GOL");
  const defensores = lineup.filter((s) => ["LE", "LD", "ZAG"].includes(s.tacticalPosition));
  const meioCampistas = lineup.filter((s) => ["VOL", "MEI"].includes(s.tacticalPosition));
  const atacantes = lineup.filter((s) => ["PE", "PD", "CA"].includes(s.tacticalPosition));

  const goleiro: MatchPlayerState = goleiroSlot?.player ?? {
    id: -1,
    name: "Goleiro Reserva",
    position: "GOL",
    secondaryPosition: null,
    age: 25,
    morale: 70,
    strength: 40,
    fitness: 100,
    yellowCards: 0,
    redCard: false,
    goalsThisMatch: 0,
    injuredThisMatch: false,
    injuryRoundsOut: 0,
    removedFromMatch: false,
  };

  const media = (slots: LineupSlot[]) =>
    slots.length > 0
      ? slots.reduce((sum, s) => sum + forcaEfetiva(s.player, s.tacticalPosition), 0) / slots.length
      : 40;

  const forcaGoleiro = goleiroSlot ? forcaEfetiva(goleiro, "GOL") : goleiro.strength;
  const forcaDefesa = media(defensores);
  const forcaMeio = media(meioCampistas);
  const forcaAtaque = media(atacantes);

  let poderDefesa = forcaGoleiro * 0.4 + forcaDefesa * 0.6;
  let poderMeio = forcaMeio;
  let poderAtaque = forcaAtaque;

  if (bonusTatico > 0) {
    poderDefesa *= 1 + bonusTatico / 100;
  }

  if (postura === "ofensiva") {
    poderAtaque *= 1.15;
    poderMeio *= 1.05;
    poderDefesa *= 0.9;
  } else if (postura === "defensiva") {
    poderAtaque *= 0.85;
    poderMeio *= 0.95;
    poderDefesa *= 1.15;
  }

  if (grito === "exigir") {
    poderAtaque *= 1.12;
    poderMeio *= 1.08;
  } else if (grito === "concentrar") {
    poderDefesa *= 1.12;
  } else if (grito === "acalmar") {
    poderMeio *= 1.15;
    poderAtaque *= 0.9;
  }

  return {
    defesa: Math.round(poderDefesa),
    meio: Math.round(poderMeio),
    ataque: Math.round(poderAtaque),
    goleiro,
    titulares: lineup,
    defensores,
    meioCampistas,
    atacantes,
  };
}
