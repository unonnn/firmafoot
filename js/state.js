import { inicializarBaseTimes, obterPosicaoSecundaria } from "./db.js";

// Salva e carrega o estado do jogo utilizando LocalStorage
const STORAGE_KEY = "brasfoot_game_save";

export function salvarJogo(estado) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    
    // Se o usuário estiver logado, realiza a sincronização na nuvem em background
    const token = getAuthToken();
    if (token) {
      salvarJogoNuvem(estado, token);
    }
    return true;
  } catch (e) {
    console.error("Erro ao salvar o jogo", e);
    return false;
  }
}

export function carregarJogo() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Erro ao carregar o jogo", e);
    return null;
  }
}

export function existeSave() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (e) {
    console.warn("Acesso ao localStorage indisponível ou bloqueado:", e);
    return false;
  }
}

export function deletarSave() {
  localStorage.removeItem(STORAGE_KEY);
}

// Algoritmo de Round-Robin (Algoritmo de Berger) para gerar tabela de jogos
// Gera 38 rodadas para 20 times (turno e returno)
export function gerarCalendario(times) {
  const n = times.length;
  const rodadasTurno = [];
  
  // Lista de índices dos times
  let indices = times.map((_, i) => i);
  
  for (let r = 0; r < n - 1; r++) {
    const rodada = [];
    for (let i = 0; i < n / 2; i++) {
      const home = indices[i];
      const away = indices[n - 1 - i];
      
      // Alternar mandante/visitante para equilibrar
      if (r % 2 === 0) {
        rodada.push({ home: times[home].id, away: times[away].id });
      } else {
        rodada.push({ home: times[away].id, away: times[home].id });
      }
    }
    rodadasTurno.push(rodada);
    
    // Rotacionar os índices (mantém o primeiro fixo)
    indices.splice(1, 0, indices.pop());
  }
  
  // Returno: mesmos confrontos com mandos invertidos
  const rodadasReturno = rodadasTurno.map(rodada => {
    return rodada.map(jogo => ({
      home: jogo.away,
      away: jogo.home
    }));
  });
  
  // Combina turno e returno
  const calendarioCompleto = [...rodadasTurno, ...rodadasReturno].map((rodada, index) => {
    return {
      numero: index + 1,
      concluida: false,
      jogos: rodada.map(j => ({
        homeTeamId: j.home,
        awayTeamId: j.away,
        jogou: false,
        golsHome: null,
        golsAway: null,
        eventos: [], // Detalhes dos gols/cartões
        publico: 0,
        renda: 0
      }))
    };
  });
  
  return calendarioCompleto;
}

// Inicializa a classificação inicial da liga
export function inicializarClassificacao(times) {
  const classificacao = {};
  times.forEach(t => {
    classificacao[t.id] = {
      timeId: t.id,
      nome: t.nome,
      pontos: 0,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsContra: 0,
      saldoGols: 0
    };
  });
  return classificacao;
}

// Atualiza a tabela com o resultado de uma partida
export function atualizarResultadoClassificacao(classificacao, homeId, awayId, golsHome, golsAway) {
  const home = classificacao[homeId];
  const away = classificacao[awayId];
  
  home.jogos += 1;
  away.jogos += 1;
  home.golsPro += golsHome;
  home.golsContra += golsAway;
  home.saldoGols = home.golsPro - home.golsContra;
  
  away.golsPro += golsAway;
  away.golsContra += golsHome;
  away.saldoGols = away.golsPro - away.golsContra;
  
  if (golsHome > golsAway) {
    home.pontos += 3;
    home.vitorias += 1;
    away.derrotas += 1;
  } else if (golsHome < golsAway) {
    away.pontos += 3;
    away.vitorias += 1;
    home.derrotas += 1;
  } else {
    home.pontos += 1;
    away.pontos += 1;
    home.empates += 1;
    away.empates += 1;
  }
}

// Retorna a tabela ordenada pelos critérios oficiais (Pontos, Vitórias, Saldo, Gols Pró, Nome)
export function obterClassificacaoOrdenada(classificacao) {
  return Object.values(classificacao).sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
    if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
    return a.nome.localeCompare(b.nome);
  });
}

