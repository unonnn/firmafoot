import { TIMES_BASE, inicializarBaseTimes, obterPosicaoSecundaria, mapearPosicaoGenericaParaEspecifica } from "./db.js";
import { 
  carregarJogo, 
  salvarJogo, 
  existeSave, 
  inicializarNovoJogo,
  atualizarResultadoClassificacao,
  obterDataFormatada,
  getAuthToken,
  getAuthUsername,
  setAuthSession,
  clearAuthSession,
  carregarJogoNuvem
} from "./state.js";
import { iniciarPartida, simularMinutoPartida, simularPartidaCompleta } from "./engine.js";
import { formatarDinheiro, formatarDinheiroCompleto } from "./utils.js";

// Importar Componentes de Tela
import { renderInbox } from "./components/inbox.js";
import { renderDashboard } from "./components/dashboard.js";
import { renderTactics } from "./components/tactics.js";
import { renderClassification } from "./components/classification.js";
import { renderMarket } from "./components/market.js";
import { renderFinances } from "./components/finances.js";

// Estado de runtime
let estadoAtual = null;
let abaAtiva = "inbox"; // Caixa de entrada ativa por padrão
let loopPartida = null;
let partidaAtiva = null;
let velocidadeSimulacao = 80;
let simulacaoEmAndamento = false;

// Elementos DOM
const telaInicial = document.getElementById("tela-inicial");
const jogoContainer = document.getElementById("jogo-container");
const gridTimesInicial = document.getElementById("grid-times-inicial");
const btnCarregarJogo = document.getElementById("btn-carregar-jogo");

const infoAno = document.getElementById("info-ano");
const infoDataAtual = document.getElementById("info-data-atual");
const infoCalendarioStatus = document.getElementById("info-calendario-status");
const infoRodadaLabel = document.getElementById("info-rodada-label");

const userClubColor = document.getElementById("user-club-color");
const userClubName = document.getElementById("user-club-name");
const userClubBalance = document.getElementById("user-club-balance");

const fixtureHomeName = document.getElementById("fixture-home-name");
const fixtureAwayName = document.getElementById("fixture-away-name");
const btnJogarRodada = document.getElementById("btn-jogar-rodada");
const btnSimularDia = document.getElementById("btn-simular-dia");

const conteudoTela = document.getElementById("conteudo-tela");

// Inicialização da Aplicação
// Inicialização da Aplicação
function inicializarApp() {
  const authBox = document.getElementById("auth-box");
  const loggedSetupArea = document.getElementById("logged-setup-area");
  const userDisplayName = document.getElementById("user-display-name");
  const btnAuthLogoutSetup = document.getElementById("btn-auth-logout-setup");
  const btnAuthLogoutHeader = document.getElementById("btn-auth-logout-header");
  const btnMockGoogle = document.getElementById("btn-mock-google");

  // Handler de login autenticado
  const processarLoginSucesso = async (username, token, displayName) => {
    setAuthSession(username, token);
    localStorage.setItem("firmafoot_auth_displayname", displayName);
    
    // Tenta carregar o save do usuário na nuvem
    const saveObj = await carregarJogoNuvem();
    if (saveObj) {
      alert(`Bem-vindo, ${displayName}!\nSua carreira foi sincronizada e carregada da nuvem.`);
      iniciarJogoComEstado(saveObj);
    } else {
      // Se não houver save, exibe o painel de seleção de times
      if (authBox) authBox.classList.add("hidden");
      if (loggedSetupArea) loggedSetupArea.classList.remove("hidden");
      if (userDisplayName) userDisplayName.innerText = displayName;
      desenharEscolhaTimes();
    }
  };

  // Callback Global exigido pelo SDK do Google
  window.handleGoogleSignIn = async (response) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await processarLoginSucesso(data.username, data.token, data.displayName);
      } else {
        alert("Falha ao autenticar com o Google: " + (data.error || "Erro desconhecido."));
      }
    } catch (err) {
      alert("Erro de conexão ao autenticar com o Google.");
    }
  };

  // Bypass para desenvolvimento / testes
  if (btnMockGoogle) {
    btnMockGoogle.addEventListener("click", async (e) => {
      e.preventDefault();
      const mockUsername = prompt("Digite seu nome ou e-mail de teste:", "treinador_teste@firmafoot.com");
      if (!mockUsername) return;
      const mockDisplayName = mockUsername.split("@")[0];

      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            credential: "mock_token", 
            mockUsername: mockUsername, 
            mockDisplayName: mockDisplayName 
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          await processarLoginSucesso(data.username, data.token, data.displayName);
        }
      } catch (err) {
        alert("Erro ao simular login de desenvolvimento.");
      }
    });
  }

  // Ação de Sair
  const lidarLogout = () => {
    clearAuthSession();
    localStorage.removeItem("firmafoot_auth_displayname");
    
    // Esconde o container do jogo e mostra tela inicial
    document.getElementById("jogo-container").classList.add("hidden");
    document.getElementById("tela-inicial").classList.add("screen");
    document.getElementById("tela-inicial").classList.add("active");
    
    if (authBox) authBox.classList.remove("hidden");
    if (loggedSetupArea) loggedSetupArea.classList.add("hidden");
    
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
    alert("Desconectado com sucesso.");
  };

  if (btnAuthLogoutSetup) {
    btnAuthLogoutSetup.addEventListener("click", lidarLogout);
  }
  if (btnAuthLogoutHeader) {
    btnAuthLogoutHeader.addEventListener("click", (e) => {
      e.preventDefault();
      lidarLogout();
    });
  }

  // Verifica na inicialização se já está logado
  const token = getAuthToken();
  const username = getAuthUsername();
  const displayName = localStorage.getItem("firmafoot_auth_displayname") || username;

  if (token && username) {
    processarLoginSucesso(username, token, displayName);
  } else {
    if (authBox) authBox.classList.remove("hidden");
    if (loggedSetupArea) loggedSetupArea.classList.add("hidden");
  }

  // Permite fechar qualquer janela (modal) clicando fora do conteúdo (no backdrop escuro)
  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        // Bloqueia fechar a partida em andamento para não quebrar a simulação
        if (modal.id === "modal-partida") return;
        
        modal.classList.remove("active");
      }
    });
  });

  configurarNavegacao();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", inicializarApp);
} else {
  inicializarApp();
}

// Render da lista de seleção de times
function desenharEscolhaTimes() {
  gridTimesInicial.innerHTML = "";
  
  TIMES_BASE.forEach(t => {
    const card = document.createElement("div");
    card.className = "team-card-select";
    card.style.setProperty("--team-color", t.corPrimaria);
    
    card.innerHTML = `
      <div class="team-name-select">${t.nome}</div>
      <div class="team-rep-select">${"★".repeat(t.rep)}</div>
      <div class="team-finance-select">${formatarDinheiro(t.saldo)}</div>
    `;
    
    card.addEventListener("click", () => {
      const conf = confirm(`Deseja iniciar sua carreira no ${t.nome}?`);
      if (conf) {
        const novoEstado = inicializarNovoJogo(t.id);
        iniciarJogoComEstado(novoEstado);
      }
    });
    
    gridTimesInicial.appendChild(card);
  });
}

// Configura a mudança de abas
function configurarNavegacao() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      if (simulacaoEmAndamento) return; // Bloqueia navegação durante avanço de dias
      
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      
      const target = e.target.getAttribute("data-target");
      abaAtiva = target;
      renderizarTelaAtiva();
    });
  });
}

// Redireciona e prepara a interface logada
function iniciarJogoComEstado(estado) {
  estadoAtual = estado;
  
  // Garante a existência do diaTemporada
  if (estadoAtual.diaTemporada === undefined) {
    estadoAtual.diaTemporada = 1;
  }

  // Migração: Garante que jogadores existentes tenham posições específicas e secundárias
  if (estadoAtual.times) {
    estadoAtual.times.forEach(t => {
      t.jogadores.forEach(j => {
        if (j.posicao === "DEF" || j.posicao === "MEI" || j.posicao === "ATA") {
          j.posicao = mapearPosicaoGenericaParaEspecifica(j.nome, j.posicao);
        }
        if (j.posicaoSecundaria === undefined || j.posicaoSecundaria === null) {
          j.posicaoSecundaria = obterPosicaoSecundaria(j.posicao);
        }
      });
    });
  }

  if (estadoAtual.mercadoTransferencias) {
    estadoAtual.mercadoTransferencias.forEach(j => {
      if (j.posicao === "DEF" || j.posicao === "MEI" || j.posicao === "ATA") {
        j.posicao = mapearPosicaoGenericaParaEspecifica(j.nome, j.posicao);
      }
      if (j.posicaoSecundaria === undefined || j.posicaoSecundaria === null) {
        j.posicaoSecundaria = obterPosicaoSecundaria(j.posicao);
      }
    });
  }
  
  telaInicial.classList.remove("active");
  telaInicial.classList.add("hidden");
  jogoContainer.classList.remove("hidden");
  
  // Atualiza cabeçalho fixo
  atualizarCabecalho();
  
  // Renderiza a aba atual (inbox por padrão)
  renderizarTelaAtiva();
}

// Renderizador centralizado de abas
function renderizarTelaAtiva() {
  conteudoTela.innerHTML = "";
  
  if (estadoAtual.demitido === true) {
    renderFiredScreen(conteudoTela);
    return;
  }
  
  switch(abaAtiva) {
    case "inbox":
      renderInbox(estadoAtual, conteudoTela, lidarAcaoInbox);
      break;
    case "dashboard":
      renderDashboard(estadoAtual, conteudoTela);
      break;
    case "tactics":
      renderTactics(estadoAtual, conteudoTela);
      break;
    case "classification":
      renderClassification(estadoAtual, conteudoTela);
      break;
    case "market":
      renderMarket(estadoAtual, conteudoTela);
      break;
    case "finances":
      renderFinances(estadoAtual, conteudoTela);
      break;
  }
  
  atualizarBadgeInboxNaoLidas();
}

