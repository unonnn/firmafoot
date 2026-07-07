import { formatarDinheiro } from "../utils.js";
import { salvarJogo } from "../state.js";

// Coordenadas das formações táticas no campo (em % de top e left)
export const COORDENADAS_FORMATACAO = {
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
    { pos: "CA", top: 22, left: 65 }
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
    { pos: "PD", top: 22, left: 80 }
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
    { pos: "CA", top: 22, left: 65 }
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
    { pos: "CA", top: 22, left: 65 }
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
    { pos: "PD", top: 22, left: 80 }
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
    { pos: "CA", top: 20, left: 50 }
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
    { pos: "CA", top: 20, left: 50 }
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
    { pos: "CA", top: 20, left: 50 }
  ]
};

let jogadorSelecionadoId = null;
let subAbaAtiva = "campo"; // campo ou treino

export function renderTactics(estado, container) {
  const userTeam = estado.times.find(t => t.id === estado.timeUsuarioId);
  const jogadoresMap = {};
  userTeam.jogadores.forEach(j => { jogadoresMap[j.id] = j; });
  
  const esquema = userTeam.escalacao.esquema;
  const coords = COORDENADAS_FORMATACAO[esquema] || COORDENADAS_FORMATACAO["4-4-2"];
  
  // Ajusta escalações caso jogadores tenham sido expulsos/lesionados ou vendidos
  corrigirEscalacao(userTeam);

  // Funções auxiliares para movimentação e substituição rápida do elenco
  const promoverParaTitular = (id) => {
    const j = jogadoresMap[id];
    if (!j || userTeam.escalacao.titulares.includes(id)) return;
    
    if (j.lesionado || j.cartaoVermelho || j.cartoesAmarelos >= 2) {
      alert("Jogadores lesionados ou suspensos não podem ser escalados!");
      return;
    }
    
    userTeam.escalacao.reservas = userTeam.escalacao.reservas.filter(rid => rid !== id);
    const esc = userTeam.escalacao;
    const coordsEsquema = COORDENADAS_FORMATACAO[esc.esquema] || COORDENADAS_FORMATACAO["4-4-2"];
    
    let targetIdx = -1;
    
    // 1. Procurar vaga que combine com a posição do jogador onde há alguém fora de posição
    for (let i = 0; i < coordsEsquema.length; i++) {
      const posTactical = coordsEsquema[i].pos;
      if (posTactical === j.posicao) {
        const currentId = esc.titulares[i];
        const curP = jogadoresMap[currentId];
        if (!curP || (curP.posicao !== posTactical && curP.posicaoSecundaria !== posTactical)) {
          targetIdx = i;
          break;
        }
      }
    }
    
    // 2. Procurar vaga da mesma posição ocupada por alguém jogando na posição secundária
    if (targetIdx === -1) {
      for (let i = 0; i < coordsEsquema.length; i++) {
        const posTactical = coordsEsquema[i].pos;
        if (posTactical === j.posicao) {
          const currentId = esc.titulares[i];
          const curP = jogadoresMap[currentId];
          if (!curP || curP.posicao !== posTactical) {
            targetIdx = i;
            break;
          }
        }
      }
    }
    
    // 3. Substituir o pior titular que joga naquela posição
    if (targetIdx === -1) {
      let lowestForca = 999;
      for (let i = 0; i < coordsEsquema.length; i++) {
        const posTactical = coordsEsquema[i].pos;
        if (posTactical === j.posicao) {
          const currentId = esc.titulares[i];
          const curP = jogadoresMap[currentId];
          if (curP && curP.forca < lowestForca) {
            lowestForca = curP.forca;
            targetIdx = i;
          }
        }
      }
    }
    
    // 4. Fallback: substituir o pior de linha titular
    if (targetIdx === -1) {
      let lowestForca = 999;
      for (let i = 0; i < coordsEsquema.length; i++) {
        const posTactical = coordsEsquema[i].pos;
        if (j.posicao !== "GOL" && posTactical === "GOL") continue;
        const currentId = esc.titulares[i];
        const curP = jogadoresMap[currentId];
        if (curP && curP.forca < lowestForca) {
          lowestForca = curP.forca;
          targetIdx = i;
        }
      }
    }
    
    if (targetIdx !== -1) {
      const replacedId = esc.titulares[targetIdx];
      esc.titulares[targetIdx] = id;
      
      if (replacedId) {
        const repP = jogadoresMap[replacedId];
        if (repP && !repP.lesionado && !repP.cartaoVermelho && repP.cartoesAmarelos < 2) {
          if (esc.reservas.length < 7) {
            esc.reservas.push(replacedId);
          }
        }
      }
    }
    
    corrigirEscalacao(userTeam);
    salvarJogo(estado);
  };

  const moverParaReserva = (id) => {
    const j = jogadoresMap[id];
    if (!j || userTeam.escalacao.reservas.includes(id)) return;
    
    if (j.lesionado || j.cartaoVermelho || j.cartoesAmarelos >= 2) {
      alert("Jogadores lesionados ou suspensos não podem ser escalados!");
      return;
    }
    
    const esc = userTeam.escalacao;
    if (esc.titulares.includes(id)) {
      const idx = esc.titulares.indexOf(id);
      esc.titulares.splice(idx, 1);
    }
    
    if (esc.reservas.length < 7) {
      esc.reservas.push(id);
    } else {
      let lowestIdx = -1;
      let lowestForca = 999;
      for (let i = 0; i < esc.reservas.length; i++) {
        const rp = jogadoresMap[esc.reservas[i]];
        if (rp && rp.forca < lowestForca) {
          lowestForca = rp.forca;
          lowestIdx = i;
        }
      }
      if (lowestIdx !== -1) {
        esc.reservas[lowestIdx] = id;
      }
    }
    
    corrigirEscalacao(userTeam);
    salvarJogo(estado);
  };

  const removerDaEscalacao = (id) => {
    const esc = userTeam.escalacao;
    esc.titulares = esc.titulares.filter(tid => tid !== id);
    esc.reservas = esc.reservas.filter(rid => rid !== id);
    
    corrigirEscalacao(userTeam);
    salvarJogo(estado);
  };

  const drawScreen = () => {
    container.innerHTML = "";
    
    if (subAbaAtiva === "campo") {
      container.innerHTML = `
        <div class="title-section">
          <span>Táticas e Plantel</span>
          <div>
            <label style="font-size: 0.9rem; color: var(--text-muted); margin-right: 8px;">Esquema:</label>
            <select id="select-esquema" class="form-control" style="display: inline-block; width: auto; padding: 4px 8px;">
              <option value="4-4-2" ${esquema === "4-4-2" ? "selected" : ""}>4-4-2</option>
              <option value="4-3-3" ${esquema === "4-3-3" ? "selected" : ""}>4-3-3</option>
              <option value="3-5-2" ${esquema === "3-5-2" ? "selected" : ""}>3-5-2</option>
              <option value="5-3-2" ${esquema === "5-3-2" ? "selected" : ""}>5-3-2</option>
              <option value="3-4-3" ${esquema === "3-4-3" ? "selected" : ""}>3-4-3</option>
              <option value="4-5-1" ${esquema === "4-5-1" ? "selected" : ""}>4-5-1</option>
              <option value="4-2-3-1" ${esquema === "4-2-3-1" ? "selected" : ""}>4-2-3-1</option>
              <option value="5-4-1" ${esquema === "5-4-1" ? "selected" : ""}>5-4-1</option>
            </select>
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
          <button class="btn btn-sm btn-primary" id="sub-btn-campo">Escalação & Campo</button>
          <button class="btn btn-sm btn-secondary" id="sub-btn-treino">Foco de Treinamento</button>
        </div>

        <div id="tactics-instruction" style="text-align: center; font-size: 0.85rem; color: var(--accent-color); margin-bottom: 12px; height: 18px; font-weight: 500;">
          Clique em um jogador para interagir (Conversas, Renovação, Demissão, etc) ou arraste para substituir!
        </div>
        
        <div class="tactics-layout">
          <!-- LADO ESQUERDO: Campo Visual -->
          <div class="soccer-pitch-container">
            <div class="soccer-pitch" id="visual-pitch">
              <div class="center-line"></div>
              <div class="center-circle"></div>
              <div class="penalty-area-top"></div>
              <div class="penalty-area-bottom"></div>
            </div>
          </div>

          <!-- LADO DIREITO: Tabela com Jogadores -->
          <div class="glass-card" style="padding: 16px; overflow-y: auto; height: 520px;">
            <div class="section-title">Elenco Geral</div>
            <div class="table-responsive">
              <table class="custom-table" style="font-size: 0.85rem;">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th style="text-align: center;">Pos</th>
                    <th style="text-align: center;">For</th>
                    <th style="text-align: center;">Idade</th>
                    <th style="text-align: center;">Físico</th>
                    <th style="text-align: center;">Moral</th>
                    <th>Carac.</th>
                    <th>Valor</th>
                    <th style="text-align: center;">Status e Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody id="squad-table-body">
                  <!-- Jogadores injetados -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      desenharCampo();
      desenharTabelaElenco();

      document.getElementById("select-esquema").addEventListener("change", (e) => {
        const novoEsquema = e.target.value;
        userTeam.escalacao.esquema = novoEsquema;
        reordenarEscalacaoPorEsquema(userTeam, novoEsquema);
        salvarJogo(estado);
        renderTactics(estado, container);
      });
      
    } else {
      // SUB-ABA TREINAMENTO
      const foco = userTeam.focoTreino || "tecnico";
      
      container.innerHTML = `
        <div class="title-section">
          <span>Foco de Treinamento</span>
          <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: normal;">Modo Carreira: Preparação do Elenco</span>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button class="btn btn-sm btn-secondary" id="sub-btn-campo">Escalação & Campo</button>
          <button class="btn btn-sm btn-primary" id="sub-btn-treino">Foco de Treinamento</button>
        </div>

        <div class="grid-2col" style="grid-template-columns: 1.8fr 1.2fr; gap: 20px;">
          <div class="glass-card" style="padding: 20px; display:flex; flex-direction:column; gap:16px;">
            <div class="section-title">Escolher Foco Tático/Físico</div>
            
            <div class="training-card-select" data-foco="fisico" style="background: rgba(255,255,255,0.01); border: 1px solid ${foco === "fisico" ? "var(--accent-color)" : "var(--glass-border)"}; padding: 14px; border-radius: 12px; cursor: pointer; transition: var(--transition-smooth); ${foco === "fisico" ? "background: rgba(0,240,255,0.03);" : ""}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #fff; font-size: 1.05rem;">🏃 Físico & Condição</strong>
                ${foco === "fisico" ? "<span style='color: var(--accent-color); font-weight:700; font-size:0.75rem; border:1px solid var(--accent-color); padding: 2px 6px; border-radius:4px;'>ATIVO</span>" : ""}
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; line-height:1.4;">
                Foco no recondicionamento e preparação física (+3% de condição física para todo o elenco nos dias de treino).
              </p>
            </div>

            <div class="training-card-select" data-foco="tatico" style="background: rgba(255,255,255,0.01); border: 1px solid ${foco === "tatico" ? "var(--accent-color)" : "var(--glass-border)"}; padding: 14px; border-radius: 12px; cursor: pointer; transition: var(--transition-smooth); ${foco === "tatico" ? "background: rgba(0,240,255,0.03);" : ""}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #fff; font-size: 1.05rem;">🧠 Organização Tática</strong>
                ${foco === "tatico" ? "<span style='color: var(--accent-color); font-weight:700; font-size:0.75rem; border:1px solid var(--accent-color); padding: 2px 6px; border-radius:4px;'>ATIVO</span>" : ""}
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; line-height:1.4;">
                Foco em posicionamento coletivo. Acumula +1% de bônus de organização tática defensiva por dia treinado (reseta no dia da partida).
              </p>
            </div>

            <div class="training-card-select" data-foco="tecnico" style="background: rgba(255,255,255,0.01); border: 1px solid ${foco === "tecnico" ? "var(--accent-color)" : "var(--glass-border)"}; padding: 14px; border-radius: 12px; cursor: pointer; transition: var(--transition-smooth); ${foco === "tecnico" ? "background: rgba(0,240,255,0.03);" : ""}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #fff; font-size: 1.05rem;">⚽ Técnico & Desenvolvimento de Base</strong>
                ${foco === "tecnico" ? "<span style='color: var(--accent-color); font-weight:700; font-size:0.75rem; border:1px solid var(--accent-color); padding: 2px 6px; border-radius:4px;'>ATIVO</span>" : ""}
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; line-height:1.4;">
                Treinos técnicos de passe, finalização e desarme. Promessas da base (< 23 anos) têm **20% de chance de evoluir +1 de força permanentemente** a cada dia de treino.
              </p>
            </div>

            <div class="training-card-select" data-foco="descanso" style="background: rgba(255,255,255,0.01); border: 1px solid ${foco === "descanso" ? "var(--accent-color)" : "var(--glass-border)"}; padding: 14px; border-radius: 12px; cursor: pointer; transition: var(--transition-smooth); ${foco === "descanso" ? "background: rgba(0,240,255,0.03);" : ""}">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #fff; font-size: 1.05rem;">🧘 Folga & Gestão de Grupo (Mental)</strong>
                ${foco === "descanso" ? "<span style='color: var(--accent-color); font-weight:700; font-size:0.75rem; border:1px solid var(--accent-color); padding: 2px 6px; border-radius:4px;'>ATIVO</span>" : ""}
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; line-height:1.4;">
                Descanso físico e reuniões com comissão técnica (+5 de moral para todo o elenco e recuperação moderada de +5% stamina).
              </p>
            </div>
          </div>

          <div class="glass-card" style="padding: 20px; display:flex; flex-direction:column; height: 100%;">
            <div class="section-title">Acontecimentos de Treino</div>
            <div style="flex-grow: 1; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 8px; padding: 15px; font-size: 0.85rem; overflow-y: auto; max-height:340px;">
              <ul id="report-list-container" style="list-style-type: square; padding-left: 15px; display:flex; flex-direction:column; gap:10px; color: var(--text-main);">
                ${userTeam.historicoTreino && userTeam.historicoTreino.length > 0
                  ? userTeam.historicoTreino.map(log => `<li>${log}</li>`).join("")
                  : "<li style='color:var(--text-muted);'>Nenhum treino realizado ainda. Clique em 'Avançar Dia' no painel principal para ver os resultados.</li>"
                }
              </ul>
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll(".training-card-select").forEach(card => {
        card.addEventListener("click", () => {
          const selectedFoco = card.getAttribute("data-foco");
          userTeam.focoTreino = selectedFoco;
          salvarJogo(estado);
          drawScreen();
        });
      });
    }

    document.getElementById("sub-btn-campo").addEventListener("click", () => {
      subAbaAtiva = "campo";
      drawScreen();
    });

    document.getElementById("sub-btn-treino").addEventListener("click", () => {
      subAbaAtiva = "treino";
      drawScreen();
    });
  };

  const desenharCampo = () => {
    const pitch = document.getElementById("visual-pitch");
    pitch.querySelectorAll(".pitch-player").forEach(el => el.remove());
    
    userTeam.escalacao.titulares.forEach((pid, idx) => {
      const jogador = jogadoresMap[pid];
      if (!jogador) return;
      
      const coord = coords[idx];
      const posTactical = coord.pos;
      
      let forceDisplay = jogador.forca;
      let forceClass = "pitch-player-force";
      let statusIndicator = "";
      let playerExtraClass = "";
      
      const isPrimary = jogador.posicao === posTactical;
      const isSecondary = jogador.posicaoSecundaria === posTactical;
      
      if (!isPrimary) {
        if (isSecondary) {
          forceDisplay = Math.round(jogador.forca * 0.90);
          forceClass += " force-sec-pos";
          statusIndicator = `<span class="sec-pos-dot" title="Posição Secundária (10% penalidade)">⭐</span>`;
        } else {
          if (posTactical === "GOL" || jogador.posicao === "GOL") {
            forceDisplay = Math.round(jogador.forca * 0.20);
            playerExtraClass = " out-of-position-critical";
          } else {
            forceDisplay = Math.round(jogador.forca * 0.70);
            playerExtraClass = " out-of-position-warn";
          }
          forceClass += " force-out-pos";
          statusIndicator = `<span class="out-pos-warning" title="Fora de Posição">⚠️</span>`;
        }
      }
      
      const playerEl = document.createElement("div");
      playerEl.className = "pitch-player" + playerExtraClass;
      playerEl.style.top = `${coord.top}%`;
      playerEl.style.left = `${coord.left}%`;
      playerEl.setAttribute("data-player-id", pid);
      
      if (jogadorSelecionadoId === pid) {
        playerEl.classList.add("selected-tactics-player");
      }
      
      if (jogadorSelecionadoId && !userTeam.escalacao.titulares.includes(jogadorSelecionadoId)) {
        const selP = jogadoresMap[jogadorSelecionadoId];
        if (selP && (selP.posicao === posTactical || selP.posicaoSecundaria === posTactical)) {
          playerEl.classList.add("suggested-pitch-spot");
        }
      }
      
      playerEl.style.setProperty("--team-color-primary", userTeam.corPrimaria);
      
      playerEl.innerHTML = `
        <div class="pitch-player-shirt" style="color: ${obterCorTextoUniforme(userTeam.corPrimaria)};">${posTactical}</div>
        <div class="pitch-player-name">${jogador.nome.split(" ")[0]} ${statusIndicator}</div>
        <div class="${forceClass}">${forceDisplay}</div>
      `;
      
      playerEl.draggable = true;
      
      playerEl.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", pid);
        playerEl.classList.add("dragging");
      });
      
      playerEl.addEventListener("dragend", () => {
        playerEl.classList.remove("dragging");
      });
      
      playerEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        playerEl.classList.add("drag-over");
      });
      
      playerEl.addEventListener("dragleave", () => {
        playerEl.classList.remove("drag-over");
      });
      
      playerEl.addEventListener("drop", (e) => {
        e.preventDefault();
        playerEl.classList.remove("drag-over");
        const sourceId = e.dataTransfer.getData("text/plain");
        if (sourceId && sourceId !== pid) {
          executarTroca(sourceId, pid);
          jogadorSelecionadoId = null;
          desenharCampo();
          desenharTabelaElenco();
        }
      });

      playerEl.addEventListener("click", (e) => {
        e.stopPropagation();
        gerenciarCliqueJogador(pid);
      });
      
      pitch.appendChild(playerEl);
    });
  };

  const desenharTabelaElenco = () => {
    const tbody = document.getElementById("squad-table-body");
    tbody.innerHTML = "";
    
    const titularesList = userTeam.escalacao.titulares.map(id => jogadoresMap[id]).filter(Boolean);
    const reservasList = userTeam.escalacao.reservas.map(id => jogadoresMap[id]).filter(Boolean);
    
    const tSet = new Set(userTeam.escalacao.titulares);
    const rSet = new Set(userTeam.escalacao.reservas);
    const bancoList = userTeam.jogadores
      .filter(p => !tSet.has(p.id) && !rSet.has(p.id))
      .sort((a, b) => b.forca - a.forca);
      
    const desenharHeaderGrupo = (titulo, classeCor) => {
      const tr = document.createElement("tr");
      tr.style.background = "rgba(255, 255, 255, 0.02)";
      tr.style.pointerEvents = "none";
      tr.innerHTML = `
        <td colspan="9" style="font-weight: 800; color: ${classeCor}; text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
          ${titulo}
        </td>
      `;
      tbody.appendChild(tr);
    };

    const desenharLinhaJogador = (j, grupo) => {
      const isTitular = grupo === "titular";
      const isReserva = grupo === "reserva";
      const statusStr = isTitular ? "<span style='color: var(--success-color); font-weight: 700;'>TIT</span>" : isReserva ? "<span style='color: var(--accent-color); font-weight: 600;'>RES</span>" : "<span style='color: var(--text-muted);'>N/R</span>";
      
      const isSelected = jogadorSelecionadoId === j.id;
      
      let statusExtra = "";
      if (j.cartaoVermelho || j.cartoesAmarelos >= 2) {
        statusExtra = "<span style='color: var(--danger-color); font-weight: 700;'>SUSP</span>";
      } else if (j.lesionado) {
        statusExtra = `<span style='color: var(--warning-color); font-weight: 700;'>LES (${j.tempoLesao})</span>`;
      } else if (j.emprestado) {
        statusExtra = `<span style='color: var(--accent-color); font-weight: 700;' title='Jogador Emprestado'>EMP (${j.tempoEmprestimo} rds)</span>`;
      }
      
      const tr = document.createElement("tr");
      tr.setAttribute("style", "cursor: pointer;");
      if (isSelected) {
        tr.classList.add("row-selected");
      }
      
      if (jogadorSelecionadoId && jogadorSelecionadoId !== j.id && userTeam.escalacao.titulares.includes(jogadorSelecionadoId)) {
        const idxTit = userTeam.escalacao.titulares.indexOf(jogadorSelecionadoId);
        const posTacticalOfSelected = coords[idxTit]?.pos;
        if (j.posicao === posTacticalOfSelected || j.posicaoSecundaria === posTacticalOfSelected) {
          tr.classList.add("suggested-substitute");
        }
      }
      
      let moralLabel = "Reg";
      let moralColor = "var(--text-muted)";
      const mVal = j.moral !== undefined ? j.moral : 70;
      if (mVal >= 90) { moralLabel = "Exc"; moralColor = "var(--success-color)"; }
      else if (mVal >= 70) { moralLabel = "Boa"; moralColor = "var(--accent-color)"; }
      else if (mVal >= 40) { moralLabel = "Reg"; moralColor = "var(--text-muted)"; }
      else if (mVal >= 20) { moralLabel = "Baixa"; moralColor = "var(--warning-color)"; }
      else { moralLabel = "Pés"; moralColor = "var(--danger-color)"; }

      const secBadge = j.posicaoSecundaria 
        ? `<span class="player-badge-pos-sec ${j.posicaoSecundaria}" title="Posição Secundária">${j.posicaoSecundaria}</span>` 
        : "";

      const quickActions = `
        <div class="squad-quick-actions" style="display:inline-flex; gap:4px; margin-left: 10px; vertical-align: middle;">
          <button class="btn-squad-action ${isTitular ? 'active-tit' : ''}" data-action="titular" data-player-id="${j.id}" title="Escalar como Titular">T</button>
          <button class="btn-squad-action ${isReserva ? 'active-res' : ''}" data-action="reserva" data-player-id="${j.id}" title="Definir Reserva">R</button>
          <button class="btn-squad-action ${(!isTitular && !isReserva) ? 'active-bench' : ''}" data-action="banco" data-player-id="${j.id}" title="Deixar no Banco">B</button>
        </div>
      `;

      tr.innerHTML = `
        <td style="font-weight: 600;">${j.nome}</td>
        <td style="text-align: center; white-space: nowrap;">
          <span class="player-badge-pos ${j.posicao}">${j.posicao}</span>${secBadge}
        </td>
        <td style="text-align: center; font-weight: 700;">${j.forca}</td>
        <td style="text-align: center;">${j.idade}</td>
        <td style="text-align: center;">${j.condicaoFisica}%</td>
        <td style="text-align: center; color: ${moralColor}; font-weight: 600;">${moralLabel}</td>
        <td>${j.caracteristica}</td>
        <td style="color: var(--success-color); font-weight: 600;">${formatarDinheiro(j.valor)}</td>
        <td style="text-align: center; white-space: nowrap;">
          ${statusExtra || statusStr}
          ${quickActions}
        </td>
      `;
      
      tr.draggable = true;
      tr.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", j.id);
        tr.classList.add("row-dragging");
      });
      tr.addEventListener("dragend", () => {
        tr.classList.remove("row-dragging");
      });
      tr.addEventListener("dragover", (e) => {
        e.preventDefault();
        tr.classList.add("row-drag-over");
      });
      tr.addEventListener("dragleave", () => {
        tr.classList.remove("row-drag-over");
      });
      tr.addEventListener("drop", (e) => {
        e.preventDefault();
        tr.classList.remove("row-drag-over");
        const sourceId = e.dataTransfer.getData("text/plain");
        if (sourceId && sourceId !== j.id) {
          executarTroca(sourceId, j.id);
          jogadorSelecionadoId = null;
          desenharCampo();
          desenharTabelaElenco();
        }
      });

      tr.addEventListener("click", () => gerenciarCliqueJogador(j.id));
      
      tr.querySelectorAll(".btn-squad-action").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const action = btn.getAttribute("data-action");
          const pId = btn.getAttribute("data-player-id");
          
          if (action === "titular") {
            promoverParaTitular(pId);
          } else if (action === "reserva") {
            moverParaReserva(pId);
          } else if (action === "banco") {
            removerDaEscalacao(pId);
          }
          
          jogadorSelecionadoId = null;
          desenharCampo();
          desenharTabelaElenco();
        });
      });
      
      tbody.appendChild(tr);
    };

    desenharHeaderGrupo(`Titulares (${titularesList.length} / 11)`, "var(--success-color)");
    titularesList.forEach(j => desenharLinhaJogador(j, "titular"));
    
    desenharHeaderGrupo(`Reservas (${reservasList.length} / 7)`, "var(--accent-color)");
    reservasList.forEach(j => desenharLinhaJogador(j, "reserva"));
    
    desenharHeaderGrupo(`Não Relacionados (${bancoList.length})`, "var(--text-muted)");
    bancoList.forEach(j => desenharLinhaJogador(j, "banco"));
  };

  const gerenciarCliqueJogador = (id) => {
    if (jogadorSelecionadoId !== null) {
      selecionarJogador(id);
    } else {
      abrirModalJogador(id);
    }
  };

  const abrirModalJogador = (jogadorId) => {
    const j = jogadoresMap[jogadorId];
    if (!j) return;

    const modal = document.getElementById("modal-jogador");
    const content = modal.querySelector(".modal-content");

    const isTitular = userTeam.escalacao.titulares.includes(j.id);
    const isReserva = userTeam.escalacao.reservas.includes(j.id);
    const statusLabel = isTitular ? "Titular" : isReserva ? "Reserva" : "Não Relacionado";

    const updateModalUI = () => {
      const secBadge = j.posicaoSecundaria 
        ? `<span class="player-badge-pos-sec ${j.posicaoSecundaria}" style="margin-left:5px;">${j.posicaoSecundaria}</span>` 
        : "";

      const cooldown = j.cooldownConversa || 0;
      const listed = j.listaTransferencia || false;

      content.innerHTML = `
        <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom:12px; margin-bottom:16px;">
          <h2 style="font-size:1.3rem; font-weight:800; color:#fff;">${j.nome}</h2>
          <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">${statusLabel}</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; font-size:0.85rem; background:rgba(255,255,255,0.01); border:1px solid var(--glass-border); padding:12px; border-radius:8px;">
          <div>
            <div style="margin-bottom:6px;">Posição: <span class="player-badge-pos ${j.posicao}">${j.posicao}</span>${secBadge}</div>
            <div style="margin-bottom:6px;">Força: <strong style="color:var(--accent-color);">${j.forca}</strong></div>
            <div style="margin-bottom:6px;">Idade: <strong>${j.idade} anos</strong></div>
            <div style="margin-bottom:6px;">Físico: <strong>${j.condicaoFisica}%</strong></div>
          </div>
          <div>
            <div style="margin-bottom:6px;">Moral: <strong style="color:var(--success-color);">${j.moral || 75}/100</strong></div>
            <div style="margin-bottom:6px;">Salário: <strong>${formatarDinheiro(j.salario)} / rodada</strong></div>
            <div style="margin-bottom:6px;">Valor: <strong>${formatarDinheiro(j.valor)}</strong></div>
            ${j.emprestado ? `<div style="color:var(--accent-color); font-weight:700;">Emprestado pelo ${estado.times.find(t=>t.id===j.clubeOrigemId)?.nome || "adversário"}</div>` : ""}
          </div>
        </div>

        <div class="section-title">Estatísticas na Temporada</div>
        <div style="display:flex; justify-content:space-around; background:rgba(0,0,0,0.15); padding:10px; border-radius:6px; font-size:0.85rem; margin-bottom:20px; text-align:center;">
          <div>
            <div style="font-size:1.1rem; font-weight:800; color:#fff;">${j.jogosTemporada || 0}</div>
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Jogos</span>
          </div>
          <div>
            <div style="font-size:1.1rem; font-weight:800; color:var(--warning-color);">${j.gols || 0}</div>
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Gols</span>
          </div>
          <div>
            <div style="font-size:1.1rem; font-weight:800; color:var(--accent-color);">${j.assistencias || 0}</div>
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Assists</span>
          </div>
        </div>

        <div class="section-title">Ações e Conversas</div>
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
          <!-- 1. CONVERSAR -->
          <div style="border: 1px solid var(--glass-border); border-radius:8px; padding:10px; background:rgba(255,255,255,0.01);">
            <span style="font-size:0.78rem; font-weight:700; color:#fff; display:block; margin-bottom:6px;">💬 Conversar com o Jogador</span>
            ${cooldown > 0 ? `
              <p style="font-size:0.75rem; color:var(--warning-color); margin:0;">Disponível em ${cooldown} rodadas.</p>
            ` : `
              <div style="display:flex; gap:6px;">
                <button class="btn btn-secondary btn-sm btn-talk-elogiar" style="flex:1; font-size:0.72rem; padding:4px;">Elogiar (+10 Moral)</button>
                <button class="btn btn-secondary btn-sm btn-talk-cobrar" style="flex:1; font-size:0.72rem; padding:4px;">Cobrar Foco (Aleatório)</button>
                <button class="btn btn-secondary btn-sm btn-talk-folga" style="flex:1; font-size:0.72rem; padding:4px;">Dar Folga (+15% Físico)</button>
              </div>
            `}
          </div>

          <!-- 2. CONTRATOS E LISTA DE TRASFERENCIA -->
          <div style="display:flex; gap:8px;">
            ${j.emprestado ? `
              <button class="btn btn-secondary btn-sm btn-action-devolver" style="flex:1; border-color:var(--danger-color); color:var(--danger-color); font-size:0.78rem;">↩️ Devolver Empréstimo</button>
            ` : `
              <button class="btn btn-secondary btn-sm btn-action-renovar" style="flex:1; border-color:var(--success-color); color:var(--success-color); font-size:0.78rem;">💰 Renovar</button>
              <button class="btn btn-secondary btn-sm btn-action-listar ${listed ? 'btn-primary' : ''}" style="flex:1; font-size:0.78rem;">
                📢 ${listed ? 'Remover Venda' : 'Listar Venda'}
              </button>
              <button class="btn btn-secondary btn-sm btn-action-rescindir" style="flex:1; border-color:var(--danger-color); color:var(--danger-color); font-size:0.78rem;">❌ Demitir</button>
            `}
          </div>
        </div>

        <div class="modal-footer" style="padding-top:12px; margin-top:0; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between;">
          <button id="btn-modal-jogador-close" class="btn btn-secondary btn-sm">Fechar</button>
          <button id="btn-modal-jogador-swap" class="btn btn-primary btn-sm">🔄 Substituir / Mover</button>
        </div>
      `;

      if (cooldown === 0) {
        content.querySelector(".btn-talk-elogiar")?.addEventListener("click", () => {
          j.moral = Math.min(100, (j.moral || 75) + 10);
          j.cooldownConversa = 3;
          salvarJogo(estado);
          alert(`Você elogiou o comprometimento de ${j.nome}. Ele ficou motivado e sua moral subiu!`);
          updateModalUI();
        });

        content.querySelector(".btn-talk-cobrar")?.addEventListener("click", () => {
          const roll = Math.random() < 0.5;
          if (roll) {
            j.moral = Math.min(100, (j.moral || 75) + 12);
            alert(`Você cobrou mais foco de ${j.nome} nos treinos. Ele aceitou a crítica de forma profissional e se motivou!`);
          } else {
            j.moral = Math.max(0, (j.moral || 75) - 10);
            alert(`Você cobrou mais foco de ${j.nome}. Ele sentiu que a cobrança foi injusta e sua moral caiu.`);
          }
          j.cooldownConversa = 3;
          salvarJogo(estado);
          updateModalUI();
        });

        content.querySelector(".btn-talk-folga")?.addEventListener("click", () => {
          j.condicaoFisica = Math.min(100, (j.condicaoFisica || 100) + 15);
          j.moral = Math.max(0, (j.moral || 75) - 5);
          j.cooldownConversa = 3;
          salvarJogo(estado);
          alert(`Você deu folga extra para ${j.nome}. A condição física dele se recuperou, mas ele perdeu um pouco de ritmo tático.`);
          updateModalUI();
        });
      }

      content.querySelector(".btn-action-renovar")?.addEventListener("click", () => {
        const taxaRenov = 10000;
        if (userTeam.saldo < taxaRenov) {
          alert("Saldo insuficiente para pagar as taxas de renovação de contrato!");
          return;
        }
        const confirmRenov = confirm(`Deseja renovar com ${j.nome}?\nCusto: R$ 10.000 em luvas.\nO salário dele subirá 15%, mas a moral subirá para 100% de felicidade!`);
        if (!confirmRenov) return;

        userTeam.saldo -= taxaRenov;
        j.salario = Math.round(j.salario * 1.15);
        j.moral = 100;
        salvarJogo(estado);
        alert(`Sucesso! Contrato de ${j.nome} renovado.`);
        updateModalUI();
      });

      content.querySelector(".btn-action-listar")?.addEventListener("click", () => {
        j.listaTransferencia = !j.listaTransferencia;
        salvarJogo(estado);
        alert(`${j.nome} foi ${j.listaTransferencia ? 'incluído na' : 'removido da'} lista de transferências do clube.`);
        updateModalUI();
      });

      content.querySelector(".btn-action-rescindir")?.addEventListener("click", () => {
        const multa = Math.round(j.salario * 5);
        if (userTeam.saldo < multa) {
          alert(`Saldo insuficiente! Para rescindir, você precisa de ${formatarDinheiro(multa)}.`);
          return;
        }
        const confirmResc = confirm(`ATENÇÃO: Deseja rescindir com ${j.nome}?\nVocê terá que pagar R$ ${formatarDinheiro(multa)} de multa rescisória.`);
        if (!confirmResc) return;

        userTeam.saldo -= multa;
        userTeam.jogadores = userTeam.jogadores.filter(p => p.id !== j.id);
        userTeam.escalacao.titulares = userTeam.escalacao.titulares.filter(id => id !== j.id);
        userTeam.escalacao.reservas = userTeam.escalacao.reservas.filter(id => id !== j.id);

        salvarJogo(estado);
        modal.classList.remove("active");
        alert(`${j.nome} teve seu contrato rescindido e foi dispensado do clube.`);
        
        renderTactics(estado, container);
      });

      content.querySelector(".btn-action-devolver")?.addEventListener("click", () => {
        const confirmDev = confirm(`Deseja devolver ${j.nome} antecipadamente ao seu clube de origem?`);
        if (!confirmDev) return;

        userTeam.escalacao.titulares = userTeam.escalacao.titulares.filter(id => id !== j.id);
        userTeam.escalacao.reservas = userTeam.escalacao.reservas.filter(id => id !== j.id);
        userTeam.jogadores = userTeam.jogadores.filter(p => p.id !== j.id);

        const orgClub = estado.times.find(tc => tc.id === j.clubeOrigemId);
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
        }

        salvarJogo(estado);
        modal.classList.remove("active");
        alert(`${j.nome} retornou au seu clube de origem.`);
        
        renderTactics(estado, container);
      });

      document.getElementById("btn-modal-jogador-close").addEventListener("click", () => {
        modal.classList.remove("active");
      });

      document.getElementById("btn-modal-jogador-swap").addEventListener("click", () => {
        modal.classList.remove("active");
        selecionarJogador(j.id);
      });
    };

    updateModalUI();
    modal.classList.add("active");
  };

  const selecionarJogador = (id) => {
    const jogador = jogadoresMap[id];
    const instContainer = document.getElementById("tactics-instruction");
    
    if (jogador.lesionado || jogador.cartaoVermelho || jogador.cartoesAmarelos >= 2) {
      if (!userTeam.escalacao.titulares.includes(id)) {
        alert("Jogadores lesionados ou suspensos não podem ser escalados como titulares!");
        jogadorSelecionadoId = null;
        if (instContainer) instContainer.innerText = "Arraste os jogadores no campo ou clique neles para movimentá-los.";
        desenharTabelaElenco();
        return;
      }
    }
    
    if (jogadorSelecionadoId === null) {
      jogadorSelecionadoId = id;
      if (instContainer) {
        const isTit = userTeam.escalacao.titulares.includes(id);
        if (isTit) {
          instContainer.innerHTML = `Substituição: Selecionou titular <strong>${jogador.nome}</strong>. Os reservas compatíveis estão <span style="color:var(--success-color); font-weight:700;">destacados em verde</span> na lista abaixo. Clique em um deles para trocar!`;
        } else {
          instContainer.innerHTML = `Escalação: Selecionou reserva/banco <strong>${jogador.nome}</strong>. As posições compatíveis estão <span style="color:var(--success-color); font-weight:700;">piscando no campo</span> acima. Clique em uma delas para escalá-lo!`;
        }
      }
    } else if (jogadorSelecionadoId === id) {
      jogadorSelecionadoId = null;
      if (instContainer) {
        instContainer.innerText = "Arraste os jogadores no campo ou clique neles para movimentá-los.";
      }
    } else {
      executarTroca(jogadorSelecionadoId, id);
      jogadorSelecionadoId = null;
      if (instContainer) {
        instContainer.innerText = "Arraste os jogadores no campo ou clique neles para movimentá-los. Substituição feita com sucesso!";
      }
    }
    
    desenharCampo();
    desenharTabelaElenco();
  };

  const executarTroca = (id1, id2) => {
    const esc = userTeam.escalacao;
    const isTitular1 = esc.titulares.includes(id1);
    const isTitular2 = esc.titulares.includes(id2);
    const isReserva1 = esc.reservas.includes(id1);
    const isReserva2 = esc.reservas.includes(id2);
    
    if (isTitular1 && isTitular2) {
      const idx1 = esc.titulares.indexOf(id1);
      const idx2 = esc.titulares.indexOf(id2);
      esc.titulares[idx1] = id2;
      esc.titulares[idx2] = id1;
    } else if (isTitular1 && isReserva2) {
      const idxTit = esc.titulares.indexOf(id1);
      const idxRes = esc.reservas.indexOf(id2);
      esc.titulares[idxTit] = id2;
      esc.reservas[idxRes] = id1;
    } else if (isTitular1 && !isTitular2 && !isReserva2) {
      const idxTit = esc.titulares.indexOf(id1);
      esc.titulares[idxTit] = id2;
    } else if (isReserva1 && isReserva2) {
      const idx1 = esc.reservas.indexOf(id1);
      const idx2 = esc.reservas.indexOf(id2);
      esc.reservas[idx1] = id2;
      esc.reservas[idx2] = id1;
    } else if (isReserva1 && !isTitular2 && !isReserva2) {
      const idxRes = esc.reservas.indexOf(id1);
      esc.reservas[idxRes] = id2;
    } else if (!isTitular1 && !isReserva1) {
      if (isTitular2) {
        const idxTit = esc.titulares.indexOf(id2);
        esc.titulares[idxTit] = id1;
      } else if (isReserva2) {
        const idxRes = esc.reservas.indexOf(id2);
        esc.reservas[idxRes] = id1;
      }
    }
    salvarJogo(estado);
  };

  drawScreen();
}

