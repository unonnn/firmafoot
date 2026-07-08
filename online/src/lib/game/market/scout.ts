import { gerarElencoMock } from "@/lib/generators";

// O scout reaproveita o gerador de elenco fictício (src/lib/generators.ts, que até
// então era código morto — nunca chamado, ver auditoria da migração) só que sorteia
// um punhado de prospectos em vez de um elenco inteiro, pra popular o mercado de
// agentes livres. Portado do espírito de js/components/market.js:125-137
// (atualizarMercadoAleatoriamente).
export function gerarProspectosScout(reputacaoBase: number, quantidade = 5) {
  const pool = gerarElencoMock(-1, reputacaoBase); // teamId é descartado por quem chama (vira agente livre)
  const embaralhado = [...pool].sort(() => 0.5 - Math.random());
  return embaralhado.slice(0, quantidade);
}