// Dispara ações que vêm do botão de e-mails da Inbox (FM Style)
function lidarAcaoInbox(tipoAcao, dadosExtra, callbackSucesso) {
  if (tipoAcao === "patrocinio") {
    const cb = typeof dadosExtra === "function" ? dadosExtra : callbackSucesso;
    verificarContratosComerciais(cb);
  } else if (tipoAcao === "venda_aceitar") {
    const userTeam = estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId);
    const jogador = userTeam.jogadores.find(p => p.id === dadosExtra.jogadorId);
    const comprador = estadoAtual.times.find(t => t.id === dadosExtra.compradorId);
    
    if (jogador && comprador) {
      if (userTeam.jogadores.length <= 15) {
        alert("Operação bloqueada! Seu elenco deve possuir pelo menos 15 jogadores.");
        if (callbackSucesso) callbackSucesso();
        return;
      }
      
      userTeam.saldo += dadosExtra.valorProposta;
      comprador.saldo -= dadosExtra.valorProposta;
      
      userTeam.jogadores = userTeam.jogadores.filter(p => p.id !== jogador.id);
      userTeam.escalacao.titulares = userTeam.escalacao.titulares.filter(id => id !== jogador.id);
      userTeam.escalacao.reservas = userTeam.escalacao.reservas.filter(id => id !== jogador.id);
      
      jogador.timeId = comprador.id;
      jogador.listaTransferencia = false;
      jogador.emprestado = false;
      comprador.jogadores.push(jogador);
      
      alert(`🏆 VENDA CONCLUÍDA!\n\n${jogador.nome} foi vendido ao ${comprador.nome} por ${formatarDinheiro(dadosExtra.valorProposta)}!`);
      document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
    }
    
    salvarJogo(estadoAtual);
    if (callbackSucesso) callbackSucesso();
  } else if (tipoAcao === "venda_recusar") {
    alert("Proposta recusada oficialmente.");
    if (callbackSucesso) callbackSucesso();
  } else if (tipoAcao === "emprego_aceitar") {
    const novoTime = estadoAtual.times.find(t => t.id === dadosExtra.timeId);
    const timeAntigo = estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId);
    
    if (novoTime && timeAntigo) {
      estadoAtual.timeUsuarioId = novoTime.id;
      estadoAtual.confiancaDiretoria = 75;
      
      if (!estadoAtual.mensagens) estadoAtual.mensagens = [];
      estadoAtual.mensagens.push({
        id: `msg_boas_vindas_${novoTime.id}_${Date.now()}`,
        remetente: "Presidente do Clube",
        assunto: `Bem-vindo ao ${novoTime.nome}!`,
        conteudo: `Prezado técnico,
        
É com imensa satisfação que damos as boas-vindas à nossa comissão técnica. Acreditamos no seu potencial para guiar o ${novoTime.nome} aos nossos objetivos na temporada.

Atenciosamente,
Diretoria Executiva do ${novoTime.nome}.`,
        lida: false,
        obrigatoria: false,
        data: `Rodada ${estadoAtual.rodadaAtual}`,
        tipoAcao: null,
        acaoConcluida: true
      });
      
      alert(`💼 MUDANÇA DE TIME!\n\nVocê agora é o novo técnico do ${novoTime.nome}!`);
      
      document.getElementById("user-club-name").innerText = novoTime.nome;
      document.getElementById("user-club-color").style.backgroundColor = novoTime.corPrimaria;
      document.getElementById("user-club-balance").innerText = formatarDinheiro(novoTime.saldo);
      document.getElementById("user-board-confidence").innerText = `Diretoria: 75%`;
      document.getElementById("user-board-confidence").style.color = "var(--success-color)";
    }
    
    salvarJogo(estadoAtual);
    if (callbackSucesso) callbackSucesso();
    
    abaAtiva = "inbox";
    atualizarCabecalho();
    renderizarTelaAtiva();
  } else if (tipoAcao === "emprego_recusar") {
    alert("Você recusou o convite profissional.");
    if (callbackSucesso) callbackSucesso();
  }
}

// Gera propostas comerciais aleatórias para o clube com base em reputação
function gerarPropostasPatrocinio(rep) {
  let kitMarcasDisponiveis = [];
  let fixoMin, fixoMax, royMin, royMax;
  let tierName = "";
  
  if (rep >= 75) {
    tierName = "Tier 1 (Elite)";
    kitMarcasDisponiveis = ["Nike", "Adidas", "Puma"];
    fixoMin = 1100000;
    fixoMax = 1500000;
    royMin = 0.18;
    royMax = 0.25;
  } else if (rep >= 45) {
    tierName = "Tier 2 (Pro)";
    kitMarcasDisponiveis = ["Umbro", "Kappa", "Reebok", "Fila", "New Balance"];
    fixoMin = 700000;
    fixoMax = 1000000;
    royMin = 0.12;
    royMax = 0.17;
  } else {
    tierName = "Tier 3 (Desenvolvimento)";
    kitMarcasDisponiveis = ["Volt", "Penalty", "Topper", "Lupo Sport", "Kanxa", "Super Bolla"];
    fixoMin = 350000;
    fixoMax = 550000;
    royMin = 0.08;
    royMax = 0.11;
  }

  const kitPropostas = [];
  const marcasEmbaralhadas = [...kitMarcasDisponiveis].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < Math.min(3, marcasEmbaralhadas.length); i++) {
    const nome = marcasEmbaralhadas[i];
    const fixo = Math.round(rep * (fixoMin + Math.random() * (fixoMax - fixoMin)));
    const royalties = Number((royMin + Math.random() * (royMax - royMin)).toFixed(2));
    
    kitPropostas.push({
      nome,
      fixo,
      royalties,
      tier: tierName,
      desc: `[${tierName}] A ${nome} oferece R$ ${formatarDinheiro(fixo)} fixo anual + ${Math.round(royalties*100)}% de royalties em vendas de camisas oficiais.`
    });
  }

  const masterMarcas = ["Betano", "Nubank", "Pixbet", "Crefisa", "BMG", "Caixa", "Banco Inter", "EstrelaBet", "Superbet"];
  const masterPropostas = [];
  
  const marcasMasterEscolhidas = [];
  while (marcasMasterEscolhidas.length < 3) {
    const nome = masterMarcas[Math.floor(Math.random() * masterMarcas.length)];
    if (!marcasMasterEscolhidas.includes(nome)) {
      marcasMasterEscolhidas.push(nome);
    }
  }

  for (let i = 0; i < 3; i++) {
    const nome = marcasMasterEscolhidas[i];
    const camisaLimpa = (i === 0);
    
    let fixo, bonusVitoria;
    if (camisaLimpa) {
      fixo = Math.round(rep * (1000000 + Math.random() * 900000));
      bonusVitoria = Math.round(30000 + Math.random() * 60000);
    } else {
      fixo = Math.round(rep * (1800000 + Math.random() * 1500000));
      bonusVitoria = Math.round(60000 + Math.random() * 120000);
    }

    masterPropostas.push({
      nome,
      fixo,
      bonusVitoria,
      camisaLimpa,
      desc: camisaLimpa 
        ? `A ${nome} oferece patrocínio com 'Camisa Limpa' (Sem logo frontal. A torcida adora, mantendo 100% das vendas de camisas e público cheio!).` 
        : `A ${nome} exige estampa de logo principal (Reduz em 25% as vendas de camisas oficiais e afasta 5% do público).`
    });
  }

  const sleevesMarcas = ["TIM", "Gatorade", "Rexona", "Havan", "Sil", "Claro", "Jeep"];
  const sleevesPropostas = [];
  while (sleevesPropostas.length < 3) {
    const nome = sleevesMarcas[Math.floor(Math.random() * sleevesMarcas.length)];
    if (sleevesPropostas.some(p => p.nome === nome)) continue;
    const fixo = Math.round(rep * (250000 + Math.random() * 250000));
    const bonusBalizaZero = Math.round(15000 + Math.random() * 25000);
    sleevesPropostas.push({
      nome,
      fixo,
      bonusBalizaZero,
      desc: `Patrocínio nas Mangas. R$ ${formatarDinheiro(fixo)} fixo + R$ ${formatarDinheiro(bonusBalizaZero)} por partida sem sofrer gols.`
    });
  }

  const backMarcas = ["Poty", "Zoom", "Prevent Senior", "Champion Watch", "Cartola FC", "Brahma", "Mercado Livre"];
  const backPropostas = [];
  while (backPropostas.length < 3) {
    const nome = backMarcas[Math.floor(Math.random() * backMarcas.length)];
    if (backPropostas.some(p => p.nome === nome)) continue;
    const fixo = Math.round(rep * (300000 + Math.random() * 300000));
    const bonusGols3 = Math.round(20000 + Math.random() * 30000);
    backPropostas.push({
      nome,
      fixo,
      bonusGols3,
      desc: `Patrocínio nas Costas. R$ ${formatarDinheiro(fixo)} fixo + R$ ${formatarDinheiro(bonusGols3)} bônus se o time fizer 3+ gols.`
    });
  }

  const shortsMarcas = ["Kodilar", "Uniasselvi", "ABC da Construção", "Joli", "Philco", "Spoleto"];
  const shortsPropostas = [];
  while (shortsPropostas.length < 3) {
    const nome = shortsMarcas[Math.floor(Math.random() * shortsMarcas.length)];
    if (shortsPropostas.some(p => p.nome === nome)) continue;
    const fixo = Math.round(rep * (150000 + Math.random() * 200000));
    const bonusVit = Math.round(10000 + Math.random() * 15000);
    shortsPropostas.push({
      nome,
      fixo,
      bonusVit,
      desc: `Patrocínio no Calção. R$ ${formatarDinheiro(fixo)} fixo + R$ ${formatarDinheiro(bonusVit)} por vitória.`
    });
  }

  return {
    kit: kitPropostas,
    master: masterPropostas,
    sleeves: sleevesPropostas,
    back: backPropostas,
    shorts: shortsPropostas
  };
}