function obterStatusRelacionamento(id, escalacao) {
  if (escalacao.titulares.includes(id)) return 0;
  if (escalacao.reservas.includes(id)) return 1;
  return 2;
}

function obterCorTextoUniforme(corHex) {
  const r = parseInt(corHex.slice(1, 3), 16);
  const g = parseInt(corHex.slice(3, 5), 16);
  const b = parseInt(corHex.slice(5, 7), 16);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 140 ? "#000" : "#fff";
}

function corrigirEscalacao(team) {
  const idsValidos = team.jogadores.map(j => j.id);
  team.escalacao.titulares = team.escalacao.titulares.filter(id => id && idsValidos.includes(id));
  team.escalacao.reservas = team.escalacao.reservas.filter(id => id && idsValidos.includes(id));
  
  if (team.escalacao.titulares.length < 11) {
    const disponiveis = idsValidos.filter(id => !team.escalacao.titulares.includes(id) && !team.escalacao.reservas.includes(id));
    for (let id of disponiveis) {
      if (team.escalacao.titulares.length >= 11) break;
      const j = team.jogadores.find(p => p.id === id);
      if (!j.lesionado && !j.cartaoVermelho && j.cartoesAmarelos < 2) {
        team.escalacao.titulares.push(id);
      }
    }
  }
}

