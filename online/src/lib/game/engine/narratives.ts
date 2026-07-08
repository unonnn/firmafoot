// Bancos de narrativa de lances de jogo, portados de js/engine.js:101-132.

export const NARRATIVAS_GOL = [
  "{autor} recebe na área, gira batendo no canto! É GOOOOL!",
  "{autor} chuta de longe, a bola faz uma curva incrível e entra na gaveta! QUE GOLAÇO!",
  "{autor} sobe mais alto que a zaga após escanteio e cabeceia forte para o fundo da rede!",
  "Contra-ataque rápido! {autor} sai cara a cara com o goleiro e toca por cobertura! Lindo gol!",
  "{autor} tabela com o companheiro, entra na área e chuta cruzado sem chances!",
];

export const NARRATIVAS_DEFESA = [
  "{autor} arrisca de fora da área, mas o goleiro {goleiro} voa para espalmar!",
  "{autor} tenta o cabeceio, mas {goleiro} faz uma defesa espetacular no reflexo!",
  "{autor} bate cruzado, a bola passa pelo zagueiro mas {goleiro} segura firme!",
  "{autor} chuta colocado, mas o goleiro {goleiro} estava atento e faz uma ponte segura!",
];

export const NARRATIVAS_FORA = [
  "{autor} chuta forte de primeira, mas manda a bola por cima do travessão!",
  "{autor} tenta colocar no canto, mas a bola sai raspando a trave esquerda!",
  "Falta perigosa! {autor} cobra por cima da barreira, mas a bola vai para fora.",
  "{autor} bate cruzado, a bola passa raspando a trave e sai pela linha de fundo!",
];

export const NARRATIVAS_FALTA_CARTAO = [
  "Falta dura de {autor}! O árbitro se aproxima e mostra o cartão amarelo.",
  "Entrada violenta de {autor} por trás! Cartão amarelo mostrado.",
  "Falta tática de {autor} para parar o contra-ataque. Cartão amarelo!",
];

export const NARRATIVAS_VERMELHO = [
  "{autor} faz falta violenta e recebe o cartão vermelho direto! Está expulso!",
  "Segunda falta dura de {autor}! Ele recebe o segundo amarelo e em seguida o CARTÃO VERMELHO!",
];

export function sortearNarrativa(lista: string[]): string {
  return lista[Math.floor(Math.random() * lista.length)];
}