export function obterDataFormatada(diaTemporada, ano) {
  const dataBase = new Date(ano, 0, 1); // 1 de Jan de 2026
  dataBase.setDate(dataBase.getDate() + (diaTemporada - 1));
  
  const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const diaSemana = diasSemana[dataBase.getDay()];
  const diaMes = dataBase.getDate();
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const mes = meses[dataBase.getMonth()];
  
  return `${diaSemana}, ${diaMes} de ${mes} de ${dataBase.getFullYear()}`;
}

// Inicializa um novo jogo (Save) do zero
export function inicializarNovoJogo(timeUsuarioId) {
  const times = inicializarBaseTimes();
  const calendario = gerarCalendario(times);
  const classificacao = inicializarClassificacao(times);
  
  const novoEstado = {
    ano: 2026,
    rodadaAtual: 1, // Rodadas de 1 a 38
    diaTemporada: 1, // Dia 1 ao 266 (38 semanas x 7 dias)
    timeUsuarioId: timeUsuarioId,
    times: times,
    calendario: calendario,
    classificacao: classificacao,
    artilheiros: [], // Top 10 goleadores
    historicoCampeoes: [], // Campeões de cada ano
    financasHistorico: [{ rodada: 0, saldo: times.find(t => t.id === timeUsuarioId).saldo }],
    mercadoTransferencias: gerarMercadoInicial(times)
  };
  
  salvarJogo(novoEstado);
  return novoEstado;
}

// Gera uma lista inicial de jogadores disponíveis para compra livre
function gerarMercadoInicial(times) {
  // Vamos colocar alguns jogadores livres
  const posicoes = ["GOL", "DEF", "MEI", "ATA"];
  const nomesLivres = [
    "Alexandre Pato", "Diego Costa", "David Luiz", "Roberto Firmino", "Philippe Coutinho",
    "Douglas Costa", "Oscar", "Ramires", "Paulinho", "Jonas", "Fernandinho"
  ];
  
  const mercado = [];
  
  nomesLivres.forEach((nome, idx) => {
    const pos = posicoes[idx % posicoes.length];
    const forca = Math.floor(Math.random() * (78 - 65 + 1)) + 65;
    const idade = Math.floor(Math.random() * (35 - 30 + 1)) + 30; // Jogadores livres tendem a ser veteranos
    
    // Valores menores por estarem sem clube
    const valor = Math.round(Math.pow(forca, 3.5) * 6);
    const salario = Math.round(Math.pow(forca, 2.8) * 0.4);
    
    mercado.push({
      id: `free_p_${idx}`,
      nome: nome,
      idade: idade,
      posicao: pos,
      posicaoSecundaria: obterPosicaoSecundaria(pos),
      forca: forca,
      caracteristica: "Experiência",
      valor: valor,
      salario: salario,
      condicaoFisica: 100,
      cartoesAmarelos: 0,
      cartaoVermelho: false,
      gols: 0,
      assistencias: 0,
      lesionado: false,
      tempoLesao: 0,
      timeId: "free" // Sem clube
    });
  });
  
  return mercado;
}

export function getAuthToken() {
  return localStorage.getItem("firmafoot_auth_token");
}

export function getAuthUsername() {
  return localStorage.getItem("firmafoot_auth_username");
}

export function setAuthSession(username, token) {
  localStorage.setItem("firmafoot_auth_token", token);
  localStorage.setItem("firmafoot_auth_username", username);
}

export function clearAuthSession() {
  localStorage.removeItem("firmafoot_auth_token");
  localStorage.removeItem("firmafoot_auth_username");
}

async function salvarJogoNuvem(estado, token) {
  try {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(estado)
    });
    if (!res.ok) {
      console.warn("Falha no salvamento em nuvem:", await res.json());
    }
  } catch (err) {
    console.error("Erro de conexão para salvar na nuvem:", err);
  }
}

export async function carregarJogoNuvem() {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const res = await fetch("/api/save", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (res.ok) {
      const estado = await res.json();
      return estado;
    }
  } catch (err) {
    console.error("Erro de conexão ao carregar da nuvem:", err);
  }
  return null;
}
