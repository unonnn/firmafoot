// Regras de posicionamento tático, portadas de js/db.js e js/components/tactics.js do jogo original.

export type Position = "GOL" | "LE" | "LD" | "ZAG" | "VOL" | "MEI" | "PE" | "PD" | "CA";

// Coordenadas (% top/left) de cada esquema tático, usadas tanto pela tela de Táticas
// quanto pelo motor de partida para saber em que posição tática cada titular está jogando.
export const FORMATIONS: Record<string, { pos: Position; top: number; left: number }[]> = {
  "4-4-2": [
    { pos: "GOL", top: 88, left: 50 },
    { pos: "LE", top: 70, left: 15 },
    { pos: "ZAG", top: 73, left: 38 },
    { pos: "ZAG", top: 73, left: 62 },
    { pos: "LD", top: 70, left: 85 },
    { pos: "MEI", top: 48, left: 15 },
    { pos: "VOL", top: 52, left: 38 },
    { pos: "MEI", top: 52, left: 62 },
    { pos: "MEI", top: 48, left: 85 },
    { pos: "CA", top: 22, left: 35 },
    { pos: "CA", top: 22, left: 65 },
  ],
  "4-3-3": [
    { pos: "GOL", top: 88, left: 50 },
    { pos: "LE", top: 70, left: 15 },
    { pos: "ZAG", top: 73, left: 38 },
    { pos: "ZAG", top: 73, left: 62 },
    { pos: "LD", top: 70, left: 85 },
    { pos: "VOL", top: 52, left: 25 },
    { pos: "MEI", top: 54, left: 50 },
    { pos: "VOL", top: 52, left: 75 },
    { pos: "PE", top: 22, left: 20 },
    { pos: "CA", top: 18, left: 50 },
    { pos: "PD", top: 22, left: 80 },
  ],
  "3-5-2": [
    { pos: "GOL", top: 88, left: 50 },
    { pos: "ZAG", top: 73, left: 25 },
    { pos: "ZAG", top: 76, left: 50 },
    { pos: "ZAG", top: 73, left: 75 },
    { pos: "LE", top: 50, left: 12 },
    { pos: "VOL", top: 52, left: 35 },
    { pos: "MEI", top: 54, left: 50 },
    { pos: "VOL", top: 52, left: 65 },
    { pos: "LD", top: 50, left: 88 },
    { pos: "CA", top: 22, left: 35 },
    { pos: "CA", top: 22, left: 65 },
  ],
  "5-3-2": [
    { pos: "GOL", top: 88, left: 50 },
    { pos: "LE", top: 68, left: 12 },
    { pos: "ZAG", top: 72, left: 31 },
    { pos: "ZAG", top: 74, left: 50 },
    { pos: "ZAG", top: 72, left: 69 },
    { pos: "LD", top: 68, left: 88 },
    { pos: "VOL", top: 50, left: 25 },
    { pos: "MEI", top: 54, left: 50 },
    { pos: "VOL", top: 50, left: 75 },
    { pos: "CA", top: 22, left: 35 },
    { pos: "CA", top: 22, left: 65 },
  ],
  "3-4-3": [
    { pos: "GOL", top: 88, left: 50 },
    { pos: "ZAG", top: 73, left: 25 },
    { pos: "ZAG", top: 76, left: 50 },
    { pos: "ZAG", top: 73, left: 75 },
    { pos: "LE", top: 50, left: 15 },
    { pos: "VOL", top: 53, left: 38 },
    { pos: "VOL", top: 53, left: 62 },
    { pos: "LD", top: 50, left: 85 },
    { pos: "PE", top: 22, left: 20 },
    { pos: "CA", top: 18, left: 50 },
    { pos: "PD", top: 22, left: 80 },
  ],
  "4-5-1": [
    { pos: "GOL", top: 88, left: 50 },
    { pos: "LE", top: 70, left: 15 },
    { pos: "ZAG", top: 73, left: 38 },
    { pos: "ZAG", top: 73, left: 62 },
    { pos: "LD", top: 70, left: 85 },
    { pos: "MEI", top: 50, left: 15 },
    { pos: "VOL", top: 54, left: 35 },
    { pos: "MEI", top: 56, left: 50 },
    { pos: "VOL", top: 54, left: 65 },
    { pos: "MEI", top: 50, left: 85 },
    { pos: "CA", top: 20, left: 50 },
  ],
  "4-2-3-1": [
    { pos: "GOL", top: 88, left: 50 },
    { pos: "LE", top: 70, left: 15 },
    { pos: "ZAG", top: 73, left: 38 },
    { pos: "ZAG", top: 73, left: 62 },
    { pos: "LD", top: 70, left: 85 },
    { pos: "VOL", top: 56, left: 35 },
    { pos: "VOL", top: 56, left: 65 },
    { pos: "PE", top: 40, left: 20 },
    { pos: "MEI", top: 42, left: 50 },
    { pos: "PD", top: 40, left: 80 },
    { pos: "CA", top: 20, left: 50 },
  ],
  "4-3-1-2": [
    { pos: "GOL", top: 90, left: 50 },
    { pos: "ZAG", top: 75, left: 35 },
    { pos: "ZAG", top: 75, left: 65 },
    { pos: "LE", top: 70, left: 15 },
    { pos: "LD", top: 70, left: 85 },
    { pos: "VOL", top: 50, left: 50 },
    { pos: "MEI", top: 45, left: 25 },
    { pos: "MEI", top: 45, left: 75 },
    { pos: "MEI", top: 30, left: 50 },
    { pos: "CA", top: 15, left: 35 },
    { pos: "CA", top: 15, left: 65 },
  ],
  "5-4-1": [
    { pos: "GOL", top: 88, left: 50 },
    { pos: "LE", top: 68, left: 12 },
    { pos: "ZAG", top: 72, left: 31 },
    { pos: "ZAG", top: 74, left: 50 },
    { pos: "ZAG", top: 72, left: 69 },
    { pos: "LD", top: 68, left: 88 },
    { pos: "MEI", top: 48, left: 15 },
    { pos: "VOL", top: 52, left: 38 },
    { pos: "MEI", top: 52, left: 62 },
    { pos: "MEI", top: 48, left: 85 },
    { pos: "CA", top: 20, left: 50 },
  ],
};

