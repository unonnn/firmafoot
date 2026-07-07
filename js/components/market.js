import { formatarDinheiro } from "../utils.js";
import { salvarJogo } from "../state.js";
import { gerarNovoJogador } from "../db.js";

let filtroPosicao = "TODAS";
let filtroForcaMin = 50;
let filtroOrigem = "LIVRES";

export function renderMarket(estado, container) {
  const userTeam = estado.times.find(t => t.id === estado.timeUsuarioId);
  
  const drawScreen = () => {
    container.innerHTML = `
      <div class="title-section">
        <span>Mercado de Transferências</span>
        <div>
          <button id="btn-atualizar-mercado" class="btn btn-secondary btn-sm" style="border-color: var(--accent-color); font-weight:600;">
            🔍 Contratar Scout (R$ ${userTeam.saf === "city" ? "25k" : "50k"})
          </button>
        </div>
      </div>

      <!-- Abas Internas -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;">
        <button id="tab-contratar" class="btn btn-sm btn-primary active">Comprar/Empréstimo</button>
        <button id="tab-vender" class="btn btn-sm btn-secondary">Lista de Venda (Elenco)</button>
      </div>

      <!-- SEÇÃO COMPRAR JOGADORES -->
      <div id="secao-comprar">
        <div class="search-filter-bar" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; margin-bottom: 20px;">
          <!-- Dropdown Origem (Livre / Clubes) -->
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">BUSCAR EM</label>
            <select id="filter-origem" class="form-control" style="padding: 6px 12px; width: 200px;">
              <option value="LIVRES" ${filtroOrigem === "LIVRES" ? "selected" : ""}>Jogadores Livres</option>
              ${estado.times.filter(t => t.id !== userTeam.id).map(t => `
                <option value="${t.id}" ${filtroOrigem === t.id ? "selected" : ""}>${t.nome}</option>
              `).join("")}
            </select>
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">FILTRAR POSIÇÃO</label>
            <select id="filter-posicao" class="form-control" style="padding: 6px 12px; width: 140px;">
              <option value="TODAS" ${filtroPosicao === "TODAS" ? "selected" : ""}>Todas</option>
              <option value="GOL" ${filtroPosicao === "GOL" ? "selected" : ""}>Goleiro (GOL)</option>
              <option value="LE" ${filtroPosicao === "LE" ? "selected" : ""}>Lateral Esq. (LE)</option>
              <option value="LD" ${filtroPosicao === "LD" ? "selected" : ""}>Lateral Dir. (LD)</option>
              <option value="ZAG" ${filtroPosicao === "ZAG" ? "selected" : ""}>Zagueiro (ZAG)</option>
              <option value="VOL" ${filtroPosicao === "VOL" ? "selected" : ""}>Volante (VOL)</option>
              <option value="MEI" ${filtroPosicao === "MEI" ? "selected" : ""}>Meia (MEI)</option>
              <option value="PE" ${filtroPosicao === "PE" ? "selected" : ""}>Ponta Esq. (PE)</option>
              <option value="PD" ${filtroPosicao === "PD" ? "selected" : ""}>Ponta Dir. (PD)</option>
              <option value="CA" ${filtroPosicao === "CA" ? "selected" : ""}>Centroavante (CA)</option>
            </select>
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px; flex-grow: 1; min-width: 150px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">
              <span>FORÇA MÍNIMA</span>
              <span id="val-forca" style="color: var(--accent-color); font-weight:800;">${filtroForcaMin}</span>
            </div>
            <input type="range" id="filter-forca" min="45" max="99" value="${filtroForcaMin}" style="width: 100%; margin-top: 6px;">
          </div>
        </div>

        <div class="market-player-grid" id="grid-comprar-jogadores">
          <!-- Injetado via JS -->
        </div>
      </div>

      <!-- SEÇÃO VENDER JOGADORES -->
      <div id="secao-vender" class="hidden">
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px;">
          Selecione um jogador de seu elenco para vender imediatamente para o mercado com deságio de 20%. Jogadores por empréstimo não podem ser vendidos.
        </p>
        <div class="market-player-grid" id="grid-vender-jogadores">
          <!-- Injetado via JS -->
        </div>
      </div>
    `;

    // Eventos de Navegação das Abas
    const tabContratar = document.getElementById("tab-contratar");
    const tabVender = document.getElementById("tab-vender");
    const secaoComprar = document.getElementById("secao-comprar");
    const secaoVender = document.getElementById("secao-vender");

    tabContratar.addEventListener("click", () => {
      tabContratar.classList.add("active");
      tabVender.classList.remove("active");
      secaoComprar.classList.remove("hidden");
      secaoVender.classList.add("hidden");
      desenharCompras();
    });

    tabVender.addEventListener("click", () => {
      tabVender.classList.add("active");
      tabContratar.classList.remove("active");
      secaoVender.classList.remove("hidden");
      secaoComprar.classList.add("hidden");
      desenharVendas();
    });

    // Eventos de Filtro
    document.getElementById("filter-origem").addEventListener("change", (e) => {
      filtroOrigem = e.target.value;
      desenharCompras();
    });

    document.getElementById("filter-posicao").addEventListener("change", (e) => {
      filtroPosicao = e.target.value;
      desenharCompras();
    });

    const rangeForca = document.getElementById("filter-forca");
    rangeForca.addEventListener("input", (e) => {
      filtroForcaMin = parseInt(e.target.value);
      document.getElementById("val-forca").innerText = filtroForcaMin;
      desenharCompras();
    });

    // Atualiza a lista do Scout
    document.getElementById("btn-atualizar-mercado").addEventListener("click", () => {
      const custoScout = userTeam.saf === "city" ? 25000 : 50000;
      if (userTeam.saldo < custoScout) {
        alert(`Saldo insuficiente para pagar a taxa de R$ ${custoScout.toLocaleString("pt-BR")} de scout!`);
        return;
      }
      userTeam.saldo -= custoScout;
      atualizarMercadoAleatoriamente(estado);
      salvarJogo(estado);
      
      document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
      desenharCompras();
    });

    desenharCompras();
  };

  const desenharCompras = () => {
    const grid = document.getElementById("grid-comprar-jogadores");
    grid.innerHTML = "";
    
    let listJogadores = [];
    if (filtroOrigem === "LIVRES") {
      listJogadores = estado.mercadoTransferencias || [];
    } else {
      const timeOrigem = estado.times.find(t => t.id === filtroOrigem);
      listJogadores = timeOrigem ? timeOrigem.jogadores.map(p => {
        p.timeId = timeOrigem.id; // Marca o ID do time atual dele
        return p;
      }) : [];
    }
    
    const filtrados = listJogadores.filter(j => {
      const matchPos = filtroPosicao === "TODAS" || j.posicao === filtroPosicao;
      const matchForca = j.forca >= filtroForcaMin;
      return matchPos && matchForca;
    });

    if (filtrados.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Nenhum jogador encontrado com os filtros selecionados.</div>`;
      return;
    }

    filtrados.forEach(j => {
      const card = document.createElement("div");
      card.className = "player-card";
      
      const secBadge = j.posicaoSecundaria ? `<span class="player-badge-pos-sec ${j.posicaoSecundaria}">${j.posicaoSecundaria}</span>` : "";
      
      const ownerClub = (!j.timeId || j.timeId === "free") ? null : estado.times.find(t => t.id === j.timeId);
      const labelClub = ownerClub ? ownerClub.nome : "Livre no Mercado";
      
      card.innerHTML = `
        <div class="player-card-header">
          <div>
            <span class="player-badge-pos ${j.posicao}">${j.posicao}</span>${secBadge}
          </div>
          <span class="player-card-force">${j.forca}</span>
        </div>
        <div class="player-card-name">${j.nome}</div>
        <div class="player-card-detail" style="margin-bottom: 6px;">
          <span>Idade: ${j.idade} anos</span>
          <span>Carac: ${j.caracteristica}</span>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 2px;">
          Clube: <strong style="color: #fff;">${labelClub}</strong>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px;">
          Salário: ${formatarDinheiro(j.salario)}/rodada
        </div>
        <div class="player-card-price">${formatarDinheiro(j.valor)}</div>
        <button class="btn btn-primary btn-sm btn-comprar" data-id="${j.id}">Negociar</button>
      `;

      card.querySelector(".btn-comprar").addEventListener("click", () => iniciarNegociacaoJogador(j));
      grid.appendChild(card);
    });
  };

  const desenharVendas = () => {
    const grid = document.getElementById("grid-vender-jogadores");
    grid.innerHTML = "";
    
    userTeam.jogadores.forEach(j => {
      const isTitular = userTeam.escalacao.titulares.includes(j.id);
      const isReserva = userTeam.escalacao.reservas.includes(j.id);
      const labelLineup = j.emprestado ? "Emprestado" : isTitular ? "Titular" : isReserva ? "Reserva" : "Não Relacionado";
      const valorVenda = Math.round(j.valor * 0.8);
      
      const card = document.createElement("div");
      card.className = "player-card";
      
      const secBadge = j.posicaoSecundaria ? `<span class="player-badge-pos-sec ${j.posicaoSecundaria}">${j.posicaoSecundaria}</span>` : "";
      
      card.innerHTML = `
        <div class="player-card-header">
          <div>
            <span class="player-badge-pos ${j.posicao}">${j.posicao}</span>${secBadge}
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 4px;">(${labelLineup})</span>
          </div>
          <span class="player-card-force">${j.forca}</span>
        </div>
        <div class="player-card-name">${j.nome}</div>
        <div class="player-card-detail">
          <span>Idade: ${j.idade} anos</span>
          <span>Físico: ${j.condicaoFisica}%</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Valor de Mercado: ${formatarDinheiro(j.valor)}</div>
        <div class="player-card-price" style="color: var(--warning-color);">Venda: ${formatarDinheiro(valorVenda)}</div>
        <button class="btn btn-secondary btn-sm btn-vender" style="border-color: var(--danger-color); color: var(--danger-color); ${j.emprestado ? "opacity:0.4; pointer-events:none;" : ""}" data-id="${j.id}">
          ${j.emprestado ? "Emprestado" : "Vender Instantâneo"}
        </button>
      `;

      if (!j.emprestado) {
        card.querySelector(".btn-vender").addEventListener("click", () => venderJogador(j));
      }
      grid.appendChild(card);
    });
  };

  const iniciarNegociacaoJogador = (jogador) => {
    if (userTeam.jogadores.length >= 25) {
      alert("Elenco cheio! Você já possui o limite máximo de 25 jogadores.");
      return;
    }

    const modal = document.getElementById("modal-negociacao");
    const modalContent = modal.querySelector(".modal-content");

    const isFreeAgent = !jogador.timeId || jogador.timeId === "free";
    const ownerClub = isFreeAgent ? null : estado.times.find(t => t.id === jogador.timeId);

    // Parâmetros locais do formulário de proposta
    let tipoProposta = "compra"; // compra ou emprestimo
    let multSalario = 1.0;
    let multValorClube = 1.0;
    let porcSalarioEmprestimo = 0.5;
    let duracaoEmprestimo = 10;

    const rodadasRestantes = 38 - estado.rodadaAtual + 1;

    // 1. Reputação Desejada pelo Jogador com base na sua força
    let repDesejada = 1;
    if (jogador.forca >= 90) repDesejada = 5;
    else if (jogador.forca >= 80) repDesejada = 4;
    else if (jogador.forca >= 70) repDesejada = 3;
    
    const repClube = userTeam.rep || 2;
    const diffRep = repClube - repDesejada;
    
    let repEvalStr = "";
    let repMod = 0;
    if (diffRep >= 0) {
      repEvalStr = `⭐️${repClube} (Ideal p/ Jogador | +5%)`;
      repMod = 5;
    } else {
      const perdas = Math.abs(diffRep) * 20;
      repEvalStr = `⭐️${repClube} (Reputação Baixa | -${perdas}%)`;
      repMod = -perdas;
    }

    // 2. Qualidade Média do Elenco do Usuário (Titulares)
    const titularesId = new Set(userTeam.escalacao.titulares);
    const titulares = userTeam.jogadores.filter(p => titularesId.has(p.id));
    const avgForce = titulares.length > 0 
      ? titulares.reduce((sum, p) => sum + p.forca, 0) / titulares.length
      : 50;

    let rosterEvalStr = "";
    let rosterMod = 0;
    if (jogador.forca > avgForce + 7) {
      rosterEvalStr = `Abaixo do esperado (-15%)`;
      rosterMod = -15;
    } else {
      rosterEvalStr = `Adequado (+5%)`;
      rosterMod = 5;
    }

    // 3. Posição na Tabela da Liga
    let posMod = 0;
    let posEvalStr = "Estável (+0%)";
    const classif = Object.values(estado.classificacao).sort((a,b) => b.pontos - a.pontos);
    const userPos = classif.findIndex(c => c.timeId === userTeam.id) + 1;
    if (userPos <= 4) {
      posEvalStr = "Zona G4 (Atraente | +10%)";
      posMod = 10;
    } else if (userPos >= 17) {
      posEvalStr = "Zona de Rebaixamento (-25%)";
      posMod = -25;
    }

    // Redesenho dinâmico e recálculo
    const updateModalUI = () => {
      let currentChance = 0;
      let extraInfoText = "";
      let proposalCost = 0;

      const playerChanceBase = 60 + repMod + rosterMod + posMod;
      const playerSalMod = multSalario === 1.5 ? 40 : (multSalario === 1.25 ? 20 : 0);
      const playerChance = Math.min(99, Math.max(1, playerChanceBase + playerSalMod));

      if (tipoProposta === "compra") {
        proposalCost = Math.round(jogador.valor * multValorClube);
        if (userTeam.saf === "city") {
          proposalCost = Math.round(proposalCost * 0.9); // 10% de desconto do Grupo City
        }
        if (isFreeAgent) {
          currentChance = playerChance;
          extraInfoText = `Contrato com jogador livre. Pague taxas diretas para assinar contrato: ${formatarDinheiro(proposalCost)}.`;
        } else {
          // Jogador sob contrato de outro clube
          let clubChanceBase = 50;
          const isStarterInOwner = ownerClub.escalacao.titulares.includes(jogador.id);
          let starterPenalty = 0;
          if (isStarterInOwner) {
            starterPenalty = -25; // relutância em vender titular
          } else {
            starterPenalty = 15; // reserva
          }

          let clubOfferMod = 0;
          if (multValorClube === 1.2) clubOfferMod = 30;
          else if (multValorClube === 0.9) clubOfferMod = -30;

          const clubChance = Math.min(99, Math.max(1, clubChanceBase + starterPenalty + clubOfferMod));
          currentChance = Math.round((clubChance + playerChance) / 2);

          extraInfoText = isStarterInOwner 
            ? `⚠️ O ${ownerClub.nome} resistirá à proposta pois o jogador é titular absoluto.`
            : `ℹ️ O ${ownerClub.nome} aceita negociar a liberação do jogador reserva.`;
        }
        // Empréstimo
        proposalCost = Math.round(jogador.valor * 0.05); // 5% do valor do jogador como assinatura
        if (userTeam.saf === "city") {
          proposalCost = Math.round(proposalCost * 0.9); // 10% de desconto do Grupo City
        }
        const isStarterInOwner = ownerClub.escalacao.titulares.includes(jogador.id);

        if (isStarterInOwner) {
          currentChance = 0;
          extraInfoText = `❌ O ${ownerClub.nome} recusa categoricamente emprestar o jogador porque ele é titular da equipe!`;
        } else {
          const clubChanceBase = 55;
          const salaryShareMod = porcSalarioEmprestimo === 1.0 ? 25 : 0;
          const durationMod = duracaoEmprestimo === 10 ? 10 : 0;

          const clubChance = Math.min(99, Math.max(1, clubChanceBase + salaryShareMod + durationMod));
          const playerChanceForLoan = Math.min(99, Math.max(1, 55 + playerSalMod));
          currentChance = Math.round((clubChance + playerChanceForLoan) / 2);
          
          extraInfoText = `ℹ️ O ${ownerClub.nome} aceita emprestar o jogador reserva.`;
        }
      }

      modalContent.innerHTML = `
        <div class="modal-header">
          <h2>Negociar Transferência</h2>
        </div>
        
        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 1.2rem; color: #fff; font-weight:700;">${jogador.nome}</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Força: <strong style="color:var(--accent-color);">${jogador.forca}</strong> | 
              Idade: <span>${jogador.idade}</span> anos | 
              Posição: <span class="player-badge-pos ${jogador.posicao}">${jogador.posicao}</span>
            </p>
            <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">
              Status: ${isFreeAgent ? `<span style="color: var(--success-color); font-weight:700;">Livre (Sem Clube)</span>` : `Sob contrato com o <strong>${ownerClub.nome}</strong>`}
            </span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${tipoProposta === "compra" ? "Custo de Compra:" : "Taxa de Assinatura:"}</span>
            <div style="font-size: 1.25rem; color: var(--success-color); font-weight:700;">${formatarDinheiro(proposalCost)}</div>
          </div>
        </div>

        <!-- ABA DE TIPO DE PROPOSTA -->
        ${!isFreeAgent ? `
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button id="tab-negoc-compra" class="btn ${tipoProposta === "compra" ? "btn-primary" : "btn-secondary"} btn-sm" style="flex:1;">Compra Definitiva</button>
            <button id="tab-negoc-emprestimo" class="btn ${tipoProposta === "emprestimo" ? "btn-primary" : "btn-secondary"} btn-sm" style="flex:1;">Empréstimo</button>
          </div>
        ` : ""}

        <!-- ANALISE DE PROJETO -->
        <div class="section-title">Análise de Interesse do Jogador</div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem; margin-bottom: 20px; color: var(--text-muted);">
          <div style="display: flex; justify-content: space-between;">
            <span>Reputação do Clube:</span>
            <span style="color: #fff; font-weight:600;">${repEvalStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Qualidade do Elenco:</span>
            <span style="color: #fff; font-weight:600;">${rosterEvalStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Briga na Tabela:</span>
            <span style="color: #fff; font-weight:600;">${posEvalStr}</span>
          </div>
        </div>

        <!-- CONFIGURAÇÕES DE PROPOSTAS -->
        ${tipoProposta === "compra" ? `
          ${!isFreeAgent ? `
            <div class="section-title">Valor Oferecido ao Clube Detentor</div>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <button class="btn btn-sm btn-opt-valor ${multValorClube === 0.9 ? "btn-primary" : "btn-secondary"}" data-val="0.9" style="flex:1;">90% (Desconto)</button>
              <button class="btn btn-sm btn-opt-valor ${multValorClube === 1.0 ? "btn-primary" : "btn-secondary"}" data-val="1.0" style="flex:1;">100% (Padrão)</button>
              <button class="btn btn-sm btn-opt-valor ${multValorClube === 1.2 ? "btn-primary" : "btn-secondary"}" data-val="1.2" style="flex:1;">120% (Premium)</button>
            </div>
          ` : ""}

          <div class="section-title">Contrato do Jogador (Salário semanal)</div>
          <div style="display: flex; gap: 8px; margin-bottom: 15px;">
            <button class="btn btn-sm btn-opt-salario ${multSalario === 1.0 ? "btn-primary" : "btn-secondary"}" data-val="1.0" style="flex:1;">Padrão</button>
            <button class="btn btn-sm btn-opt-salario ${multSalario === 1.25 ? "btn-primary" : "btn-secondary"}" data-val="1.25" style="flex:1;">Atraente (+25%)</button>
            <button class="btn btn-sm btn-opt-salario ${multSalario === 1.5 ? "btn-primary" : "btn-secondary"}" data-val="1.5" style="flex:1;">Estrela (+50%)</button>
          </div>
        ` : `
          <div class="section-title">Divisão de Salários (Loan Share)</div>
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button class="btn btn-sm btn-opt-divisao ${porcSalarioEmprestimo === 0.5 ? "btn-primary" : "btn-secondary"}" data-val="0.5" style="flex:1;">Pagar 50% do Salário</button>
            <button class="btn btn-sm btn-opt-divisao ${porcSalarioEmprestimo === 1.0 ? "btn-primary" : "btn-secondary"}" data-val="1.0" style="flex:1;">Pagar 100% do Salário</button>
          </div>

          <div class="section-title">Duração do Contrato</div>
          <div style="display: flex; gap: 8px; margin-bottom: 15px;">
            <button class="btn btn-sm btn-opt-duracao ${duracaoEmprestimo === 10 ? "btn-primary" : "btn-secondary"}" data-val="10" style="flex:1;">10 Rodadas</button>
            <button class="btn btn-sm btn-opt-duracao ${duracaoEmprestimo === rodadasRestantes ? "btn-primary" : "btn-secondary"}" data-val="${rodadasRestantes}" style="flex:1;">Fim da Temporada (${rodadasRestantes} rds)</button>
          </div>
        `}

        <div style="background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius:6px; font-size: 0.8rem; margin-bottom: 15px; border: 1px solid var(--glass-border);">
          <span>Salário de Custo Semanal do Clube:</span>
          <strong style="color:var(--success-color); float:right;">
            ${tipoProposta === "compra" 
              ? formatarDinheiro(Math.round(jogador.salario * multSalario))
              : formatarDinheiro(Math.round(jogador.salario * porcSalarioEmprestimo))
            } / rodada
          </strong>
        </div>

        <div style="font-size: 0.78rem; color: var(--warning-color); font-weight: 500; margin-bottom: 15px; line-height: 1.4;">
          ${extraInfoText}
        </div>

        <!-- Probabilidade de Acerto -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px;">
            <span>Chance de Acordo Comercial:</span>
            <strong style="color:var(--accent-color);">${currentChance}%</strong>
          </div>
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; border: 1px solid var(--glass-border);">
            <div style="width: ${currentChance}%; height: 100%; background: var(--accent-color); transition: width 0.3s ease;"></div>
          </div>
        </div>

        <div class="modal-footer" style="padding-top: 15px; margin-top: 0;">
          <button id="btn-negoc-cancelar" class="btn btn-secondary btn-sm">Recuar Negociação</button>
          <button id="btn-negoc-confirmar" class="btn btn-primary btn-sm" ${currentChance === 0 ? "disabled" : ""}>Enviar Proposta Oficial</button>
        </div>
      `;

      // Binds Toggles
      if (!isFreeAgent) {
        document.getElementById("tab-negoc-compra").addEventListener("click", () => {
          tipoProposta = "compra";
          updateModalUI();
        });
        document.getElementById("tab-negoc-emprestimo").addEventListener("click", () => {
          tipoProposta = "emprestimo";
          updateModalUI();
        });
      }

      modalContent.querySelectorAll(".btn-opt-valor").forEach(btn => {
        btn.addEventListener("click", () => {
          multValorClube = parseFloat(btn.getAttribute("data-val"));
          updateModalUI();
        });
      });

      modalContent.querySelectorAll(".btn-opt-salario").forEach(btn => {
        btn.addEventListener("click", () => {
          multSalario = parseFloat(btn.getAttribute("data-val"));
          updateModalUI();
        });
      });

      modalContent.querySelectorAll(".btn-opt-divisao").forEach(btn => {
        btn.addEventListener("click", () => {
          porcSalarioEmprestimo = parseFloat(btn.getAttribute("data-val"));
          updateModalUI();
        });
      });

      modalContent.querySelectorAll(".btn-opt-duracao").forEach(btn => {
        btn.addEventListener("click", () => {
          duracaoEmprestimo = parseInt(btn.getAttribute("data-val"));
          updateModalUI();
        });
      });

      document.getElementById("btn-negoc-cancelar").addEventListener("click", () => {
        modal.classList.remove("active");
      });

      document.getElementById("btn-negoc-confirmar").addEventListener("click", () => {
        if (userTeam.saldo < proposalCost) {
          alert("Saldo insuficiente para cobrir os custos desta operação!");
          return;
        }

        const roll = Math.floor(Math.random() * 100);

        if (roll < currentChance) {
          if (tipoProposta === "compra") {
            userTeam.saldo -= proposalCost;
            
            if (ownerClub) {
              ownerClub.saldo += proposalCost;
              ownerClub.jogadores = ownerClub.jogadores.filter(p => p.id !== jogador.id);
            }

            jogador.timeId = userTeam.id;
            jogador.salario = Math.round(jogador.salario * multSalario);
            userTeam.jogadores.push(jogador);

            estado.mercadoTransferencias = estado.mercadoTransferencias.filter(j => j.id !== jogador.id);

            alert(`🏆 CONTRATAÇÃO CONCLUÍDA!\n\n${jogador.nome} assinou contrato definitivo com o clube! Custo de transferência: ${formatarDinheiro(proposalCost)}.`);
          } else {
            // Empréstimo
            userTeam.saldo -= proposalCost;
            ownerClub.saldo += proposalCost;

            ownerClub.jogadores = ownerClub.jogadores.filter(p => p.id !== jogador.id);

            jogador.emprestado = true;
            jogador.clubeOrigemId = ownerClub.id;
            jogador.tempoEmprestimo = duracaoEmprestimo;
            jogador.salarioOriginal = jogador.salario;
            jogador.salario = Math.round(jogador.salario * porcSalarioEmprestimo);
            jogador.timeId = userTeam.id;

            userTeam.jogadores.push(jogador);

            alert(`🤝 EMPRÉSTIMO FECHADO!\n\n${jogador.nome} foi emprestado por ${duracaoEmprestimo} rodadas. Pagamos ${porcSalarioEmprestimo * 100}% do seu salário.`);
          }

          if (!userTeam.historicoTreino) userTeam.historicoTreino = [];
          const labelAct = tipoProposta === "compra" ? "Contratação" : "Empréstimo";
          userTeam.historicoTreino.unshift(`${labelAct}: ${jogador.nome} chegou ao clube.`);

          salvarJogo(estado);
          modal.classList.remove("active");
          
          document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
          desenharCompras();
        } else {
          modal.classList.remove("active");
          alert(`❌ NEGOCIAÇÃO REJEITADA!\n\nA contraparte recusou a sua proposta oficial.`);
        }
      });
    };

    updateModalUI();
    modal.classList.add("active");
  };

  const venderJogador = (jogador) => {
    if (jogador.emprestado) {
      alert("Você não pode vender um jogador que está emprestado ao seu clube!");
      return;
    }
    if (userTeam.jogadores.length <= 15) {
      alert("Operação bloqueada! Seu elenco deve ter pelo menos 15 jogadores.");
      return;
    }
    
    const valorVenda = Math.round(jogador.valor * 0.8);
    const conf = confirm(`Deseja vender ${jogador.nome} por ${formatarDinheiro(valorVenda)}?`);
    if (!conf) return;
    
    userTeam.escalacao.titulares = userTeam.escalacao.titulares.filter(id => id !== jogador.id);
    userTeam.escalacao.reservas = userTeam.escalacao.reservas.filter(id => id !== jogador.id);
    
    userTeam.saldo += valorVenda;
    userTeam.jogadores = userTeam.jogadores.filter(j => j.id !== jogador.id);
    
    salvarJogo(estado);
    
    document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
    drawScreen();
    document.getElementById("tab-vender").click();
  };

  drawScreen();
}

function atualizarMercadoAleatoriamente(estado) {
  const times = estado.times;
  const novasVagas = 8;
  const novoMercado = [];
  
  for (let i = 0; i < novasVagas; i++) {
    const timeRandom = times[Math.floor(Math.random() * times.length)];
    const p = gerarNovoJogador(timeRandom.rep);
    p.timeId = null; // Livre/Mercado
    novoMercado.push(p);
  }
  
  estado.mercadoTransferencias = novoMercado;
}
