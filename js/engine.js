import { COORDENADAS_FORMATACAO } from "./components/tactics.js";
import { obterFatorPosicao } from "./db.js";

// Calcula os índices de poder de um time com base na escalação atual, postura e gritos
export function calcularPoderTime(time, jogadoresMap, postura = "equilibrada", grito = "nenhum") {
  const esquema = time.escalacao.esquema || "4-4-2";
  const coords = COORDENADAS_FORMATACAO[esquema] || COORDENADAS_FORMATACAO["4-4-2"];
  
  // Alinha titulares com a posição tática correspondente no esquema
  const escaladosComPosicao = time.escalacao.titulares.map((id, idx) => {
    const player = jogadoresMap[id];
    const posTactical = coords[idx]?.pos || "MEI";
    return player ? { player, posTactical } : null;
  }).filter(Boolean);

  // Mapeamento de força efetiva considerando Condição Física (Stamina), Moral e Posicionamento em campo
  const obterForcaEfetiva = (p, posTactical) => {
    let modMoral = 0;
    const m = p.moral !== undefined ? p.moral : 70;
    if (m >= 90) modMoral = 3;      // Excelente
    else if (m >= 70) modMoral = 1; // Boa
    else if (m >= 40) modMoral = 0; // Regular
    else if (m >= 20) modMoral = -2;// Baixa
    else modMoral = -5;             // Muito Baixa
    
    // Condição física (energia) reduz proporcionalmente a força efetiva do jogador em campo
    const cond = p.condicaoFisica !== undefined ? p.condicaoFisica : 100;
    const fatorFisico = cond / 100;
    
    let baseForca = p.forca * fatorFisico;
    
    // Usa o novo helper obterFatorPosicao de db.js para obter o modificador exato de força
    let multPosicao = obterFatorPosicao(p.posicao, p.posicaoSecundaria, posTactical);
    
    let forcaEff = Math.round(baseForca * multPosicao + modMoral);
    return Math.max(15, forcaEff); // Força mínima é 15
  };
  
  const goleiroObj = escaladosComPosicao.find(item => item.posTactical === "GOL")?.player || { forca: 40, posicao: "GOL" };
  const defensores = escaladosComPosicao.filter(item => ["LE", "LD", "ZAG"].includes(item.posTactical));
  const meioCampistas = escaladosComPosicao.filter(item => ["VOL", "MEI"].includes(item.posTactical));
  const atacantes = escaladosComPosicao.filter(item => ["PE", "PD", "CA"].includes(item.posTactical));
  
  // Médias de força baseadas nas forças efetivas
  const forcaGoleiro = obterForcaEfetiva(goleiroObj, "GOL");
  const forcaDefesa = defensores.length > 0 
    ? defensores.reduce((sum, item) => sum + obterForcaEfetiva(item.player, item.posTactical), 0) / defensores.length 
    : 40;
  const forcaMeio = meioCampistas.length > 0 
    ? meioCampistas.reduce((sum, item) => sum + obterForcaEfetiva(item.player, item.posTactical), 0) / meioCampistas.length 
    : 40;
  const forcaAtaque = atacantes.length > 0 
    ? atacantes.reduce((sum, item) => sum + obterForcaEfetiva(item.player, item.posTactical), 0) / atacantes.length 
    : 40;
  
  // Poderes brutos
  let poderDefesa = (forcaGoleiro * 0.4) + (forcaDefesa * 0.6);
  let poderMeio = forcaMeio;
  let poderAtaque = forcaAtaque;
  
  // Aplica bônus tático do treinamento (se houver)
  if (time.bonusTatico && time.bonusTatico > 0) {
    poderDefesa *= (1 + (time.bonusTatico / 100));
  }
  
  // Modificadores de Postura
  if (postura === "ofensiva") {
    poderAtaque *= 1.15;
    poderMeio *= 1.05;
    poderDefesa *= 0.90;
  } else if (postura === "defensiva") {
    poderAtaque *= 0.85;
    poderMeio *= 0.95;
    poderDefesa *= 1.15;
  }
  
  // Modificadores de Instruções à Beira do Gramado (Gritos do Técnico)
  if (grito === "exigir") {
    poderAtaque *= 1.12;
    poderMeio *= 1.08;
  } else if (grito === "concentrar") {
    poderDefesa *= 1.12;
  } else if (grito === "acalmar") {
    poderMeio *= 1.15;
    poderAtaque *= 0.90;
  }
  
  return {
    defesa: Math.round(poderDefesa),
    meio: Math.round(poderMeio),
    ataque: Math.round(poderAtaque),
    goleiroObj: goleiroObj,
    titulares: escaladosComPosicao.map(item => item.player),
    defensores: defensores.map(item => item.player),
    meioCampistas: meioCampistas.map(item => item.player),
    atacantes: atacantes.map(item => item.player)
  };
}