// Multiplicador de força efetiva de um jogador jogando na posição tática `posTactical`,
// dado sua posição original e secundária. 1.0 = sem penalidade.
// Portado de js/db.js:129-167.
export function obterFatorPosicao(
  posOriginal: string,
  posSecundaria: string | null | undefined,
  posTactical: string
): number {
  if (posOriginal === posTactical) return 1.0;
  if (posSecundaria === posTactical) return 0.9; // 10% de penalidade na secundária

  // Goleiro jogando na linha ou jogador de linha no gol
  if (posOriginal === "GOL" || posTactical === "GOL") return 0.2; // 80% de penalidade

  const laterais = ["LE", "LD"];
  if (posOriginal === "LE" && posTactical === "LD") return 0.85;
  if (posOriginal === "LD" && posTactical === "LE") return 0.85;
  if (posOriginal === "ZAG" && laterais.includes(posTactical)) return 0.8;
  if (laterais.includes(posOriginal) && posTactical === "ZAG") return 0.8;

  const meios = ["VOL", "MEI"];
  if (meios.includes(posOriginal) && meios.includes(posTactical)) return 0.85;

  const pontas = ["PE", "PD"];
  if (posOriginal === "PE" && posTactical === "PD") return 0.85;
  if (posOriginal === "PD" && posTactical === "PE") return 0.85;
  if (pontas.includes(posOriginal) && posTactical === "CA") return 0.8;
  if (posOriginal === "CA" && pontas.includes(posTactical)) return 0.8;

  if (posOriginal === "MEI" && pontas.includes(posTactical)) return 0.8;
  if (pontas.includes(posOriginal) && posTactical === "MEI") return 0.8;

  const defensores = ["ZAG", "LE", "LD"];
  const atacantes = ["PE", "PD", "CA"];
  if (defensores.includes(posOriginal) && defensores.includes(posTactical)) return 0.8;
  if (meios.includes(posOriginal) && meios.includes(posTactical)) return 0.8;
  if (atacantes.includes(posOriginal) && atacantes.includes(posTactical)) return 0.8;

  // Fora de posição completo (ex: atacante na zaga)
  return 0.5;
}

// Sorteia uma posição secundária plausível para um jogador, usada no backfill de
// jogadores reais (que vieram do scraping sem posição secundária) e na geração de
// reforços pelo scout. Portado de js/db.js:176-192.
export function sortearPosicaoSecundaria(posicao: string): string | null {
  if (posicao === "GOL") return null;
  if (Math.random() < 0.3) return null; // 30% de chance de não ter posição secundária

  switch (posicao) {
    case "LE":
      return Math.random() < 0.6 ? "LD" : "ZAG";
    case "LD":
      return Math.random() < 0.6 ? "LE" : "ZAG";
    case "ZAG":
      return Math.random() < 0.5 ? "LE" : Math.random() < 0.5 ? "LD" : "VOL";
    case "VOL":
      return Math.random() < 0.7 ? "MEI" : "ZAG";
    case "MEI":
      return Math.random() < 0.4 ? "VOL" : Math.random() < 0.5 ? "PE" : "PD";
    case "PE":
      return Math.random() < 0.6 ? "PD" : "CA";
    case "PD":
      return Math.random() < 0.6 ? "PE" : "CA";
    case "CA":
      return Math.random() < 0.5 ? "PE" : "PD";
    default:
      return null;
  }
}