// Abre o modal e gerencia a lógica comercial (Material Esportivo + Master + Secundários)
function verificarContratosComerciais(callbackSucesso) {
  const userTeam = estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId);
  
  if (!estadoAtual.propostasPatrocinio) {
    estadoAtual.propostasPatrocinio = gerarPropostasPatrocinio(userTeam.rep);
    salvarJogo(estadoAtual);
  }
  
  const kitPropostas = estadoAtual.propostasPatrocinio.kit;
  const masterPropostas = estadoAtual.propostasPatrocinio.master;
  const sleevesPropostas = estadoAtual.propostasPatrocinio.sleeves;
  const backPropostas = estadoAtual.propostasPatrocinio.back;
  const shortsPropostas = estadoAtual.propostasPatrocinio.shorts;

  let kitSelecionado = null;
  let masterSelecionado = null;
  let sleevesSelecionado = null;
  let backSelecionado = null;
  let shortsSelecionado = null;

  const kitContainer = document.getElementById("kit-options-container");
  const masterContainer = document.getElementById("master-options-container");
  const sleevesContainer = document.getElementById("sleeves-options-container");
  const backContainer = document.getElementById("back-options-container");
  const shortsContainer = document.getElementById("shorts-options-container");
  const btnAssinar = document.getElementById("btn-confirmar-patrocinios");

  kitContainer.innerHTML = "";
  masterContainer.innerHTML = "";
  sleevesContainer.innerHTML = "";
  backContainer.innerHTML = "";
  shortsContainer.innerHTML = "";
  btnAssinar.disabled = true;

  const setupSelectionGroup = (container, propostas, onSelect, isMaster = false) => {
    propostas.forEach((prop) => {
      const box = document.createElement("div");
      box.style.cssText = "background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); padding: 12px; border-radius: 10px; cursor: pointer; transition: var(--transition-smooth); margin-bottom: 8px;";
      
      let bonusText = "";
      let extraMasterRow = "";
      if (prop.royalties !== undefined) {
        bonusText = `+ ${formatarDinheiro(prop.fixo)} fixo | ${Math.round(prop.royalties*100)}% Roy`;
      } else if (isMaster) {
        bonusText = `+ ${formatarDinheiro(prop.fixo)} / temp`;
        extraMasterRow = `
          <div style="display: flex; justify-content: space-between; font-size: 0.76rem; margin-top: 4px; margin-bottom: 4px;">
            <span style="color: ${prop.camisaLimpa ? "var(--success-color)" : "var(--danger-color)"}; font-weight: 600;">
              ${prop.camisaLimpa ? "✨ Camisa Limpa (Vendas 100%)" : "⚠️ Exige Logo (Vendas -25% e Público -5%)"}
            </span>
            <span style="color: var(--success-color); font-weight: 600;">Vitória: +${formatarDinheiro(prop.bonusVitoria)}</span>
          </div>
        `;
      } else {
        bonusText = `+ ${formatarDinheiro(prop.fixo)} / temp`;
      }

      box.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #fff; font-size: 0.95rem;">${prop.nome}</strong>
          <span style="color: var(--success-color); font-weight: 700; font-size: 0.8rem;">${bonusText}</span>
        </div>
        ${extraMasterRow}
        <p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px; line-height:1.3; margin-bottom:0;">${prop.desc}</p>
      `;

      box.addEventListener("click", () => {
        container.querySelectorAll("div").forEach(el => {
          el.style.borderColor = "var(--glass-border)";
          el.style.background = "rgba(255,255,255,0.02)";
        });
        box.style.borderColor = "var(--accent-color)";
        box.style.background = "rgba(0, 240, 255, 0.03)";
        onSelect(prop);
      });
      container.appendChild(box);
    });
  };

  setupSelectionGroup(kitContainer, kitPropostas, (sel) => { kitSelecionado = sel; verificarHabilitacaoBotao(); }, false);
  setupSelectionGroup(masterContainer, masterPropostas, (sel) => { masterSelecionado = sel; verificarHabilitacaoBotao(); }, true);
  setupSelectionGroup(sleevesContainer, sleevesPropostas, (sel) => { sleevesSelecionado = sel; verificarHabilitacaoBotao(); }, false);
  setupSelectionGroup(backContainer, backPropostas, (sel) => { backSelecionado = sel; verificarHabilitacaoBotao(); }, false);
  setupSelectionGroup(shortsContainer, shortsPropostas, (sel) => { shortsSelecionado = sel; verificarHabilitacaoBotao(); }, false);

  const novoBtn = btnAssinar.cloneNode(true);
  btnAssinar.parentNode.replaceChild(novoBtn, btnAssinar);

  function verificarHabilitacaoBotao() {
    if (kitSelecionado && masterSelecionado && sleevesSelecionado && backSelecionado && shortsSelecionado) {
      novoBtn.disabled = false;
    }
  }

  novoBtn.addEventListener("click", () => {
    if (!kitSelecionado || !masterSelecionado || !sleevesSelecionado || !backSelecionado || !shortsSelecionado) return;
    
    userTeam.patrocinioMaterial = kitSelecionado;
    userTeam.patrocinioMaster = masterSelecionado;
    userTeam.patrociniosSecundarios = {
      sleeves: sleevesSelecionado,
      back: backSelecionado,
      shorts: shortsSelecionado
    };
    userTeam.ultimaReceitaCamisas = 0;
    
    userTeam.saldo += kitSelecionado.fixo;
    userTeam.saldo += masterSelecionado.fixo;
    userTeam.saldo += sleevesSelecionado.fixo;
    userTeam.saldo += backSelecionado.fixo;
    userTeam.saldo += shortsSelecionado.fixo;
    
    estadoAtual.propostasPatrocinio = null;

    salvarJogo(estadoAtual);
    document.getElementById("modal-patrocinio").classList.remove("active");
    
    alert(`🤝 TODOS OS CONTRATOS COMERCIAIS ASSINADOS!\n\nReceitas de Assinatura Recebidas:\n` +
          `• Material (${kitSelecionado.nome}): +${formatarDinheiro(kitSelecionado.fixo)}\n` +
          `• Master (${masterSelecionado.nome}): +${formatarDinheiro(masterSelecionado.fixo)}\n` +
          `• Mangas (${sleevesSelecionado.nome}): +${formatarDinheiro(sleevesSelecionado.fixo)}\n` +
          `• Costas (${backSelecionado.nome}): +${formatarDinheiro(backSelecionado.fixo)}\n` +
          `• Calção (${shortsSelecionado.nome}): +${formatarDinheiro(shortsSelecionado.fixo)}`);

    document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);

    if (callbackSucesso) {
      callbackSucesso();
    }
    
    atualizarCabecalho();
    renderizarTelaAtiva();
  });

  document.getElementById("modal-patrocinio").classList.add("active");
}

// Atualiza o contador de mensagens não lidas/pendentes de ação
function atualizarBadgeInboxNaoLidas() {
  if (!estadoAtual || !estadoAtual.mensagens) return;
  const pendentesCount = estadoAtual.mensagens.filter(m => m.obrigatoria && !m.acaoConcluida).length;
  const badge = document.getElementById("inbox-badge");
  if (badge) {
    if (pendentesCount > 0) {
      badge.innerText = pendentesCount;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
}

// Lógica de simulação diária dia-a-dia estilo FIFA/FM
function iniciarSimulacaoDias() {
  if (simulacaoEmAndamento) return;
  simulacaoEmAndamento = true;

  // Desativa navegações e botão de avanço
  document.querySelectorAll(".nav-btn").forEach(btn => btn.setAttribute("disabled", "true"));
  btnSimularDia.disabled = true;
  btnSimularDia.innerText = "AVANÇANDO...";

  const rodarPasso = () => {
    // Se hoje for domingo (Dia de Jogo / diaTemporada % 7 === 0), encerra a simulação diária
    const diaSemana = estadoAtual.diaTemporada % 7;
    
    if (diaSemana === 0) {
      simulacaoEmAndamento = false;
      document.querySelectorAll(".nav-btn").forEach(btn => btn.removeAttribute("disabled"));
      btnSimularDia.disabled = false;
      btnSimularDia.innerText = "AVANÇAR DIA";
      
      atualizarCabecalho();
      renderizarTelaAtiva();
      return;
    }

    // Executa as atividades e treinos do dia correspondente
    processarAtividadesDia();

    // Incrementa dia da temporada
    estadoAtual.diaTemporada += 1;
    salvarJogo(estadoAtual);

    // Checa se há pendências obrigatórias geradas por e-mails hoje
    const temPendencias = estadoAtual.mensagens && estadoAtual.mensagens.some(
      m => m.obrigatoria && !m.acaoConcluida
    );

    if (temPendencias) {
      simulacaoEmAndamento = false;
      document.querySelectorAll(".nav-btn").forEach(btn => btn.removeAttribute("disabled"));
      btnSimularDia.disabled = false;
      btnSimularDia.innerText = "AVANÇAR DIA";
      
      alert("⚠️ A simulação foi interrompida! Você tem um e-mail pendente na Caixa de Entrada.");
      abaAtiva = "inbox";
      
      atualizarCabecalho();
      renderizarTelaAtiva();
      configurarNavegacaoAtiva("inbox");
      return;
    }

    atualizarCabecalho();
    
    // Atualiza a tela ao vivo se o usuário estiver nas abas dinâmicas
    if (abaAtiva === "tactics" || abaAtiva === "inbox" || abaAtiva === "dashboard") {
      renderizarTelaAtiva();
    }

    setTimeout(rodarPasso, 450);
  };

  rodarPasso();
}

// Simula treinos e dinâmicas físicas/táticas em dias de semana
function processarAtividadesDia() {
  const userTeam = estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId);
  const diaSemana = estadoAtual.diaTemporada % 7; // 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado
  
  if (!userTeam.historicoTreino) userTeam.historicoTreino = [];
  if (!userTeam.focoTreino) userTeam.focoTreino = "tecnico";
  
  const isTreinoDay = [2, 4, 5].includes(diaSemana); // Terças, Quintas e Sextas são dias de treino
  
  if (isTreinoDay) {
    const foco = userTeam.focoTreino;
    let logMsg = "";
    
    if (foco === "fisico") {
      userTeam.jogadores.forEach(j => {
        j.condicaoFisica = Math.min(100, (j.condicaoFisica || 100) + 3);
      });
      logMsg = `Dia ${estadoAtual.diaTemporada}: Treino Físico concluído. Recuperação geral de estamina (+3% para todos).`;
      infoCalendarioStatus.innerText = "Treino Físico Concluído 🏃";
    } 
    else if (foco === "descanso") {
      userTeam.jogadores.forEach(j => {
        j.condicaoFisica = Math.min(100, (j.condicaoFisica || 100) + 5);
        j.moral = Math.min(100, (j.moral || 75) + 4);
      });
      logMsg = `Dia ${estadoAtual.diaTemporada}: Folga geral concedida. Elenco relaxou (+5% física, +4 moral).`;
      infoCalendarioStatus.innerText = "Folga e Gestão de Elenco 🧘";
    }
    else if (foco === "tatico") {
      // Acumula bônus de organização tática defensiva (+1.5% ao dia, até +4.5% na semana)
      userTeam.bonusTatico = (userTeam.bonusTatico || 0) + 1.5;
      logMsg = `Dia ${estadoAtual.diaTemporada}: Treino Tático refinado (+1.5% de bônus defensivo para o próximo jogo).`;
      infoCalendarioStatus.innerText = "Treino Tático Concluído 🧠";
    }
    else {
      // Técnico: evolução de promessas de base (< 23 anos)
      const jovens = userTeam.jogadores.filter(j => j.idade < 23 && j.forca < 99 && !j.lesionado);
      let evolucoes = [];
      
      jovens.forEach(j => {
        if (Math.random() < 0.20) {
          j.forca += 1;
          evolucoes.push(`${j.nome.split(" ")[0]} (+1 Força)`);
        }
      });
      
      if (evolucoes.length > 0) {
        logMsg = `Dia ${estadoAtual.diaTemporada}: Treino Técnico concluído. Evoluções de força: ${evolucoes.join(", ")}.`;
      } else {
        logMsg = `Dia ${estadoAtual.diaTemporada}: Treino Técnico concluído. Elenco praticou passes e chutes. Sem melhorias individuais hoje.`;
      }
      infoCalendarioStatus.innerText = "Treino Técnico de Fundamentos ⚽";
    }
    
    userTeam.historicoTreino.unshift(logMsg);
    if (userTeam.historicoTreino.length > 10) {
      userTeam.historicoTreino.pop();
    }
  } else {
    // Dias normais sem treino (Segunda, Quarta, Sábado)
    if (diaSemana === 1) infoCalendarioStatus.innerText = "Reunião administrativa e planejamento 📋";
    else if (diaSemana === 3) infoCalendarioStatus.innerText = "Análise de vídeo e coletivo tático leve 📹";
    else if (diaSemana === 6) infoCalendarioStatus.innerText = "Concentração da equipe para o jogo 🏨";
    
    // Recuperação natural leve de estamina
    userTeam.jogadores.forEach(j => {
      j.condicaoFisica = Math.min(100, (j.condicaoFisica || 100) + 2);
    });
  }

  // CPUs também se recuperam moderadamente nos dias livres
  estadoAtual.times.forEach(t => {
    if (t.id === estadoAtual.timeUsuarioId) return;
    
    t.jogadores.forEach(j => {
      j.condicaoFisica = Math.min(100, (j.condicaoFisica || 100) + 3);
      if (Math.random() < 0.05) {
        j.moral = Math.min(100, (j.moral || 75) + 1);
      }
    });
  });
}

// Atualiza informações do header e calendar bar
function atualizarCabecalho() {
  const userTeam = estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId);
  
  infoAno.innerText = estadoAtual.ano;
  
  // Atualiza data atualizada do calendário diário
  infoDataAtual.innerText = obterDataFormatada(estadoAtual.diaTemporada, estadoAtual.ano);
  
  if (estadoAtual.rodadaAtual <= 38) {
    infoRodadaLabel.innerText = `PRÓXIMA PARTIDA (Rodada ${estadoAtual.rodadaAtual} de 38)`;
  } else {
    infoRodadaLabel.innerText = `Temporada Concluída!`;
  }
  
  userClubColor.style.backgroundColor = userTeam.corPrimaria;
  userClubName.innerText = userTeam.nome;
  userClubBalance.innerText = formatarDinheiro(userTeam.saldo);
  
  if (estadoAtual.confiancaDiretoria === undefined) {
    estadoAtual.confiancaDiretoria = 70;
  }
  
  const confText = document.getElementById("user-board-confidence");
  if (confText) {
    confText.innerText = `Diretoria: ${estadoAtual.confiancaDiretoria}%`;
    if (estadoAtual.confiancaDiretoria >= 75) {
      confText.style.color = "var(--success-color)";
    } else if (estadoAtual.confiancaDiretoria >= 40) {
      confText.style.color = "var(--warning-color)";
    } else {
      confText.style.color = "var(--danger-color)";
    }
  }
  
  const temPendenciasObrigatorias = estadoAtual.mensagens && estadoAtual.mensagens.some(
    m => m.obrigatoria && !m.acaoConcluida
  );

  // Se diaTemporada for domingo (diaTemporada % 7 === 0), mostra botão de Jogo
  const isSundayMatchDay = (estadoAtual.diaTemporada % 7 === 0);

  if (estadoAtual.rodadaAtual <= 38) {
    const rodada = estadoAtual.calendario[estadoAtual.rodadaAtual - 1];
    const userJogo = rodada.jogos.find(
      j => j.homeTeamId === estadoAtual.timeUsuarioId || j.awayTeamId === estadoAtual.timeUsuarioId
    );
    
    const homeTeam = estadoAtual.times.find(t => t.id === userJogo.homeTeamId);
    const awayTeam = estadoAtual.times.find(t => t.id === userJogo.awayTeamId);
    
    fixtureHomeName.innerText = homeTeam.nome;
    fixtureAwayName.innerText = awayTeam.nome;
    
    if (isSundayMatchDay) {
      btnSimularDia.classList.add("hidden");
      btnJogarRodada.classList.remove("hidden");
      
      if (temPendenciasObrigatorias) {
        btnJogarRodada.disabled = true;
        btnJogarRodada.innerText = "RESOLVA AS PENDÊNCIAS";
      } else {
        btnJogarRodada.disabled = false;
        btnJogarRodada.innerText = "JOGAR PARTIDA";
      }
    } else {
      btnSimularDia.classList.remove("hidden");
      btnJogarRodada.classList.add("hidden");
      
      if (temPendenciasObrigatorias) {
        btnSimularDia.disabled = true;
        btnSimularDia.innerText = "PENDÊNCIAS...";
      } else {
        btnSimularDia.disabled = false;
        btnSimularDia.innerText = "AVANÇAR DIA";
      }
    }
  } else {
    // Fim da temporada
    fixtureHomeName.innerText = "Fim de Temporada";
    fixtureAwayName.innerText = "---";
    btnSimularDia.classList.add("hidden");
    btnJogarRodada.classList.remove("hidden");
    btnJogarRodada.innerText = "REINICIAR TEMPORADA";
    btnJogarRodada.disabled = false;
  }
}

// Binds dos botões principais de avanço
btnSimularDia.addEventListener("click", iniciarSimulacaoDias);

btnJogarRodada.addEventListener("click", () => {
  if (estadoAtual.rodadaAtual > 38) {
    recomecarTemporada();
    return;
  }
  abrirSimulacaoPartida();
});

// --- SIMULAÇÃO DE PARTIDA ---
const modalPartida = document.getElementById("modal-partida");
const liveHomeName = document.getElementById("live-home-name");
const liveAwayName = document.getElementById("live-away-name");
const liveHomeBadge = document.getElementById("live-home-badge");
const liveAwayBadge = document.getElementById("live-away-badge");
const liveScoreHome = document.getElementById("live-score-home");
const liveScoreAway = document.getElementById("live-score-away");
const liveTimerMin = document.getElementById("live-timer-min");
const liveHomePosturesLabel = document.getElementById("live-home-posture-label");
const liveAwayPosturesLabel = document.getElementById("live-away-posture-label");

const narrationLog = document.getElementById("narration-log");
const liveHomeScorers = document.getElementById("live-home-scorers");
const liveAwayScorers = document.getElementById("live-away-scorers");
const liveStats = document.getElementById("live-stats");

const btnMatchSpeed = document.getElementById("btn-match-speed");
const btnMatchFinish = document.getElementById("btn-match-finish");

let jogadoresMap = {};

function abrirSimulacaoPartida() {
  const userTeam = estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId);
  const rodadaIndex = estadoAtual.rodadaAtual - 1;
  const rodada = estadoAtual.calendario[rodadaIndex];
  
  const userJogo = rodada.jogos.find(
    j => j.homeTeamId === estadoAtual.timeUsuarioId || j.awayTeamId === estadoAtual.timeUsuarioId
  );
  
  const homeTeam = estadoAtual.times.find(t => t.id === userJogo.homeTeamId);
  const awayTeam = estadoAtual.times.find(t => t.id === userJogo.awayTeamId);
  const opponentTeam = homeTeam.id === userTeam.id ? awayTeam : homeTeam;

  // Clause check for loaned players playing against parent clubs
  const jogadoresEmprestadosOponente = userTeam.jogadores.filter(j => 
    j.emprestado && 
    j.clubeOrigemId === opponentTeam.id && 
    (userTeam.escalacao.titulares.includes(j.id) || userTeam.escalacao.reservas.includes(j.id))
  );

  if (jogadoresEmprestadosOponente.length > 0) {
    for (let j of jogadoresEmprestadosOponente) {
      if (j.liberadoRodada === estadoAtual.rodadaAtual) {
        continue;
      }
      
      const taxaClause = Math.round(j.valor * 0.02); // 2% do valor dele como taxa de liberação
      const confirmarPagar = confirm(
        `ATENÇÃO CONTRATUAL:\n\nO jogador ${j.nome} pertence ao ${opponentTeam.nome} (seu adversário de hoje).\n\n` +
        `Para ele poder ser escalado contra o clube detentor de seus direitos, você precisa pagar a multa de liberação contratual de ${formatarDinheiro(taxaClause)}.\n\n` +
        `Deseja pagar este valor agora para liberá-lo?\n` +
        `[Se escolher Cancelar, ele NÃO poderá jogar e você precisará tirá-lo da escalação].`
      );
      
      if (confirmarPagar) {
        if (userTeam.saldo < taxaClause) {
          alert(`Saldo insuficiente! Você não possui ${formatarDinheiro(taxaClause)} para pagar a liberação de ${j.nome}. Por favor, retire-o da escalação na aba Plantel & Táticas.`);
          abaAtiva = "tactics";
          renderizarTelaAtiva();
          configurarNavegacaoAtiva("tactics");
          return;
        }
        userTeam.saldo -= taxaClause;
        opponentTeam.saldo += taxaClause;
        j.liberadoRodada = estadoAtual.rodadaAtual;
        
        if (!userTeam.historicoTreino) userTeam.historicoTreino = [];
        userTeam.historicoTreino.unshift(`Cláusula de Empréstimo: Pago ${formatarDinheiro(taxaClause)} ao ${opponentTeam.nome} para liberar ${j.nome} nesta rodada!`);
        salvarJogo(estadoAtual);
        alert(`Taxa de liberação paga! ${j.nome} está regularizado para atuar contra o ${opponentTeam.nome}.`);
      } else {
        alert(`Liberação não autorizada. Remova ${j.nome} dos Titulares e Reservas na aba Plantel antes de iniciar a partida!`);
        abaAtiva = "tactics";
        renderizarTelaAtiva();
        configurarNavegacaoAtiva("tactics");
        return;
      }
    }
  }
  
  jogadoresMap = {};
  estadoAtual.times.forEach(t => {
    t.jogadores.forEach(j => {
      jogadoresMap[j.id] = j;
    });
  });

  if (userTeam.escalacao.titulares.length < 11) {
    alert("Você precisa definir pelo menos 11 jogadores titulares na aba Plantel & Táticas antes de jogar!");
    abaAtiva = "tactics";
    renderizarTelaAtiva();
    configurarNavegacaoAtiva("tactics");
    return;
  }

  liveHomeName.innerText = homeTeam.nome;
  liveAwayName.innerText = awayTeam.nome;
  liveHomeBadge.style.backgroundColor = homeTeam.corPrimaria;
  liveAwayBadge.style.backgroundColor = awayTeam.corPrimaria;
  
  liveScoreHome.innerText = "0";
  liveScoreAway.innerText = "0";
  liveTimerMin.innerText = "0";
  
  narrationLog.innerHTML = `<div class="narrative-line info">Apita o árbitro! Começa o jogo no estádio ${homeTeam.estadio}!</div>`;
  liveHomeScorers.innerHTML = "";
  liveAwayScorers.innerHTML = "";
  
  const userPosturaInicial = userTeam.postura || "equilibrada";
  document.querySelectorAll(".btn-posture").forEach(btn => {
    if (btn.getAttribute("data-posture") === userPosturaInicial) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  document.querySelectorAll(".btn-shout").forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-shout") === "nenhum") {
      btn.classList.add("active");
    }
  });

  const isUserHome = homeTeam.id === estadoAtual.timeUsuarioId;
  const gritoHomeInicial = isUserHome ? "nenhum" : "nenhum";
  const gritoAwayInicial = isUserHome ? "nenhum" : "nenhum";

  const cpuTeam = isUserHome ? awayTeam : homeTeam;
  const cpuPostura = cpuTeam.id === homeTeam.id ? "ofensiva" : Math.random() < 0.4 ? "defensiva" : "equilibrada";
  
  const posturaHome = isUserHome ? userPosturaInicial : cpuPostura;
  const posturaAway = !isUserHome ? userPosturaInicial : cpuPostura;
  
  liveHomePosturesLabel.innerText = posturaHome;
  liveAwayPosturesLabel.innerText = posturaAway;

  partidaAtiva = iniciarPartida(homeTeam, awayTeam, jogadoresMap, posturaHome, posturaAway, gritoHomeInicial, gritoAwayInicial);
  
  // Gritos do Técnico (Touchline Shouts)
  document.querySelectorAll(".btn-shout").forEach(btn => {
    const novoBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(novoBtn, btn);
    
    novoBtn.addEventListener("click", (e) => {
      const shout = e.target.getAttribute("data-shout");
      document.querySelectorAll(".btn-shout").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      
      if (partidaAtiva && !partidaAtiva.encerrada) {
        if (partidaAtiva.home.id === userTeam.id) {
          partidaAtiva.home.grito = shout;
        } else {
          partidaAtiva.away.grito = shout;
        }
        
        let labelShout = "Nenhuma instrução específica";
        if (shout === "exigir") labelShout = "Exigir Mais! 📣";
        else if (shout === "concentrar") labelShout = "Concentrar! 🧠";
        else if (shout === "acalmar") labelShout = "Acalmar o ritmo! 🧘";
        
        const line = document.createElement("div");
        line.className = "narrative-line info";
        line.innerHTML = `<strong>${partidaAtiva.minuto}'</strong> - Técnico grita à beira do gramado: <em>"${labelShout}"</em>`;
        narrationLog.appendChild(line);
        narrationLog.scrollTop = narrationLog.scrollHeight;
      }
    });
  });

  btnMatchFinish.classList.add("hidden");
  modalPartida.classList.add("active");
  
  desenharEstatisticasAoVivo();

  velocidadeSimulacao = 80;
  btnMatchSpeed.innerText = "Velocidade: Rápida";
  
  rodarLoopPartida();
}

