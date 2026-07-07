// Banco de Dados Inicial e Gerador de Jogadores
import { REAL_PLAYERS } from "./realPlayers.js";

export const TIMES_BASE = [
  { id: "fla", nome: "Flamengo", sigla: "FLA", rep: 5, saldo: 50000000, corPrimaria: "#e21a22", corSecundaria: "#000000", estadio: "Maracanã", capacidade: 78000 },
  { id: "pal", nome: "Palmeiras", sigla: "PAL", rep: 5, saldo: 45000000, corPrimaria: "#046d38", corSecundaria: "#ffffff", estadio: "Allianz Parque", capacidade: 43700 },
  { id: "sao", nome: "São Paulo", sigla: "SAO", rep: 4, saldo: 30000000, corPrimaria: "#e21a22", corSecundaria: "#ffffff", estadio: "MorumBIS", capacidade: 66000 },
  { id: "cor", nome: "Corinthians", sigla: "COR", rep: 4, saldo: 25000000, corPrimaria: "#000000", corSecundaria: "#ffffff", estadio: "Neo Química Arena", capacidade: 49000 },
  { id: "cam", nome: "Atlético Mineiro", sigla: "CAM", rep: 4, saldo: 30000000, corPrimaria: "#000000", corSecundaria: "#ffffff", estadio: "Arena MRV", capacidade: 46000 },
  { id: "gre", nome: "Grêmio", sigla: "GRE", rep: 4, saldo: 20000000, corPrimaria: "#0d80bf", corSecundaria: "#000000", estadio: "Arena do Grêmio", capacidade: 55600 },
  { id: "int", nome: "Internacional", sigla: "INT", rep: 4, saldo: 20000000, corPrimaria: "#e21a22", corSecundaria: "#ffffff", estadio: "Beira-Rio", capacidade: 50800 },
  { id: "flu", nome: "Fluminense", sigla: "FLU", rep: 4, saldo: 18000000, corPrimaria: "#861b2c", corSecundaria: "#165a29", estadio: "Maracanã", capacidade: 78000 },
  { id: "bot", nome: "Botafogo", sigla: "BOT", rep: 4, saldo: 25000000, corPrimaria: "#000000", corSecundaria: "#ffffff", estadio: "Nilton Santos", capacidade: 44000 },
  { id: "vas", nome: "Vasco da Gama", sigla: "VAS", rep: 4, saldo: 15000000, corPrimaria: "#000000", corSecundaria: "#ffffff", estadio: "São Januário", capacidade: 21000 },
  { id: "cru", nome: "Cruzeiro", sigla: "CRU", rep: 4, saldo: 16000000, corPrimaria: "#0033a0", corSecundaria: "#ffffff", estadio: "Mineirão", capacidade: 61000 },
  { id: "cap", nome: "Athletico Paranaense", sigla: "CAP", rep: 4, saldo: 22000000, corPrimaria: "#e21a22", corSecundaria: "#000000", estadio: "Ligga Arena", capacidade: 42300 },
  { id: "bah", nome: "Bahia", sigla: "BAH", rep: 3, saldo: 18000000, corPrimaria: "#005696", corSecundaria: "#e21a22", estadio: "Arena Fonte Nova", capacidade: 48000 },
  { id: "for", nome: "Fortaleza", sigla: "FOR", rep: 3, saldo: 12000000, corPrimaria: "#0051a2", corSecundaria: "#e21a22", estadio: "Castelão", capacidade: 63000 },
  { id: "rbb", nome: "RB Bragantino", sigla: "RBB", rep: 3, saldo: 15000000, corPrimaria: "#ffffff", corSecundaria: "#e21a22", estadio: "Nabi Abi Chedid", capacidade: 17000 },
  { id: "cui", nome: "Cuiabá", sigla: "CUI", rep: 2, saldo: 8000000, corPrimaria: "#096030", corSecundaria: "#fbc403", estadio: "Arena Pantanal", capacidade: 44000 },
  { id: "cri", nome: "Criciúma", sigla: "CRI", rep: 2, saldo: 7000000, corPrimaria: "#fbc403", corSecundaria: "#000000", estadio: "Heriberto Hülse", capacidade: 19000 },
  { id: "juv", nome: "Juventude", sigla: "JUV", rep: 2, saldo: 7000000, corPrimaria: "#096030", corSecundaria: "#ffffff", estadio: "Alfredo Jaconi", capacidade: 19000 },
  { id: "acg", nome: "Atlético Goianiense", sigla: "ACG", rep: 2, saldo: 6000000, corPrimaria: "#e21a22", corSecundaria: "#000000", estadio: "Antônio Accioly", capacidade: 12500 },
  { id: "vit", nome: "Vitória", sigla: "VIT", rep: 2, saldo: 6000000, corPrimaria: "#e21a22", corSecundaria: "#000000", estadio: "Barradão", capacidade: 35000 }
];

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

