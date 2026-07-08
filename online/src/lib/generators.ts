const NOMES = [
  "Gabriel", "Lucas", "Matheus", "Pedro", "João", "Guilherme", "Gustavo", "Felipe", "Vinícius", "Arthur",
  "Dudu", "Thiago", "Rodrigo", "Bruno", "Diego", "Everton", "Maycon", "Alan", "Igor", "Renato",
  "Yuri", "Marcos", "Rafael", "Alex", "Vitor", "Douglas", "Samuel", "Murilo", "Caio", "Luan"
];

const SOBRENOMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes",
  "Costa", "Ribeiro", "Martins", "Carvalho", "Teixeira", "Almeida", "Barbosa", "Pinto", "Araújo", "Cardoso",
  "Melo", "Rocha", "Dias", "Moreira", "Nunes", "Marques", "Machado", "Mendes", "Freitas", "Lopes"
];

const CARACTERISTICAS: Record<string, string[]> = {
  GOL: ["Reflexo", "Saída de Gol", "Elasticidade", "Pênaltis"],
  ZAG: ["Desarme", "Cabeceio", "Posicionamento", "Força"],
  LE: ["Cruzamento", "Desarme", "Velocidade", "Passe"],
  LD: ["Cruzamento", "Desarme", "Velocidade", "Passe"],
  VOL: ["Desarme", "Passe", "Força", "Visão de Jogo"],
  MEI: ["Passe", "Visão de Jogo", "Drible", "Chute de Longe"],
  PE: ["Velocidade", "Drible", "Cruzamento", "Finalização"],
  PD: ["Velocidade", "Drible", "Cruzamento", "Finalização"],
  CA: ["Finalização", "Cabeceio", "Posicionamento", "Força"]
};

function obterCaracteristicaAleatoria(posicao: string) {
  const lista = CARACTERISTICAS[posicao] || CARACTERISTICAS.MEI;
  return lista[Math.floor(Math.random() * lista.length)];
}

function gerarNomeAleatorio() {
  const nome = NOMES[Math.floor(Math.random() * NOMES.length)];
  const sobrenome = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)];
  return `${nome} ${sobrenome}`;
}

export function calcularValorJogador(posicao: string, forca: number, idade: number) {
  let base = Math.pow(forca, 3.8) * 10;
  let fatorIdade = 1.0;
  if (idade < 23) fatorIdade = 1.2 + (23 - idade) * 0.05;
  else if (idade > 29) fatorIdade = Math.max(0.2, 1.0 - (idade - 29) * 0.1);
  return Math.round(base * fatorIdade);
}

export function calcularSalarioJogador(forca: number, idade: number) {
  let base = Math.pow(forca, 3) * 0.5;
  return Math.round(base);
}

export function obterPosicaoSecundaria(posicao: string) {
  if (posicao === "GOL") return null;
  const roll = Math.random();
  if (roll < 0.3) return null;
  
  switch(posicao) {
    case "LE": return Math.random() < 0.6 ? "LD" : "ZAG";
    case "LD": return Math.random() < 0.6 ? "LE" : "ZAG";
    case "ZAG": return Math.random() < 0.5 ? "LE" : (Math.random() < 0.5 ? "LD" : "VOL");
    case "VOL": return Math.random() < 0.7 ? "MEI" : "ZAG";
    case "MEI": return Math.random() < 0.4 ? "VOL" : (Math.random() < 0.5 ? "PE" : "PD");
    case "PE": return Math.random() < 0.6 ? "PD" : "CA";
    case "PD": return Math.random() < 0.6 ? "PE" : "CA";
    case "CA": return Math.random() < 0.5 ? "PE" : "PD";
    default: return null;
  }
}

type JogadorMock = {
  teamId: number;
  name: string;
  age: number;
  position: string;
  secondaryPosition: string | null;
  strength: number;
  characteristic: string;
  value: number;
  salary: number;
  fitness: number;
  yellowCards: number;
  redCard: boolean;
  goals: number;
  assists: number;
  isInjured: boolean;
  injuryTime: number;
  morale: number;
};

export function gerarElencoMock(teamId: number, repTime: number): JogadorMock[] {
  const posicoes = [
    { pos: "GOL", qtd: 2 },
    { pos: "ZAG", qtd: 4 },
    { pos: "LE", qtd: 2 },
    { pos: "LD", qtd: 2 },
    { pos: "VOL", qtd: 3 },
    { pos: "MEI", qtd: 4 },
    { pos: "PE", qtd: 2 },
    { pos: "PD", qtd: 2 },
    { pos: "CA", qtd: 2 }
  ];
  
  const elenco: JogadorMock[] = [];
  
  posicoes.forEach(({ pos, qtd }) => {
    for (let i = 0; i < qtd; i++) {
      const repConvertida = Math.floor(repTime / 20) || 3; // Adapta de 20-100 para 1-5 se necessario
      const forcaBaseMin = 50 + repConvertida * 5;
      const forcaBaseMax = forcaBaseMin + 12;
      const forca = Math.floor(Math.random() * (forcaBaseMax - forcaBaseMin + 1)) + forcaBaseMin;
      
      const idade = Math.floor(Math.random() * (36 - 17 + 1)) + 17;
      const valor = calcularValorJogador(pos, forca, idade);
      const salario = calcularSalarioJogador(forca, idade);
      
      elenco.push({
        teamId: teamId,
        name: gerarNomeAleatorio(),
        age: idade,
        position: pos,
        secondaryPosition: obterPosicaoSecundaria(pos),
        strength: forca,
        characteristic: obterCaracteristicaAleatoria(pos),
        value: valor,
        salary: salario,
        fitness: 100,
        yellowCards: 0,
        redCard: false,
        goals: 0,
        assists: 0,
        isInjured: false,
        injuryTime: 0,
        morale: 75,
      });
    }
  });
  
  return elenco;
}