function rodarLoopPartida() {
  if (loopPartida) clearInterval(loopPartida);
  
  loopPartida = setInterval(() => {
    const houveLance = simularMinutoPartida(partidaAtiva, jogadoresMap);
    
    liveTimerMin.innerText = partidaAtiva.minuto;
    liveScoreHome.innerText = partidaAtiva.home.gols;
    liveScoreAway.innerText = partidaAtiva.away.gols;
    
    if (partidaAtiva.eventos.length > 0) {
      const logsExibidosCount = narrationLog.querySelectorAll(".narrative-line").length;
      if (logsExibidosCount <= partidaAtiva.eventos.length) {
        const ultimoEvento = partidaAtiva.eventos[partidaAtiva.eventos.length - 1];
        const line = document.createElement("div");
        line.className = `narrative-line ${ultimoEvento.tipo}`;
        line.innerHTML = `<strong>${ultimoEvento.min}'</strong> - ${ultimoEvento.texto}`;
        
        narrationLog.appendChild(line);
        narrationLog.scrollTop = narrationLog.scrollHeight;
      }
    }
    
    desenharGolsPartida();
    desenharEstatisticasAoVivo();

    if (partidaAtiva.minuto >= 90) {
      clearInterval(loopPartida);
      concluirPartidaAtiva();
    }
  }, velocidadeSimulacao);
}