const CARACTERISTICAS = {
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

// Mapeia posições genéricas de elencos reais para posições específicas do futebol real
export function mapearPosicaoGenericaParaEspecifica(nome, posicao) {
  if (posicao === "GOL") return "GOL";
  
  const nomeLower = nome.toLowerCase();
  
  if (posicao === "DEF") {
    // Laterais Esquerdos conhecidos
    if (nomeLower.includes("ayrton lucas") || nomeLower.includes("alex sandro") || nomeLower.includes("piquerez") || nomeLower.includes("caio paulista") || nomeLower.includes("marçal") || nomeLower.includes("hugo") || nomeLower.includes("reinaldo") || nomeLower.includes("guilherme arana")) {
      return "LE";
    }
    // Laterais Direitos conhecidos
    if (nomeLower.includes("varela") || nomeLower.includes("wesley") || nomeLower.includes("rocha") || nomeLower.includes("mayke") || nomeLower.includes("mateo ponte") || nomeLower.includes("vitinho") || nomeLower.includes("rafinha") || nomeLower.includes("igor vinicius") || nomeLower.includes("saravia") || nomeLower.includes("william")) {
      return "LD";
    }
    // Distribuição randômica para outros defensores reais
    const roll = Math.random();
    if (roll < 0.25) return "LE";
    if (roll < 0.50) return "LD";
    return "ZAG";
  }
  
  if (posicao === "MEI") {
    // Volantes conhecidos (VOL)
    if (nomeLower.includes("pulgar") || nomeLower.includes("allan") || nomeLower.includes("aníbal") || nomeLower.includes("moreno") || nomeLower.includes("rios") || nomeLower.includes("zé rafael") || nomeLower.includes("gregore") || nomeLower.includes("marlon freitas") || nomeLower.includes("luiz gustavo") || nomeLower.includes("bobadilla") || nomeLower.includes("alisson") || nomeLower.includes("otávio") || nomeLower.includes("battaglia") || nomeLower.includes("villasanti") || nomeLower.includes("dodi") || nomeLower.includes("thiago maia") || nomeLower.includes("aránguiz")) {
      return "VOL";
    }
    // Distribuição randômica para outros meias reais
    return Math.random() < 0.45 ? "VOL" : "MEI";
  }
  
  if (posicao === "ATA") {
    // Centroavantes conhecidos (CA)
    if (nomeLower.includes("pedro") || nomeLower.includes("gabigol") || nomeLower.includes("flaco") || nomeLower.includes("lopez") || nomeLower.includes("tiquinho") || nomeLower.includes("calleri") || nomeLower.includes("cano") || nomeLower.includes("hulk") || nomeLower.includes("diego costa") || nomeLower.includes("borré") || nomeLower.includes("valencia") || nomeLower.includes("yuri alberto") || nomeLower.includes("vegetti")) {
      return "CA";
    }
    // Pontas Esquerdos conhecidos (PE)
    if (nomeLower.includes("cebolinha") || nomeLower.includes("bruno henrique") || nomeLower.includes("dudu") || nomeLower.includes("ferreira") || nomeLower.includes("keno") || nomeLower.includes("paulinho") || nomeLower.includes("soteldo")) {
      return "PE";
    }
    // Pontas Direitos conhecidos (PD)
    if (nomeLower.includes("luiz araújo") || nomeLower.includes("michael") || nomeLower.includes("estêvão") || nomeLower.includes("rony") || nomeLower.includes("luiz henrique") || nomeLower.includes("lucas moura") || nomeLower.includes("jhon arias") || nomeLower.includes("gustavo scarpa") || nomeLower.includes("pavón")) {
      return "PD";
    }
    // Distribuição randômica para outros atacantes reais
    const roll = Math.random();
    if (roll < 0.4) return "CA";
    return roll < 0.7 ? "PE" : "PD";
  }
  
  return posicao;
}

// Retorna uma característica aleatória para a posição
function obterCaracteristicaAleatoria(posicao) {
  const lista = CARACTERISTICAS[posicao] || CARACTERISTICAS.MEI;
  return lista[Math.floor(Math.random() * lista.length)];
}

// Gera um nome completo brasileiro aleatório
function gerarNomeAleatorio() {
  const nome = NOMES[Math.floor(Math.random() * NOMES.length)];
  const sobrenome = SOBRENOMES[Math.floor(Math.random() * SOBRENOMES.length)];
  return `${nome} ${sobrenome}`;
}

// Calcula o valor de mercado de um jogador baseado em força e idade
export function calcularValorJogador(posicao, forca, idade) {
  let base = Math.pow(forca, 3.8) * 10;
  // Fator idade: valoriza jovens (18-24), estabiliza (25-29), desvaloriza veteranos (30+)
  let fatorIdade = 1.0;
  if (idade < 23) fatorIdade = 1.2 + (23 - idade) * 0.05;
  else if (idade > 29) fatorIdade = Math.max(0.2, 1.0 - (idade - 29) * 0.1);
  
  return Math.round(base * fatorIdade);
}

// Computa o fator de posicionamento do jogador baseado em pos original, pos secundária e pos tática
export function obterFatorPosicao(posOriginal, posSecundaria, posTactical) {
  if (posOriginal === posTactical) return 1.0;
  if (posSecundaria === posTactical) return 0.90; // 10% de penalidade na secundária
  
  // Se for goleiro jogando na linha ou jogador de linha no gol
  if (posOriginal === "GOL" || posTactical === "GOL") return 0.20; // 80% de penalidade
  
  // Laterais e Zagueiros
  const laterais = ["LE", "LD"];
  if (posOriginal === "LE" && posTactical === "LD") return 0.85; // invertido
  if (posOriginal === "LD" && posTactical === "LE") return 0.85;
  if (posOriginal === "ZAG" && laterais.includes(posTactical)) return 0.80; // zagueiro na lateral
  if (laterais.includes(posOriginal) && posTactical === "ZAG") return 0.80; // lateral na zaga
  
  // Volantes e Meias
  const meios = ["VOL", "MEI"];
  if (meios.includes(posOriginal) && meios.includes(posTactical)) return 0.85; // volante de meia / meia de volante
  
  // Pontas e Centroavantes
  const atacantes = ["PE", "PD", "CA"];
  const pontas = ["PE", "PD"];
  if (posOriginal === "PE" && posTactical === "PD") return 0.85; // ponta invertido
  if (posOriginal === "PD" && posTactical === "PE") return 0.85;
  if (pontas.includes(posOriginal) && posTactical === "CA") return 0.80;
  if (posOriginal === "CA" && pontas.includes(posTactical)) return 0.80;
  
  // Meias de lado jogando de ponta ou vice-versa
  if (posOriginal === "MEI" && pontas.includes(posTactical)) return 0.80;
  if (pontas.includes(posOriginal) && posTactical === "MEI") return 0.80;
  
  // Se forem do mesmo grupo geral (defesa, meio ou ataque)
  const defensores = ["ZAG", "LE", "LD"];
  if (defensores.includes(posOriginal) && defensores.includes(posTactical)) return 0.80;
  if (meios.includes(posOriginal) && meios.includes(posTactical)) return 0.80;
  if (atacantes.includes(posOriginal) && atacantes.includes(posTactical)) return 0.80;
  
  // Fora de posição completo (ex: atacante na zaga)
  return 0.50; // 50% de penalidade
}

// Calcula o salário semanal/mensal estimado baseado na força e idade
export function calcularSalarioJogador(forca, idade) {
  let base = Math.pow(forca, 3) * 0.5;
  return Math.round(base);
}

// Retorna uma posição secundária aleatória para jogadores de linha
export function obterPosicaoSecundaria(posicao) {
  if (posicao === "GOL") return null;
  const roll = Math.random();
  if (roll < 0.3) return null; // 30% de chance de não ter posição secundária
  
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

// Gera um elenco completo para um time
export function gerarElenco(timeId, repTime) {
  // Se o time estiver no banco de dados de jogadores reais, usa ele!
  if (REAL_PLAYERS && REAL_PLAYERS[timeId]) {
    const elencoReal = REAL_PLAYERS[timeId];
    let idContador = 1;
    
    return elencoReal.map(p => {
      const posEspecifica = mapearPosicaoGenericaParaEspecifica(p.nome, p.posicao);
      const valor = calcularValorJogador(posEspecifica, p.forca, p.idade);
      const salario = calcularSalarioJogador(p.forca, p.idade);
      
      return {
        id: `${timeId}_p_${idContador++}`,
        nome: p.nome,
        idade: p.idade,
        posicao: posEspecifica,
        posicaoSecundaria: obterPosicaoSecundaria(posEspecifica),
        forca: p.forca,
        caracteristica: obterCaracteristicaAleatoria(posEspecifica),
        valor: valor,
        salario: salario,
        condicaoFisica: 100,
        cartoesAmarelos: 0,
        cartaoVermelho: false,
        gols: 0,
        assistencias: 0,
        lesionado: false,
        tempoLesao: 0,
        moral: 75,
        jogosTemporada: 0,
        historico: []
      };
    });
  }

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
  
  const elenco = [];
  let idContador = 1;
  
  posicoes.forEach(({ pos, qtd }) => {
    for (let i = 0; i < qtd; i++) {
      const forcaBaseMin = 50 + repTime * 5;
      const forcaBaseMax = forcaBaseMin + 12;
      const forca = Math.floor(Math.random() * (forcaBaseMax - forcaBaseMin + 1)) + forcaBaseMin;
      
      const idade = Math.floor(Math.random() * (36 - 17 + 1)) + 17;
      const valor = calcularValorJogador(pos, forca, idade);
      const salario = calcularSalarioJogador(forca, idade);
      
      elenco.push({
        id: `${timeId}_p_${idContador++}`,
        nome: gerarNomeAleatorio(),
        idade: idade,
        posicao: pos,
        posicaoSecundaria: obterPosicaoSecundaria(pos),
        forca: forca,
        caracteristica: obterCaracteristicaAleatoria(pos),
        valor: valor,
        salario: salario,
        condicaoFisica: 100,
        cartoesAmarelos: 0,
        cartaoVermelho: false,
        gols: 0,
        assistencias: 0,
        lesionado: false,
        tempoLesao: 0,
        moral: 75,
        jogosTemporada: 0,
        historico: []
      });
    }
  });
  
  return elenco;
}

// Inicializa a base completa de times e jogadores para o início do save
export function inicializarBaseTimes() {
  return TIMES_BASE.map(t => {
    const elenco = gerarElenco(t.id, t.rep);
    
    // Escalação padrão equilibrada de acordo com o 4-4-2 específico
    const goleiros = elenco.filter(p => p.posicao === "GOL").sort((a,b)=>b.forca-a.forca);
    const zagueiros = elenco.filter(p => p.posicao === "ZAG").sort((a,b)=>b.forca-a.forca);
    const les = elenco.filter(p => p.posicao === "LE").sort((a,b)=>b.forca-a.forca);
    const lds = elenco.filter(p => p.posicao === "LD").sort((a,b)=>b.forca-a.forca);
    const volantes = elenco.filter(p => p.posicao === "VOL").sort((a,b)=>b.forca-a.forca);
    const meias = elenco.filter(p => p.posicao === "MEI").sort((a,b)=>b.forca-a.forca);
    const pes = elenco.filter(p => p.posicao === "PE").sort((a,b)=>b.forca-a.forca);
    const pds = elenco.filter(p => p.posicao === "PD").sort((a,b)=>b.forca-a.forca);
    const cas = elenco.filter(p => p.posicao === "CA").sort((a,b)=>b.forca-a.forca);
    
    const titulares = [];
    
    // 0. GOL
    titulares.push(goleiros[0]?.id);
    // 1. LE
    titulares.push(les[0]?.id || zagueiros.shift()?.id);
    // 2. ZAG
    titulares.push(zagueiros.shift()?.id);
    // 3. ZAG
    titulares.push(zagueiros.shift()?.id);
    // 4. LD
    titulares.push(lds[0]?.id || zagueiros.shift()?.id);
    // 5. MEI (Esquerdo)
    titulares.push(meias.shift()?.id || volantes.shift()?.id);
    // 6. VOL
    titulares.push(volantes.shift()?.id || meias.shift()?.id);
    // 7. MEI (Ofensivo/Central)
    titulares.push(meias.shift()?.id || volantes.shift()?.id);
    // 8. MEI (Direito)
    titulares.push(meias.shift()?.id || volantes.shift()?.id);
    // 9. CA (Atacante)
    titulares.push(cas.shift()?.id || pes.shift()?.id || pds.shift()?.id);
    // 10. CA (Atacante)
    titulares.push(cas.shift()?.id || pds.shift()?.id || pes.shift()?.id);
    
    const titularesSet = new Set(titulares.filter(Boolean));
    const reservas = elenco
      .filter(p => !titularesSet.has(p.id))
      .sort((a, b) => b.forca - a.forca)
      .slice(0, 7)
      .map(p => p.id);
    
    return {
      ...t,
      rep: t.rep * 20, // Converte escala 1-5 estrelas do banco para 20-100 para o estado do jogo
      saf: false,
      emprestimo: 0,
      patrocinioMaster: null,
      patrocinioMaterial: null,
      ultimaReceitaCamisas: 0,
      jogadores: elenco,
      escalacao: {
        esquema: "4-4-2",
        titulares: titulares.filter(Boolean),
        reservas
      }
    };
  });
}

// Scout
export function gerarNovoJogador(repTime) {
  const posicoes = ["GOL", "ZAG", "LE", "LD", "VOL", "MEI", "PE", "PD", "CA"];
  const pos = posicoes[Math.floor(Math.random() * posicoes.length)];
  
  const forcaBaseMin = 50 + repTime * 5;
  const forcaBaseMax = forcaBaseMin + 12;
  const forca = Math.floor(Math.random() * (forcaBaseMax - forcaBaseMin + 1)) + forcaBaseMin;
  
  const idade = Math.floor(Math.random() * (36 - 17 + 1)) + 17;
  const valor = calcularValorJogador(pos, forca, idade);
  const salario = calcularSalarioJogador(forca, idade);
  
  return {
    id: `scout_p_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    nome: gerarNomeAleatorio(),
    idade: idade,
    posicao: pos,
    posicaoSecundaria: obterPosicaoSecundaria(pos),
    forca: forca,
    caracteristica: obterCaracteristicaAleatoria(pos),
    valor: valor,
    salario: salario,
    condicaoFisica: 100,
    cartoesAmarelos: 0,
    cartaoVermelho: false,
    gols: 0,
    assistencias: 0,
    lesionado: false,
    tempoLesao: 0,
    moral: 75,
    jogosTemporada: 0,
    historico: []
  };
}