// Banco de narrativas de lances de jogo
const NARRATIVAS_GOL = [
  "{autor} recebe na área, gira batendo no canto! É GOOOOL!",
  "{autor} chuta de longe, a bola faz uma curva incrível e entra na gaveta! QUE GOLAÇO!",
  "{autor} sobe mais alto que a zaga após escanteio e cabeceia forte para o fundo da rede!",
  "Contra-ataque rápido! {autor} sai cara a cara com o goleiro e toca por cobertura! Lindo gol!",
  "{autor} tabela com o companheiro, entra na área e chuta cruzado sem chances!"
];

const NARRATIVAS_DEFESA = [
  "{autor} arrisca de fora da área, mas o goleiro {goleiro} voa para espalmar!",
  "{autor} tenta o cabeceio, mas {goleiro} faz uma defesa espetacular no reflexo!",
  "{autor} bate cruzado, a bola passa pelo zagueiro mas {goleiro} segura firme!",
  "{autor} chuta colocado, mas o goleiro {goleiro} estava atento e faz uma ponte segura!"
];

const NARRATIVAS_FORA = [
  "{autor} chuta forte de primeira, mas manda a bola por cima do travessão!",
  "{autor} tenta colocar no canto, mas a bola sai raspando a trave esquerda!",
  "Falta perigosa! {autor} cobra por cima da barreira, mas a bola vai para fora.",
  "{autor} bate cruzado, a bola passa raspando a trave e sai pela linha de fundo!"
];

const NARRATIVAS_FALTA_CARTAO = [
  "Falta dura de {autor}! O árbitro se aproxima e mostra o cartão amarelo.",
  "Entrada violenta de {autor} por trás! Cartão amarelo mostrado.",
  "Falta tática de {autor} para parar o contra-ataque. Cartão amarelo!"
];

const NARRATIVAS_VERMELHO = [
  "{autor} faz falta violenta e recebe o cartão vermelho direto! Está expulso!",
  "Segunda falta dura de {autor}! Ele recebe o segundo amarelo e em seguida o CARTÃO VERMELHO!"
];

// Inicializa a estrutura de dados de uma partida em tempo real
export function iniciarPartida(homeTeam, awayTeam, jogadoresMap, posturaHome = "equilibrada", posturaAway = "equilibrada", gritoHome = "nenhum", gritoAway = "nenhum") {
  const pHome = calcularPoderTime(homeTeam, jogadoresMap, posturaHome, gritoHome);
  const pAway = calcularPoderTime(awayTeam, jogadoresMap, posturaAway, gritoAway);
  
  // Fator casa: time mandante ganha +5% de poder em todos os setores
  pHome.defesa *= 1.05;
  pHome.meio *= 1.05;
  pHome.ataque *= 1.05;
  
  // Estatísticas iniciais
  const publico = Math.round(homeTeam.capacidade * (0.5 + Math.random() * 0.5));
  const renda = publico * homeTeam.estadioPrecoIngresso;
  
  return {
    home: {
      id: homeTeam.id,
      nome: homeTeam.nome,
      corP: homeTeam.corPrimaria,
      corS: homeTeam.corSecundaria,
      gols: 0,
      poder: pHome,
      postura: posturaHome,
      grito: gritoHome,
      chutes: 0,
      faltas: 0,
      cartoesA: 0,
      cartoesV: 0,
      golsJogadores: []
    },
    away: {
      id: awayTeam.id,
      nome: awayTeam.nome,
      corP: awayTeam.corPrimaria,
      corS: awayTeam.corSecundaria,
      gols: 0,
      poder: pAway,
      postura: posturaAway,
      grito: gritoAway,
      chutes: 0,
      faltas: 0,
      cartoesA: 0,
      cartoesV: 0,
      golsJogadores: []
    },
    minuto: 0,
    eventos: [],
    encerrada: false,
    publico,
    renda
  };
}