function desenharGolsPartida() {
  liveHomeScorers.innerHTML = partidaAtiva.home.golsJogadores.map(g => `<li>⚽ ${g.nome} (${g.min}')</li>`).join("");
  liveAwayScorers.innerHTML = partidaAtiva.away.golsJogadores.map(g => `<li>⚽ ${g.nome} (${g.min}')</li>`).join("");
}

function desenharEstatisticasAoVivo() {
  const total = partidaAtiva.home.poder.meio + partidaAtiva.away.poder.meio;
  const posseHome = Math.round((partidaAtiva.home.poder.meio / total) * 100);
  const posseAway = 100 - posseHome;
  
  liveStats.innerHTML = `
    <div class="live-stat-row">
      <div class="live-stat-val">${posseHome}%</div>
      <div class="live-stat-label">Posse</div>
      <div class="live-stat-val">${posseAway}%</div>
    </div>
    <div class="live-stat-row">
      <div class="live-stat-val">${partidaAtiva.home.chutes}</div>
      <div class="live-stat-label">Chutes</div>
      <div class="live-stat-val">${partidaAtiva.away.chutes}</div>
    </div>
    <div class="live-stat-row">
      <div class="live-stat-val">${partidaAtiva.home.faltas}</div>
      <div class="live-stat-label">Faltas</div>
      <div class="live-stat-val">${partidaAtiva.away.faltas}</div>
    </div>
    <div class="live-stat-row">
      <div class="live-stat-val" style="color: var(--warning-color);">${partidaAtiva.home.cartoesA}</div>
      <div class="live-stat-label">Amarelos</div>
      <div class="live-stat-val" style="color: var(--warning-color);">${partidaAtiva.away.cartoesA}</div>
    </div>
    <div class="live-stat-row">
      <div class="live-stat-val" style="color: var(--danger-color);">${partidaAtiva.home.cartoesV}</div>
      <div class="live-stat-label">Vermelhos</div>
      <div class="live-stat-val" style="color: var(--danger-color);">${partidaAtiva.away.cartoesV}</div>
    </div>
  `;
}