function reordenarEscalacaoPorEsquema(team, esquema) {
  const requisitos = {
    "4-4-2": { GOL: 1, LE: 1, ZAG: 2, LD: 1, VOL: 1, MEI: 3, CA: 2 },
    "4-3-3": { GOL: 1, LE: 1, ZAG: 2, LD: 1, VOL: 2, MEI: 1, PE: 1, PD: 1, CA: 1 },
    "3-5-2": { GOL: 1, ZAG: 3, LE: 1, LD: 1, VOL: 2, MEI: 1, CA: 2 },
    "5-3-2": { GOL: 1, LE: 1, ZAG: 3, LD: 1, VOL: 2, MEI: 1, CA: 2 },
    "3-4-3": { GOL: 1, ZAG: 3, LE: 1, LD: 1, VOL: 2, PE: 1, PD: 1, CA: 1 },
    "4-5-1": { GOL: 1, LE: 1, ZAG: 2, LD: 1, VOL: 2, MEI: 3, CA: 1 },
    "4-2-3-1": { GOL: 1, LE: 1, ZAG: 2, LD: 1, VOL: 2, MEI: 1, PE: 1, PD: 1, CA: 1 },
    "5-4-1": { GOL: 1, LE: 1, ZAG: 3, LD: 1, VOL: 1, MEI: 3, CA: 1 }
  };
  
  const req = requisitos[esquema];
  const jogadoresValidos = team.jogadores.filter(j => !j.lesionado && !j.cartaoVermelho && j.cartoesAmarelos < 2);
  const obterOrdenados = (pos) => jogadoresValidos.filter(j => j.posicao === pos).sort((a, b) => b.forca - a.forca);
  
  const pools = {
    GOL: obterOrdenados("GOL"),
    LE: obterOrdenados("LE"),
    LD: obterOrdenados("LD"),
    ZAG: obterOrdenados("ZAG"),
    VOL: obterOrdenados("VOL"),
    MEI: obterOrdenados("MEI"),
    PE: obterOrdenados("PE"),
    PD: obterOrdenados("PD"),
    CA: obterOrdenados("CA")
  };
  
  const novosTitulares = [];
  
  for (const [pos, qtd] of Object.entries(req)) {
    for (let i = 0; i < qtd; i++) {
      if (pools[pos] && pools[pos].length > 0) {
        novosTitulares.push(pools[pos].shift().id);
      }
    }
  }
  
  if (novosTitulares.length < 11) {
    const restante = Object.values(pools)
      .flat()
      .filter(p => p.posicao !== "GOL")
      .sort((x, y) => y.forca - x.forca);
      
    while (novosTitulares.length < 11 && restante.length > 0) {
      novosTitulares.push(restante.shift().id);
    }
  }
  
  team.escalacao.titulares = novosTitulares.filter(Boolean);
  
  const titularesSet = new Set(novosTitulares);
  const sobrouParaReserva = team.jogadores
    .filter(j => !titularesSet.has(j.id) && !j.lesionado && !j.cartaoVermelho && j.cartoesAmarelos < 2)
    .sort((x, y) => y.forca - x.forca);
    
  team.escalacao.reservas = sobrouParaReserva.slice(0, 7).map(j => j.id);
}
