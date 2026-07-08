// Cálculo de chance de acordo numa negociação de transferência/empréstimo. Inspirado
// nos fatores de js/components/market.js:267-377 (reputação, titularidade, valor
// oferecido), mas simplificado para um único cálculo direto em vez do fluxo de
// contraproposta iterativa do jogo original.
export interface ChanceAcordoInput {
  tipoOferta: "buy" | "loan";
  isTitular: boolean; // o jogador está escalado (pitch-N) no time vendedor
  reputacaoCompradora: number;
  reputacaoVendedora: number;
  percentualValorOferecido: number; // 90-120 (% do valor de mercado)
  percentualSalarioOferecido: number; // 100-150 (% do salário atual)
}

// Clubes vendedores recusam categoricamente emprestar um titular — portado de
// js/components/market.js:336-377 ("recusa categórica de emprestar titular").
export function calcularChanceAcordo(input: ChanceAcordoInput): number {
  if (input.tipoOferta === "loan" && input.isTitular) return 0;

  let chance = 50;
  chance += (input.reputacaoCompradora - input.reputacaoVendedora) * 0.5;
  chance += (input.percentualValorOferecido - 100) * 1.2;
  chance += (input.percentualSalarioOferecido - 100) * 0.3;
  if (input.isTitular) chance -= 25;

  return Math.max(2, Math.min(95, Math.round(chance)));
}

export const LIMITE_ELENCO = 45; // teto de sanidade — elencos reais já vêm com 25-39
export const MINIMO_ELENCO_PARA_VENDA = 15;
export const DESAGIO_VENDA_INSTANTANEA = 0.8; // vende a 80% do valor de mercado
export const TAXA_LEI_DO_EX = 0.02; // 2% do valor de mercado para enfrentar o clube de origem