// Bind para postura
document.querySelectorAll(".btn-posture").forEach(btn => {
  const novoBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(novoBtn, btn);
  
  novoBtn.addEventListener("click", (e) => {
    const postura = e.target.getAttribute("data-posture");
    const userTeam = estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId);
    
    document.querySelectorAll(".btn-posture").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    
    userTeam.postura = postura;
    
    if (partidaAtiva && !partidaAtiva.encerrada) {
      if (partidaAtiva.home.id === userTeam.id) {
        partidaAtiva.home.postura = postura;
        liveHomePosturesLabel.innerText = postura;
      } else {
        partidaAtiva.away.postura = postura;
        liveAwayPosturesLabel.innerText = postura;
      }
    }
  });
});

btnMatchSpeed.addEventListener("click", () => {
  if (velocidadeSimulacao === 80) {
    velocidadeSimulacao = 250;
    btnMatchSpeed.innerText = "Velocidade: Lenta";
  } else {
    velocidadeSimulacao = 8;
    btnMatchSpeed.innerText = "Velocidade: Super Rápida";
  }
  rodarLoopPartida();
});

function concluirPartidaAtiva() {
  partidaAtiva.encerrada = true;
  
  const line = document.createElement("div");
  line.className = "narrative-line info";
  line.innerHTML = `<strong>90'</strong> - Fim de papo! Placar final: ${partidaAtiva.home.nome} ${partidaAtiva.home.gols} x ${partidaAtiva.away.gols} ${partidaAtiva.away.nome}.`;
  narrationLog.appendChild(line);
  narrationLog.scrollTop = narrationLog.scrollHeight;
  
  btnMatchFinish.classList.remove("hidden");
}

btnMatchFinish.addEventListener("click", () => {
  modalPartida.classList.remove("active");
  processarConclusaoDaRodada();
});

