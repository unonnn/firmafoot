export type ResultadoPartida = "vitoria" | "empate" | "derrota";

export function resultadoDoTime(golsPro: number, golsContra: number): ResultadoPartida {
  if (golsPro > golsContra) return "vitoria";
  if (golsPro < golsContra) return "derrota";
  return "empate";
}

// Ajuste de moral por jogador após a rodada, conforme ele jogou, ficou de reserva ou
// nem foi relacionado. Portado de js/main.js:1421-1431.
export function calcularNovaMoral(moralAtual: number, resultado: ResultadoPartida, jogou: boolean, isReserva: boolean): number {
  const moral = moralAtual ?? 75;
  if (resultado === "vitoria") {
    if (jogou) return Math.min(100, moral + 5);
    if (isReserva) return Math.min(100, moral + 2);
    return Math.max(0, moral - 2);
  }
  if (resultado === "derrota") {
    if (jogou) return Math.max(0, moral - 5);
    if (isReserva) return Math.max(0, moral - 2);
    return Math.max(0, moral - 3);
  }
  // empate
  if (!jogou && !isReserva) return Math.max(0, moral - 2);
  return moral;
}
