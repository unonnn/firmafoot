import { calcularPoderTime } from "./power";
import {
  NARRATIVAS_GOL,
  NARRATIVAS_DEFESA,
  NARRATIVAS_FORA,
  NARRATIVAS_FALTA_CARTAO,
  NARRATIVAS_VERMELHO,
  sortearNarrativa,
} from "./narratives";
import type {
  LineupSlot,
  MatchEvent,
  MatchPlayerState,
  MatchSimResult,
  Postura,
  Grito,
  TeamPower,
} from "./types";

export interface MatchTeamInput {
  lineup: LineupSlot[];
  postura?: Postura;
  grito?: Grito;
  bonusTatico?: number;
}

interface SideState {
  power: TeamPower;
  postura: Postura;
  grito: Grito;
  bonusTatico: number;
  isHome: boolean;
  goals: number;
  shots: number;
  fouls: number;
  yellowCardsCount: number;
  redCardsCount: number;
  scorers: { playerId: number; name: string; min: number }[];
}

function recalcularPoder(side: SideState) {
  side.power = calcularPoderTime(side.power.titulares, {
    postura: side.postura,
    grito: side.grito,
    bonusTatico: side.bonusTatico,
  });
  if (side.isHome) {
    side.power.defesa = Math.round(side.power.defesa * 1.05);
    side.power.meio = Math.round(side.power.meio * 1.05);
    side.power.ataque = Math.round(side.power.ataque * 1.05);
  }
}

function criarSide(input: MatchTeamInput, isHome: boolean): SideState {
  const side: SideState = {
    power: calcularPoderTime(input.lineup, {
      postura: input.postura,
      grito: input.grito,
      bonusTatico: input.bonusTatico,
    }),
    postura: input.postura ?? "equilibrada",
    grito: input.grito ?? "nenhum",
    bonusTatico: input.bonusTatico ?? 0,
    isHome,
    goals: 0,
    shots: 0,
    fouls: 0,
    yellowCardsCount: 0,
    redCardsCount: 0,
    scorers: [],
  };
  if (isHome) {
    side.power.defesa = Math.round(side.power.defesa * 1.05);
    side.power.meio = Math.round(side.power.meio * 1.05);
    side.power.ataque = Math.round(side.power.ataque * 1.05);
  }
  return side;
}

// Decaimento de físico por minuto, portado de js/engine.js:198-215.
// `decayMultiplier` escala a perda toda (editável no Admin como
// `match_fitness_decay_multiplier`) — o valor base (0.07-0.11/min ≈ 8-10% por
// partida pra um titular) é fiel ao jogo original, mas sem substituições no motor
// atual, titulares fixos acumulam perda partida após partida sem chance de descanso.
function decairStamina(side: SideState, decayMultiplier: number) {
  let multGrito = 1.0;
  if (side.grito === "exigir") multGrito = 1.6;
  else if (side.grito === "acalmar") multGrito = 0.65;

  for (const slot of side.power.titulares) {
    const jogador = slot.player;
    let fatorIdade = 1.0;
    if (jogador.age > 33) fatorIdade = 1.5;
    else if (jogador.age > 30) fatorIdade = 1.25;

    const perda = (0.07 + Math.random() * 0.04) * multGrito * fatorIdade * decayMultiplier;
    jogador.fitness = Math.max(30, jogador.fitness - perda);
  }
}

function removerJogador(side: SideState, playerId: number) {
  side.power.titulares = side.power.titulares.filter((s) => s.player.id !== playerId);
}