// --- ATUALIZAÇÕES GERAIS DE FIM DE RODADA ---
function processarConclusaoDaRodada() {
  const rodadaIndex = estadoAtual.rodadaAtual - 1;
  const rodada = estadoAtual.calendario[rodadaIndex];
  
  // 1. Gravar resultado do jogo do usuário
  const userJogo = rodada.jogos.find(
    j => j.homeTeamId === estadoAtual.timeUsuarioId || j.awayTeamId === estadoAtual.timeUsuarioId
  );
  
  userJogo.jogou = true;
  userJogo.golsHome = partidaAtiva.home.gols;
  userJogo.golsAway = partidaAtiva.away.gols;
  userJogo.publico = partidaAtiva.publico;
  userJogo.renda = partidaAtiva.renda;
  
  const userTeam = estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId);
  
  // Reseta o bônus tático acumulado da semana após o jogo ser disputado
  userTeam.bonusTatico = 0;

  // Receita de bilheteria mandante com taxa SAF de 10% se aplicável
  if (userJogo.homeTeamId === estadoAtual.timeUsuarioId) {
    let bilheteriaLiquida = userJogo.renda;
    if (userTeam.saf) {
      let percent = 0.10;
      if (userTeam.saf === "textor") percent = 0.15;
      else if (userTeam.saf === "city") percent = 0.10;
      else if (userTeam.saf === "minoritaria") percent = 0.04;
      bilheteriaLiquida = Math.round(userJogo.renda * (1 - percent));
    }
    userTeam.saldo += bilheteriaLiquida;
  }
  
  // 2. Simular instantaneamente todas as OUTRAS partidas da CPU nesta rodada
  rodada.jogos.forEach(jogo => {
    if (jogo.jogou) return;
    
    const home = estadoAtual.times.find(t => t.id === jogo.homeTeamId);
    const away = estadoAtual.times.find(t => t.id === jogo.awayTeamId);
    
    const res = simularPartidaCompleta(home, away, jogadoresMap);
    
    jogo.jogou = true;
    jogo.golsHome = res.golsHome;
    jogo.golsAway = res.golsAway;
    jogo.publico = res.publico;
    jogo.renda = res.renda;
    
    res.golsJogadoresHome.forEach(g => {
      const realP = home.jogadores.find(pl => pl.nome === g.nome);
      if (realP) realP.gols = (realP.gols || 0) + 1;
    });
    
    res.golsJogadoresAway.forEach(g => {
      const realP = away.jogadores.find(pl => pl.nome === g.nome);
      if (realP) realP.gols = (realP.gols || 0) + 1;
    });
  });
  
  // 3. Atualizar a Classificação
  rodada.jogos.forEach(jogo => {
    atualizarResultadoClassificacao(
      estadoAtual.classificacao,
      jogo.homeTeamId,
      jogo.awayTeamId,
      jogo.golsHome,
      jogo.golsAway
    );
  });
  
  // 4. Executar transações financeiras semanais (salários e juros de empréstimo)
  const custoSalarios = userTeam.jogadores.reduce((sum, p) => sum + p.salario, 0);
  userTeam.saldo -= custoSalarios;
  
  // Paga bônus de patrocinadores por metas da rodada
  let ganhou = false;
  let sofreuGol = true;
  let fez3GolsOuMais = false;
  
  if (userJogo.homeTeamId === userTeam.id) {
    if (userJogo.golsHome > userJogo.golsAway) ganhou = true;
    if (userJogo.golsAway === 0) sofreuGol = false;
    if (userJogo.golsHome >= 3) fez3GolsOuMais = true;
  } else if (userJogo.awayTeamId === userTeam.id) {
    if (userJogo.golsAway > userJogo.golsHome) ganhou = true;
    if (userJogo.golsHome === 0) sofreuGol = false;
    if (userJogo.golsAway >= 3) fez3GolsOuMais = true;
  }

  // Master: Bônus por vitória
  if (ganhou && userTeam.patrocinioMaster && userTeam.patrocinioMaster.bonusVitoria > 0) {
    userTeam.saldo += userTeam.patrocinioMaster.bonusVitoria;
  }

  // Secundários
  if (userTeam.patrociniosSecundarios) {
    const sec = userTeam.patrociniosSecundarios;
    // Mangas (Sleeves): Bônus sem sofrer gols (Baliza Zero)
    if (!sofreuGol && sec.sleeves && sec.sleeves.bonusBalizaZero > 0) {
      userTeam.saldo += sec.sleeves.bonusBalizaZero;
    }
    // Costas (Back): Bônus por 3+ gols marcados
    if (fez3GolsOuMais && sec.back && sec.back.bonusGols3 > 0) {
      userTeam.saldo += sec.back.bonusGols3;
    }
    // Calção (Shorts): Bônus por vitória
    if (ganhou && sec.shorts && sec.shorts.bonusVit > 0) {
      userTeam.saldo += sec.shorts.bonusVit;
    }
  }

  // Cobrar juros do banco (5% por rodada)
  if (userTeam.emprestimo > 0) {
    const juros = Math.round(userTeam.emprestimo * 0.05);
    userTeam.saldo -= juros;
  }

  // Paga royalties do material esportivo (camisas oficiais de venda)
  let royaltiesKit = 0;
  if (userTeam.patrocinioMaterial) {
    const classif = Object.values(estadoAtual.classificacao).sort((a,b) => b.pontos - a.pontos);
    const pos = classif.findIndex(c => c.timeId === userTeam.id) + 1;
    
    const fatorPos = Math.max(0.6, Math.min(1.4, 1.4 - ((pos - 1) * 0.045)));
    
    let fatorCamisaLimpa = 1.0;
    if (userTeam.patrocinioMaster && userTeam.patrocinioMaster.camisaLimpa === false) {
      fatorCamisaLimpa = 0.75;
    }
    
    const volumeVendasBase = userTeam.rep * 250000 * fatorPos * fatorCamisaLimpa;
    royaltiesKit = Math.round(volumeVendasBase * userTeam.patrocinioMaterial.royalties);
    userTeam.saldo += royaltiesKit;
    userTeam.ultimaReceitaCamisas = royaltiesKit;
  }
  
  // 5. Atualizar lesões, suspensões, moral e stamina (FM Morale/Stamina Updates)
  estadoAtual.times.forEach(t => {
    const jogo = rodada.jogos.find(j => j.homeTeamId === t.id || j.awayTeamId === t.id);
    const isHome = jogo.homeTeamId === t.id;
    const golsPro = isHome ? jogo.golsHome : jogo.golsAway;
    const golsContra = isHome ? jogo.golsAway : jogo.golsHome;
    
    let resultado = "empate";
    if (golsPro > golsContra) resultado = "vitoria";
    else if (golsPro < golsContra) resultado = "derrota";

    t.jogadores.forEach(j => {
      const jogou = t.escalacao.titulares.includes(j.id);
      const isReserva = t.escalacao.reservas.includes(j.id);
      
      if (jogou) {
        j.jogosTemporada = (j.jogosTemporada || 0) + 1;
      }

      if (resultado === "vitoria") {
        if (jogou) j.moral = Math.min(100, (j.moral || 75) + 5);
        else if (isReserva) j.moral = Math.min(100, (j.moral || 75) + 2);
        else j.moral = Math.max(0, (j.moral || 75) - 2);
      } else if (resultado === "derrota") {
        if (jogou) j.moral = Math.max(0, (j.moral || 75) - 5);
        else if (isReserva) j.moral = Math.max(0, (j.moral || 75) - 2);
        else j.moral = Math.max(0, (j.moral || 75) - 3);
      } else { // empate
        if (!jogou && !isReserva) j.moral = Math.max(0, (j.moral || 75) - 2);
      }

      if (j.cartaoVermelho) {
        j.cartaoVermelho = false;
        j.cartoesAmarelos = 0;
      }
      if (j.cartoesAmarelos >= 2) {
        j.cartoesAmarelos = 0;
      }
      
      if (j.lesionado) {
        j.tempoLesao -= 1;
        if (j.tempoLesao <= 0) {
          j.lesionado = false;
          j.tempoLesao = 0;
        }
      }
      
      if (jogou) {
        if (t.id !== estadoAtual.timeUsuarioId) {
          j.condicaoFisica = Math.max(45, (j.condicaoFisica || 100) - (8 + Math.floor(Math.random() * 5)));
        }
      } else {
        j.condicaoFisica = Math.min(100, (j.condicaoFisica || 100) + 18);
      }
      
      // Decrementa cooldown de conversações com o jogador
      if (j.cooldownConversa && j.cooldownConversa > 0) {
        j.cooldownConversa -= 1;
      }
    });
  });

  // 6. Processar vigência e retornos de contratos de Empréstimos
  estadoAtual.times.forEach(t => {
    for (let i = t.jogadores.length - 1; i >= 0; i--) {
      const j = t.jogadores[i];
      if (j.emprestado && j.tempoEmprestimo !== undefined) {
        j.tempoEmprestimo -= 1;
        if (j.tempoEmprestimo <= 0) {
          t.escalacao.titulares = t.escalacao.titulares.filter(id => id !== j.id);
          t.escalacao.reservas = t.escalacao.reservas.filter(id => id !== j.id);
          t.jogadores.splice(i, 1);
          
          const orgClub = estadoAtual.times.find(tc => tc.id === j.clubeOrigemId);
          if (orgClub) {
            j.emprestado = false;
            j.tempoEmprestimo = undefined;
            j.clubeOrigemId = undefined;
            if (j.salarioOriginal !== undefined) {
              j.salario = j.salarioOriginal;
              delete j.salarioOriginal;
            }
            j.timeId = orgClub.id;
            orgClub.jogadores.push(j);
            
            if (t.id === estadoAtual.timeUsuarioId || orgClub.id === estadoAtual.timeUsuarioId) {
              if (!estadoAtual.mensagens) estadoAtual.mensagens = [];
              estadoAtual.mensagens.push({
                id: `msg_loan_end_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                remetente: "Departamento de Futebol",
                assunto: `Fim do Empréstimo: ${j.nome}`,
                conteudo: `Prezado técnico,
                
Informamos que o contrato de empréstimo do atleta **${j.nome}** (${j.posicao}, força ${j.forca}) expirou nesta rodada.
O jogador retornou oficialmente para o seu clube de origem, o **${orgClub.nome}**.

Desejamos sucesso ao atleta nos seus próximos compromissos profissionais.

Atenciosamente,
Diretoria de Futebol.`,
                lida: false,
                obrigatoria: false,
                data: `Rodada ${estadoAtual.rodadaAtual}`,
                tipoAcao: null,
                acaoConcluida: true
              });
            }
          }
        }
      }
    }
  });

  // 7. Simular propostas da CPU por jogadores do usuário listados para transferência
  if (userTeam.jogadores) {
    userTeam.jogadores.forEach(j => {
      if (j.listaTransferencia && !j.lesionado) {
        if (Math.random() < 0.15) {
          const timesCPU = estadoAtual.times.filter(t => t.id !== userTeam.id);
          const comprador = timesCPU[Math.floor(Math.random() * timesCPU.length)];
          const valorProposta = Math.round(j.valor * (0.85 + Math.random() * 0.25));
          
          if (comprador && comprador.saldo >= valorProposta) {
            if (!estadoAtual.mensagens) estadoAtual.mensagens = [];
            estadoAtual.mensagens.push({
              id: `msg_proposta_cpu_${Date.now()}_${Math.floor(Math.random()*1000)}`,
              remetente: comprador.nome,
              assunto: `PROPOSTA OFICIAL: Compra de ${j.nome}`,
              conteudo: `Prezado técnico,
              
O **${comprador.nome}** enviou uma proposta oficial para contratar o jogador **${j.nome}** (${j.posicao}, força ${j.forca}, idade ${j.idade}), que está listado para transferência no mercado.

Oferecemos **${formatarDinheiro(valorProposta)}** pelo passe do atleta. 

Aguardamos o seu parecer oficial. A proposta pode ser aceita ou recusada através dos botões de ação abaixo.

Atenciosamente,
Diretoria do ${comprador.nome}.`,
              lida: false,
              obrigatoria: true,
              data: `Rodada ${estadoAtual.rodadaAtual}`,
              tipoAcao: "proposta_venda",
              acaoConcluida: false,
              dadosExtra: {
                jogadorId: j.id,
                valorProposta: valorProposta,
                compradorId: comprador.id
              }
            });
          }
        }
      }
    });
  }

  // 8. Atualizar Confiança da Diretoria e Simular Demissão / Propostas de Emprego
  if (estadoAtual.confiancaDiretoria === undefined) {
    estadoAtual.confiancaDiretoria = 70;
  }
  
  let empatou = false;
  if (userJogo.golsHome === userJogo.golsAway) empatou = true;
  
  // Ajuste por resultado da rodada
  if (ganhou) {
    estadoAtual.confiancaDiretoria = Math.min(100, estadoAtual.confiancaDiretoria + 5);
  } else if (empatou) {
    estadoAtual.confiancaDiretoria = Math.min(100, Math.max(0, estadoAtual.confiancaDiretoria + 1));
  } else {
    estadoAtual.confiancaDiretoria = Math.max(0, estadoAtual.confiancaDiretoria - 7);
  }
  
  // Ajuste por posição na tabela (Expectativa da Diretoria)
  const classifSorted = Object.values(estadoAtual.classificacao).sort((a,b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    return (b.golsPro - b.golsContra) - (a.golsPro - a.golsContra);
  });
  const userRank = classifSorted.findIndex(c => c.timeId === userTeam.id) + 1;
  
  if (userRank <= 4) {
    estadoAtual.confiancaDiretoria = Math.min(100, estadoAtual.confiancaDiretoria + 1);
  } else if (userRank >= 17) {
    estadoAtual.confiancaDiretoria = Math.max(0, estadoAtual.confiancaDiretoria - 2);
  }
  
  // Excesso de expectativa para times grandes fora da primeira metade da tabela
  if (userTeam.rep >= 75 && userRank > 10) {
    estadoAtual.confiancaDiretoria = Math.max(0, estadoAtual.confiancaDiretoria - 2);
  }
  
  // Verificação de Demissão (Morale / Resultados Críticos)
  if (estadoAtual.confiancaDiretoria <= 15) {
    estadoAtual.demitido = true;
    estadoAtual.propostasEmprego = null;
  } else if (estadoAtual.confiancaDiretoria >= 85 && estadoAtual.rodadaAtual >= 5) {
    // Propostas de emprego aleatórias (8% de chance se estiver muito bem)
    if (Math.random() < 0.08) {
      const timesCPU = estadoAtual.times.filter(t => t.id !== userTeam.id);
      const timeProposta = timesCPU[Math.floor(Math.random() * timesCPU.length)];
      
      if (timeProposta) {
        if (!estadoAtual.mensagens) estadoAtual.mensagens = [];
        const existePropostaAtiva = estadoAtual.mensagens.some(m => m.tipoAcao === "proposta_emprego" && !m.acaoConcluida);
        
        if (!existePropostaAtiva) {
          estadoAtual.mensagens.push({
            id: `msg_emprego_${Date.now()}`,
            remetente: `Presidente do ${timeProposta.nome}`,
            assunto: `CONVITE COMERCIAL: Proposta de Contrato no ${timeProposta.nome}`,
            conteudo: `Prezado técnico,
            
A diretoria do **${timeProposta.nome}** tem acompanhado de perto o seu excelente trabalho tático e a forma como lidera o seu elenco no campeonato.

Gostaríamos de formalizar uma proposta de contrato oficial para que você assuma o comando do nosso clube imediatamente. 

Oferecemos total autonomia no plantel e um orçamento de transferência de **${formatarDinheiro(timeProposta.saldo)}** em caixa para reforços.

A proposta pode ser aceita (o que fará você se transferir de clube) ou recusada através dos botões abaixo.

Atenciosamente,
A Diretoria do ${timeProposta.nome}.`,
            lida: false,
            obrigatoria: true,
            data: `Rodada ${estadoAtual.rodadaAtual}`,
            tipoAcao: "proposta_emprego",
            acaoConcluida: false,
            dadosExtra: {
              timeId: timeProposta.id
            }
          });
        }
      }
    }
  }
  
  estadoAtual.financasHistorico.push({
    rodada: estadoAtual.rodadaAtual,
    saldo: userTeam.saldo
  });
  
  estadoAtual.rodadaAtual += 1;
  rodada.concluida = true;
  
  // AVANÇA O DIA: De Domingo para Segunda-feira da semana seguinte
  estadoAtual.diaTemporada += 1;
  
  salvarJogo(estadoAtual);
  
  atualizarCabecalho();
  renderizarTelaAtiva();
  
  if (estadoAtual.rodadaAtual > 38) {
    exibirFimDeTemporada();
  }
}

function exibirFimDeTemporada() {
  const classificacao = Object.values(estadoAtual.classificacao).sort((a,b) => b.pontos - a.pontos);
  const campeao = classificacao[0];
  
  estadoAtual.historicoCampeoes.push({
    ano: estadoAtual.ano,
    campeao: campeao.nome,
    usuarioTreinou: estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId).nome,
    usuarioPosicao: classificacao.findIndex(c => c.timeId === estadoAtual.timeUsuarioId) + 1
  });
  
  salvarJogo(estadoAtual);
  
  alert(`🏆 TEMPORADA CONCLUÍDA! 🏆\n\nO Campeão Brasileiro de ${estadoAtual.ano} é o ${campeao.nome}!\nParabéns a todos os times.`);
  atualizarCabecalho();
}

function recomecarTemporada() {
  const timeUsuarioId = estadoAtual.timeUsuarioId;
  const historico = estadoAtual.historicoCampeoes;
  const anoNovo = estadoAtual.ano + 1;
  
  const timesAntigos = estadoAtual.times;
  const timeUsuarioCompleto = timesAntigos.find(t => t.id === timeUsuarioId);
  
  timeUsuarioCompleto.patrocinioMaster = null; 
  timeUsuarioCompleto.patrocinioMaterial = null; 
  timeUsuarioCompleto.patrociniosSecundarios = null;
  estadoAtual.propostasPatrocinio = null;
  timeUsuarioCompleto.ultimaReceitaCamisas = 0;
  timeUsuarioCompleto.bonusTatico = 0;
  timeUsuarioCompleto.historicoTreino = [];

  const timesNovos = inicializarBaseTimes().map(t => {
    if (t.id === timeUsuarioId) {
      return timeUsuarioCompleto;
    }
    return t;
  });
  
  timesNovos.forEach(t => {
    const tAntigo = timesAntigos.find(ta => ta.id === t.id);
    if (tAntigo) {
      t.jogadores.forEach(j => {
        const jAntigo = tAntigo.jogadores.find(ja => ja.id === j.id);
        if (jAntigo && jAntigo.jogosTemporada > 0) {
          if (!j.historico) j.historico = [];
          j.historico.push({
            ano: estadoAtual.ano,
            time: t.nome,
            jogos: jAntigo.jogosTemporada,
            gols: jAntigo.gols || 0,
            assistencias: jAntigo.assistencias || 0
          });
        }
        j.jogosTemporada = 0;
        j.gols = 0;
        j.assistencias = 0;
        j.cartoesAmarelos = 0;
        j.cartaoVermelho = false;
        j.moral = 75;
      });
    }
  });
  
  const novoCalendario = gerarCalendario(timesNovos);
  const novaClassificacao = {};
  timesNovos.forEach(t => {
    novaClassificacao[t.id] = {
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
  
  estadoAtual.ano = anoNovo;
  estadoAtual.rodadaAtual = 1;
  estadoAtual.diaTemporada = 1; // Reseta calendário diário
  estadoAtual.times = timesNovos;
  estadoAtual.calendario = novoCalendario;
  estadoAtual.classificacao = novaClassificacao;
  estadoAtual.historicoCampeoes = historico;
  
  // E-mail de patrocínio obrigatório
  estadoAtual.mensagens = [
    {
      id: "msg_patrocinio_" + anoNovo,
      remetente: "Diretoria Comercial",
      assunto: "CONTRATOS COMERCIAIS: Renovação de Patrocínios para a Temporada " + anoNovo,
      conteudo: `Prezado técnico,

Iniciamos o ano de ${anoNovo} e nossos contratos comerciais anteriores expiraram. Recebemos novas propostas de Fornecimento de Material Esportivo, Patrocínio Master e Patrocínios Secundários (Mangas, Costas e Calção) na mesa.

Você precisa selecionar nossos novos parceiros comerciais antes de avançar para a primeira rodada. Acesse o botão de ação abaixo para revisar e assinar os contratos.`,
      lida: false,
      obrigatoria: true,
      data: "Temp. " + anoNovo,
      tipoAcao: "patrocinio",
      acaoConcluida: false
    }
  ];

  salvarJogo(estadoAtual);
  iniciarJogoComEstado(estadoAtual);
}

function configurarNavegacaoAtiva(target) {
  document.querySelectorAll(".nav-btn").forEach(b => {
    if (b.getAttribute("data-target") === target) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });
}

function renderFiredScreen(container) {
  const userTeam = estadoAtual.times.find(t => t.id === estadoAtual.timeUsuarioId);
  
  if (!estadoAtual.propostasEmprego) {
    const timesCPU = estadoAtual.times.filter(t => t.id !== estadoAtual.timeUsuarioId);
    const filtrados = timesCPU.filter(t => t.rep <= 70);
    const pool = filtrados.length >= 3 ? filtrados : timesCPU;
    estadoAtual.propostasEmprego = pool.sort(() => 0.5 - Math.random()).slice(0, 3).map(t => t.id);
    salvarJogo(estadoAtual);
  }

  const propostasClubs = estadoAtual.propostasEmprego.map(id => estadoAtual.times.find(t => t.id === id)).filter(Boolean);

  container.innerHTML = `
    <div style="text-align: center; padding: 40px 20px; max-width: 700px; margin: 0 auto;">
      <span style="font-size: 4rem; display: block; margin-bottom: 20px; animation: pulse 2s infinite;">🚨</span>
      <h2 style="font-size: 2.2rem; font-weight: 900; color: var(--danger-color); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">Você foi Demitido!</h2>
      <p style="font-size: 1.05rem; line-height: 1.6; color: var(--text-main); margin-bottom: 30px;">
        A diretoria do <strong>${userTeam.nome}</strong> perdeu a paciência devido aos péssimos resultados recentes. Em uma reunião de emergência, o presidente anunciou a rescisão do seu contrato de treinador com efeito imediato.
      </p>

      <div class="section-title" style="margin-bottom: 15px; text-align: left;">Propostas de Trabalho Disponíveis</div>
      <p style="font-size: 0.85rem; color: var(--text-muted); text-align: left; margin-bottom: 20px;">
        Seu agente trabalhou rápido e conseguiu ofertas de contrato de clubes que buscam um novo comando técnico:
      </p>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${propostasClubs.map(time => {
          const mediaForca = Math.round(time.jogadores.reduce((sum, p) => sum + p.forca, 0) / time.jogadores.length);
          const estrelas = "⭐".repeat(Math.ceil(time.rep / 20));
          return `
            <div class="glass-card" style="padding: 20px; text-align: left; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--glass-border); transition: var(--transition-smooth); background: rgba(255,255,255,0.01);">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="club-color-dot" style="background: ${time.corPrimaria}; width: 14px; height: 14px;"></span>
                  <strong style="color: #fff; font-size: 1.25rem;">${time.nome}</strong>
                </div>
                <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 6px; display: flex; gap: 15px;">
                  <span>Reputação: <strong style="color: var(--warning-color);">${estrelas}</strong></span>
                  <span>Média Força: <strong>${mediaForca}</strong></span>
                  <span>Caixa: <strong style="color: var(--success-color);">${formatarDinheiro(time.saldo)}</strong></span>
                </div>
              </div>
              <button class="btn btn-primary btn-assinar-novo-time" data-time-id="${time.id}" style="padding: 8px 16px; font-size: 0.85rem;">Assinar Contrato</button>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  container.querySelectorAll(".btn-assinar-novo-time").forEach(btn => {
    btn.addEventListener("click", () => {
      const timeId = btn.getAttribute("data-time-id");
      const novoTime = estadoAtual.times.find(t => t.id === timeId);
      if (!novoTime) return;

      const confirmAss = confirm(`Deseja assinar contrato com o ${novoTime.nome}?\nVocê assumirá o comando imediatamente.`);
      if (!confirmAss) return;

      estadoAtual.timeUsuarioId = novoTime.id;
      estadoAtual.confiancaDiretoria = 70;
      estadoAtual.demitido = false;
      estadoAtual.propostasEmprego = null;

      if (!estadoAtual.mensagens) estadoAtual.mensagens = [];
      estadoAtual.mensagens.push({
        id: `msg_boas_vindas_${novoTime.id}_${Date.now()}`,
        remetente: "Presidente do Clube",
        assunto: `Bem-vindo ao ${novoTime.nome}!`,
        conteudo: `Prezado técnico,
        
É com orgulho que anunciamos a sua contratação como nosso novo técnico. A diretoria confia no seu trabalho para reestruturar o time.

Boa sorte!

Atenciosamente,
A Diretoria do ${novoTime.nome}.`,
        lida: false,
        obrigatoria: false,
        data: `Rodada ${estadoAtual.rodadaAtual}`,
        tipoAcao: null,
        acaoConcluida: true
      });

      salvarJogo(estadoAtual);

      document.getElementById("user-club-name").innerText = novoTime.nome;
      document.getElementById("user-club-color").style.backgroundColor = novoTime.corPrimaria;
      document.getElementById("user-club-balance").innerText = formatarDinheiro(novoTime.saldo);
      document.getElementById("user-board-confidence").innerText = `Diretoria: 70%`;
      document.getElementById("user-board-confidence").style.color = `var(--accent-color)`;

      alert(`💼 CONTRATO ASSINADO!\n\nVocê é o novo técnico do ${novoTime.nome}!`);
      
      abaAtiva = "inbox";
      atualizarCabecalho();
      renderizarTelaAtiva();
    });
  });
}
