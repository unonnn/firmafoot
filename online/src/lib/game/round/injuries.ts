// Regras de físico, cartões e lesões aplicadas a cada jogador ao final da rodada.
// Portado de js/main.js:1433-1460. A decadência de físico de quem jogou já é resolvida
// minuto a minuto pelo motor (engine/match.ts); aqui só tratamos recuperação de quem
// NÃO jogou e a evolução de cartões/lesões/cooldown de conversa.

export interface EstadoPosRodadaJogador {
  fitness: number;
  yellowCards: number;
  redCard: boolean;
  isInjured: boolean;
  injuryTime: number;
  conversationCooldown: number;
}

export function recuperarFisicoSeNaoJogou(fitnessAtual: number, jogou: boolean): number {
  if (jogou) return fitnessAtual;
  return Math.min(100, fitnessAtual + 18);
}

// Reseta cartão vermelho (cumpriu suspensão) e zera 2 amarelos acumulados (idem).
// Um único amarelo é preservado (só zera ao completar 2, igual ao jogo original).
export function resolverCartoes(yellowCards: number, redCard: boolean): { yellowCards: number; redCard: boolean } {
  if (redCard) return { yellowCards: 0, redCard: false };
  if (yellowCards >= 2) return { yellowCards: 0, redCard: false };
  return { yellowCards, redCard };
}

export function decrementarLesao(isInjured: boolean, injuryTime: number): { isInjured: boolean; injuryTime: number } {
  if (!isInjured) return { isInjured, injuryTime };
  const novoTempo = injuryTime - 1;
  if (novoTempo <= 0) return { isInjured: false, injuryTime: 0 };
  return { isInjured: true, injuryTime: novoTempo };
}

export function decrementarCooldownConversa(cooldown: number): number {
  return cooldown > 0 ? cooldown - 1 : 0;
}