// Simula um minuto da partida
export function simularMinutoPartida(partida, jogadoresMap) {
  if (partida.minuto >= 90) {
    partida.encerrada = true;
    return false;
  }
  
  partida.minuto += 1;
  const min = partida.minuto;
  
  // 1. Decaimento físico dinâmico por minuto (FM Stamina Decay)
  const decairStamina = (time, grito) => {
    let multGrito = 1.0;
    if (grito === "exigir") multGrito = 1.6; // Desgasta muito mais
    else if (grito === "acalmar") multGrito = 0.65; // Poupa fisicamente
    
    time.poder.titulares.forEach(p => {
      const jogador = jogadoresMap[p.id];
      if (jogador) {
        let fatorIdade = 1.0;
        if (jogador.idade > 33) fatorIdade = 1.5;
        else if (jogador.idade > 30) fatorIdade = 1.25;
        
        // Taxa básica por minuto (ex: ~0.1% a 0.15%)
        const perda = (0.07 + Math.random() * 0.04) * multGrito * fatorIdade;
        jogador.condicaoFisica = Math.max(30, jogador.condicaoFisica - perda);
      }
    });
  };
  
  decairStamina(partida.home, partida.home.grito);
  decairStamina(partida.away, partida.away.grito);
  
  // Recalcula poderes das equipes a cada 10 minutos com base na fadiga
  if (min % 10 === 0) {
    const userTeamSimu = {
      escalacao: { titulares: partida.home.poder.titulares.map(p => p.id) }
    };
    const opponentTeamSimu = {
      escalacao: { titulares: partida.away.poder.titulares.map(p => p.id) }
    };
    
    partida.home.poder = calcularPoderTime(userTeamSimu, jogadoresMap, partida.home.postura, partida.home.grito);
    partida.away.poder = calcularPoderTime(opponentTeamSimu, jogadoresMap, partida.away.postura, partida.away.grito);
    
    // reaplica fator casa
    partida.home.poder.defesa *= 1.05;
    partida.home.poder.meio *= 1.05;
    partida.home.poder.ataque *= 1.05;
  }
  
  // Chance de acontecer um lance importante (15% por minuto)
  if (Math.random() > 0.15) {
    return false;
  }
  
  const pHome = partida.home.poder;
  const pAway = partida.away.poder;
  
  // Controle de meio-campo define posse
  const poderMeioTotal = pHome.meio + pAway.meio;
  const chanceHome = pHome.meio / poderMeioTotal;
  const atacante = Math.random() < chanceHome ? partida.home : partida.away;
  const defensor = atacante === partida.home ? partida.away : partida.home;
  
  const roll = Math.random();
  
  if (roll < 0.70) {
    // CHANCE DE GOL
    atacante.chutes += 1;
    
    const poderAtaque = atacante.poder.ataque;
    const poderDefesa = defensor.poder.defesa;
    const soma = poderAtaque + poderDefesa;
    
    let chanceDeGol = (poderAtaque / soma) * 0.35;
    
    // Gritos afetando a precisão final
    if (atacante.grito === "exigir") chanceDeGol *= 1.05;
    if (defensor.grito === "concentrar") chanceDeGol *= 0.90;
    
    const finalizadores = [...atacante.poder.atacantes, ...atacante.poder.meioCampistas];
    const jogadorFinalizador = finalizadores.length > 0 
      ? finalizadores[Math.floor(Math.random() * finalizadores.length)] 
      : { nome: "Ataque" };
      
    if (Math.random() < chanceDeGol) {
      // GOL!
      atacante.gols += 1;
      
      const realP = jogadoresMap[jogadorFinalizador.id];
      if (realP) realP.gols = (realP.gols || 0) + 1;
      
      atacante.golsJogadores.push({ nome: jogadorFinalizador.nome, min });
      
      const modelo = NARRATIVAS_GOL[Math.floor(Math.random() * NARRATIVAS_GOL.length)];
      const texto = modelo.replace("{autor}", `**${jogadorFinalizador.nome}**`);
      
      partida.eventos.push({ min, texto, tipo: "gol", time: atacante.id });
      return true;
    } else {
      if (Math.random() < 0.5) {
        const goleiroNome = defensor.poder.goleiroObj.nome || "Goleiro";
        const modelo = NARRATIVAS_DEFESA[Math.floor(Math.random() * NARRATIVAS_DEFESA.length)];
        const texto = modelo
          .replace("{autor}", `**${jogadorFinalizador.nome}**`)
          .replace("{goleiro}", `**${goleiroNome}**`);
          
        partida.eventos.push({ min, texto, tipo: "defesa", time: atacante.id });
      } else {
        const modelo = NARRATIVAS_FORA[Math.floor(Math.random() * NARRATIVAS_FORA.length)];
        const texto = modelo.replace("{autor}", `**${jogadorFinalizador.nome}**`);
        
        partida.eventos.push({ min, texto, tipo: "fora", time: atacante.id });
      }
    }
  } else if (roll < 0.90) {
    // FALTA E CARTÃO
    
    // Grito concentrar reduz faltas do defensor
    if (defensor.grito === "concentrar" && Math.random() < 0.35) {
      return false; 
    }
    
    defensor.faltas += 1;
    
    const defensoresEmeios = [...defensor.poder.defensores, ...defensor.poder.meioCampistas];
    if (defensoresEmeios.length === 0) return false;
    const faltoso = defensoresEmeios[Math.floor(Math.random() * defensoresEmeios.length)];
    
    const cardRoll = Math.random();
    if (cardRoll < 0.32) {
      const jogador = jogadoresMap[faltoso.id];
      if (!jogador) return false;
      
      if (jogador.cartoesAmarelos === 1) {
        jogador.cartoesAmarelos = 2;
        jogador.cartaoVermelho = true;
        defensor.cartoesV += 1;
        
        // Remove do campo
        defensor.poder.titulares = defensor.poder.titulares.filter(p => p.id !== jogador.id);
        
        const texto = NARRATIVAS_VERMELHO[1].replace("{autor}", `**${jogador.nome}**`);
        partida.eventos.push({ min, texto, tipo: "vermelho", time: defensor.id });
      } else if (!jogador.cartaoVermelho) {
        jogador.cartoesAmarelos = 1;
        defensor.cartoesA += 1;
        
        const texto = NARRATIVAS_FALTA_CARTAO[Math.floor(Math.random() * NARRATIVAS_FALTA_CARTAO.length)]
          .replace("{autor}", `**${jogador.nome}**`);
          
        partida.eventos.push({ min, texto, tipo: "cartao", time: defensor.id });
      }
      return true;
    }
  } else {
    // LESÕES (Probabilidade aumenta se fadiga estiver alta)
    const todosJogadores = [...partida.home.poder.titulares, ...partida.away.poder.titulares];
    if (todosJogadores.length === 0) return false;
    
    const sorteado = todosJogadores[Math.floor(Math.random() * todosJogadores.length)];
    const jogador = jogadoresMap[sorteado.id];
    
    if (jogador) {
      // Chance de lesão aumenta se físico < 60%
      const chanceLesao = jogador.condicaoFisica < 60 ? 0.35 : 0.08;
      
      if (Math.random() < chanceLesao) {
        jogador.lesionado = true;
        jogador.tempoLesao = Math.floor(Math.random() * 4) + 1; // 1 a 4 rodadas fora
        jogador.condicaoFisica = Math.max(30, jogador.condicaoFisica - 15);
        
        const timeDono = partida.home.poder.titulares.some(p => p.id === jogador.id) ? partida.home : partida.away;
        
        // Remove jogador do jogo imediatamente
        timeDono.poder.titulares = timeDono.poder.titulares.filter(p => p.id !== jogador.id);
        
        partida.eventos.push({
          min,
          texto: `🚨 **${jogador.nome}** sofre lesão muscular grave e é retirado de maca!`,
          tipo: "vermelho",
          time: timeDono.id
        });
        return true;
      }
    }
  }
  
  return false;
}

// Simulação instantânea completa (CPU)
export function simularPartidaCompleta(homeTeam, awayTeam, jogadoresMap, posturaHome = "equilibrada", posturaAway = "equilibrada") {
  // CPUs não utilizam gritos por padrão (nenhum)
  const partida = iniciarPartida(homeTeam, awayTeam, jogadoresMap, posturaHome, posturaAway, "nenhum", "nenhum");
  
  for (let m = 1; m <= 90; m++) {
    simularMinutoPartida(partida, jogadoresMap);
  }
  
  partida.encerrada = true;
  
  return {
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    golsHome: partida.home.gols,
    golsAway: partida.away.gols,
    publico: partida.publico,
    renda: partida.renda,
    eventos: partida.eventos,
    golsJogadoresHome: partida.home.golsJogadores,
    golsJogadoresAway: partida.away.golsJogadores
  };
}