// Simula um único minuto. Retorna true se um evento relevante ocorreu. Portado de
// js/engine.js:188-377.
function simularMinuto(home: SideState, away: SideState, minuto: number, events: MatchEvent[], fitnessDecayMultiplier: number): void {
  decairStamina(home, fitnessDecayMultiplier);
  decairStamina(away, fitnessDecayMultiplier);

  if (minuto % 10 === 0) {
    recalcularPoder(home);
    recalcularPoder(away);
  }

  // 15% de chance de lance relevante no minuto
  if (Math.random() > 0.15) return;

  const poderMeioTotal = home.power.meio + away.power.meio;
  const chanceHome = home.power.meio / poderMeioTotal;
  const atacanteEhHome = Math.random() < chanceHome;
  const atacante = atacanteEhHome ? home : away;
  const defensor = atacanteEhHome ? away : home;
  const atacanteSide: "home" | "away" = atacanteEhHome ? "home" : "away";

  const roll = Math.random();

  if (roll < 0.7) {
    // CHANCE DE GOL
    atacante.shots += 1;

    const soma = atacante.power.ataque + defensor.power.defesa;
    let chanceDeGol = (atacante.power.ataque / soma) * 0.35;
    if (atacante.grito === "exigir") chanceDeGol *= 1.05;
    if (defensor.grito === "concentrar") chanceDeGol *= 0.9;

    const finalizadores = [...atacante.power.atacantes, ...atacante.power.meioCampistas];
    const finalizadorSlot = finalizadores.length > 0 ? finalizadores[Math.floor(Math.random() * finalizadores.length)] : null;
    const finalizador = finalizadorSlot?.player;

    if (finalizador && Math.random() < chanceDeGol) {
      atacante.goals += 1;
      finalizador.goalsThisMatch += 1;
      atacante.scorers.push({ playerId: finalizador.id, name: finalizador.name, min: minuto });

      const texto = sortearNarrativa(NARRATIVAS_GOL).replace("{autor}", `**${finalizador.name}**`);
      events.push({ min: minuto, texto, tipo: "gol", teamSide: atacanteSide });
      return;
    }

    if (finalizador) {
      if (Math.random() < 0.5) {
        const goleiroNome = defensor.power.goleiro.name;
        const texto = sortearNarrativa(NARRATIVAS_DEFESA)
          .replace("{autor}", `**${finalizador.name}**`)
          .replace("{goleiro}", `**${goleiroNome}**`);
        events.push({ min: minuto, texto, tipo: "defesa", teamSide: atacanteSide });
      } else {
        const texto = sortearNarrativa(NARRATIVAS_FORA).replace("{autor}", `**${finalizador.name}**`);
        events.push({ min: minuto, texto, tipo: "fora", teamSide: atacanteSide });
      }
    }
  } else if (roll < 0.9) {
    // FALTA E CARTÃO
    if (defensor.grito === "concentrar" && Math.random() < 0.35) return;

    defensor.fouls += 1;

    const defensoresEMeios = [...defensor.power.defensores, ...defensor.power.meioCampistas];
    if (defensoresEMeios.length === 0) return;
    const faltosoSlot = defensoresEMeios[Math.floor(Math.random() * defensoresEMeios.length)];
    const jogador = faltosoSlot.player;

    const defensorSide: "home" | "away" = defensor.isHome ? "home" : "away";
    const cardRoll = Math.random();
    if (cardRoll < 0.32) {
      if (jogador.yellowCards === 1) {
        jogador.yellowCards = 2;
        jogador.redCard = true;
        jogador.removedFromMatch = true;
        defensor.redCardsCount += 1;
        removerJogador(defensor, jogador.id);

        const texto = NARRATIVAS_VERMELHO[1].replace("{autor}", `**${jogador.name}**`);
        events.push({ min: minuto, texto, tipo: "vermelho", teamSide: defensorSide });
      } else if (!jogador.redCard) {
        jogador.yellowCards = 1;
        defensor.yellowCardsCount += 1;

        const texto = sortearNarrativa(NARRATIVAS_FALTA_CARTAO).replace("{autor}", `**${jogador.name}**`);
        events.push({ min: minuto, texto, tipo: "cartao", teamSide: defensorSide });
      }
    }
  } else {
    // LESÕES
    const todosJogadores = [...home.power.titulares, ...away.power.titulares];
    if (todosJogadores.length === 0) return;

    const sorteadoSlot = todosJogadores[Math.floor(Math.random() * todosJogadores.length)];
    const jogador = sorteadoSlot.player;
    const chanceLesao = jogador.fitness < 60 ? 0.35 : 0.08;

    if (Math.random() < chanceLesao) {
      jogador.injuredThisMatch = true;
      jogador.injuryRoundsOut = Math.floor(Math.random() * 4) + 1;
      jogador.fitness = Math.max(30, jogador.fitness - 15);
      jogador.removedFromMatch = true;

      const timeDono = home.power.titulares.some((s) => s.player.id === jogador.id) ? home : away;
      const timeDonoSide: "home" | "away" = timeDono.isHome ? "home" : "away";
      removerJogador(timeDono, jogador.id);

      events.push({
        min: minuto,
        texto: `🚨 **${jogador.name}** sofre lesão muscular grave e é retirado de maca!`,
        tipo: "vermelho",
        teamSide: timeDonoSide,
      });
    }
  }
}

// Estimativa de público, portada de js/components/finances.js:12-25 (demanda por
// reputação × elasticidade de preço em torno de R$30 de referência). Adaptação de
// escala: o jogo original usava reputação em estrelas (1-5, fatorDemanda = rep/5);
// nosso `teams.reputation` vem em 0-100 (times reais seedados em ~75-85), então
// normalizamos por 90 em vez de 5 pra manter times de elite perto da demanda máxima.
function estimarPublico(capacidade: number, reputacao: number, precoIngresso: number): number {
  const fatorDemanda = Math.min(1, reputacao / 90);
  const fatorPreco = Math.pow(30 / Math.max(1, precoIngresso), 1.2);
  return Math.max(0, Math.min(capacidade, Math.round(capacidade * fatorDemanda * fatorPreco)));
}

// Simulação instantânea completa dos 90 minutos. Portado de js/engine.js:135-401,
// adaptado para receber o lineup já resolvido e devolver os deltas de cada jogador
// para persistência posterior (o motor em si não toca no banco).
export function simularPartidaCompleta(
  homeInput: MatchTeamInput,
  awayInput: MatchTeamInput,
  options: { homeCapacity: number; homeTicketPrice: number; homeReputation: number; fitnessDecayMultiplier?: number }
): MatchSimResult {
  const home = criarSide(homeInput, true);
  const away = criarSide(awayInput, false);
  const events: MatchEvent[] = [];
  const fitnessDecayMultiplier = options.fitnessDecayMultiplier ?? 1.0;

  for (let minuto = 1; minuto <= 90; minuto++) {
    simularMinuto(home, away, minuto, events, fitnessDecayMultiplier);
  }

  const attendance = estimarPublico(options.homeCapacity, options.homeReputation, options.homeTicketPrice);
  const revenue = attendance * options.homeTicketPrice;

  const finalPlayerStates = new Map<number, MatchPlayerState>();
  for (const slot of [...homeInput.lineup, ...awayInput.lineup]) {
    finalPlayerStates.set(slot.player.id, slot.player);
  }

  return {
    home: {
      goals: home.goals,
      shots: home.shots,
      fouls: home.fouls,
      yellowCards: home.yellowCardsCount,
      redCards: home.redCardsCount,
      scorers: home.scorers,
    },
    away: {
      goals: away.goals,
      shots: away.shots,
      fouls: away.fouls,
      yellowCards: away.yellowCardsCount,
      redCards: away.redCardsCount,
      scorers: away.scorers,
    },
    events,
    attendance,
    revenue,
    finalPlayerStates,
  };
}
