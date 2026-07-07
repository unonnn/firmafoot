import { formatarDinheiro, formatarDinheiroCompleto } from "../utils.js";
import { salvarJogo } from "../state.js";

export function renderFinances(estado, container) {
  const userTeam = estado.times.find(t => t.id === estado.timeUsuarioId);
  
  // Garantir que propriedades existam
  if (userTeam.emprestimo === undefined) userTeam.emprestimo = 0;
  if (userTeam.saf === undefined) userTeam.saf = false;
  
  const drawScreen = () => {
    const precoIngresso = userTeam.estadioPrecoIngresso || 30;
    const fatorDemanda = userTeam.rep / 5;
    const fatorPreco = Math.pow(30 / precoIngresso, 1.2);
    
    // Se patrocinador master forçar comercialização de camisa poluída, torcida protesta e reduz 5% do público do estádio
    let fatorCamisaProtesto = 1.0;
    if (userTeam.patrocinioMaster && userTeam.patrocinioMaster.camisaLimpa === false) {
      fatorCamisaProtesto = 0.95;
    }

    const publicoEstimado = Math.min(
      userTeam.capacidade,
      Math.round(userTeam.capacidade * fatorDemanda * fatorPreco * fatorCamisaProtesto)
    );
    
    let receitaEstimada = publicoEstimado * precoIngresso;
    
    // Taxa SAF de 10% se for SAF
    let taxaSafEstimada = 0;
    if (userTeam.saf) {
      taxaSafEstimada = Math.round(receitaEstimada * 0.1);
      receitaEstimada -= taxaSafEstimada;
    }

    // Informações da camisa oficial de venda
    const temSponsorMaster = !!userTeam.patrocinioMaster;
    const camisaLimpa = temSponsorMaster ? userTeam.patrocinioMaster.camisaLimpa : true;
    
    container.innerHTML = `
      <div class="title-section">
        <span>Estádio & Finanças</span>
        <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: normal;">Gestão Econômica</span>
      </div>

      <div class="grid-2col">
        <!-- PAINEL DE CONTROLE FINANCEIRO -->
        <div class="glass-card" style="padding: 20px;">
          <div class="section-title">Controle de Ingressos</div>
          
          <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Preço do Ingresso atual:</span>
              <strong style="color: var(--success-color); font-size: 1.2rem;">R$ ${precoIngresso}</strong>
            </div>
            
            <div style="display: flex; gap: 10px;">
              <button id="btn-preco-menos" class="btn btn-secondary btn-sm" style="flex: 1;">- R$ 5</button>
              <button id="btn-preco-mais" class="btn btn-secondary btn-sm" style="flex: 1;">+ R$ 5</button>
            </div>
          </div>

          <div class="section-title">Projeção do Próximo Jogo em Casa</div>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between;">
              <span>Estádio:</span>
              <span>${userTeam.estadio}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Capacidade Máxima:</span>
              <span>${userTeam.capacidade.toLocaleString()} torcedores</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Público Estimado:</span>
              <span style="font-weight: 600;">${publicoEstimado.toLocaleString()} (${((publicoEstimado/userTeam.capacidade)*100).toFixed(0)}%)</span>
            </div>
            ${userTeam.patrocinioMaster && !userTeam.patrocinioMaster.camisaLimpa ? `
            <div style="display: flex; justify-content: space-between; color: var(--warning-color); font-size: 0.8rem;">
              <span>Queda por Protesto de Camisa (5%):</span>
              <span>Ativo</span>
            </div>
            ` : ""}
            ${userTeam.saf ? `
            <div style="display: flex; justify-content: space-between; color: var(--danger-color);">
              <span>Royalties SAF (10%):</span>
              <span>- ${formatarDinheiroCompleto(taxaSafEstimada)}</span>
            </div>
            ` : ""}
            <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
              <span>Receita Líquida Estimada:</span>
              <span style="color: var(--success-color); font-weight: 700;">${formatarDinheiroCompleto(receitaEstimada)}</span>
            </div>
          </div>
          
          <div class="section-title" style="margin-top: 25px;">Design da Camisa e Vendas</div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Modelo da Camisa Oficial:</span>
              ${camisaLimpa 
                ? "<span style='color: var(--success-color); font-weight: 700;'>Camisa Limpa (Fãs Adoram! 👕✨)</span>" 
                : "<span style='color: var(--danger-color); font-weight: 700;'>Logo Poluído (Fãs Protestam! 👕⚠️)</span>"
              }
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Fator de Venda de Merchandising:</span>
              <span>${camisaLimpa ? "100% (Normal)" : "75% (Perda de 25% nas Vendas)"}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Últimos Royalties de Camisas (Rodada):</span>
              <span style="color: var(--success-color); font-weight: 600;">
                ${userTeam.ultimaReceitaCamisas ? formatarDinheiroCompleto(userTeam.ultimaReceitaCamisas) : "R$ 0"}
              </span>
            </div>
          </div>
        </div>

        <!-- PAINEL DE EXPANSÃO, EMPRÉSTIMO E SAF -->
        <div class="glass-card" style="padding: 20px;">
          <div class="section-title">Contratos Comerciais</div>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem; margin-bottom: 20px;">
            <div style="border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 8px;">
              <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">PATROCINADOR MASTER</span>
              ${userTeam.patrocinioMaster 
                ? `<div style="display: flex; justify-content: space-between; margin-top: 4px;">
                     <strong>${userTeam.patrocinioMaster.nome}</strong>
                     <span style="color: var(--success-color); font-weight: 600;">+ ${formatarDinheiro(userTeam.patrocinioMaster.fixo)} / temp</span>
                   </div>`
                : "<div style='color: var(--danger-color); margin-top: 4px;'>Sem patrocinador master!</div>"
              }
            </div>
            <div style="border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 8px;">
              <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">MATERIAL ESPORTIVO</span>
              ${userTeam.patrocinioMaterial 
                ? `<div style="display: flex; justify-content: space-between; margin-top: 4px;">
                     <strong>${userTeam.patrocinioMaterial.nome}</strong>
                     <span style="color: var(--success-color); font-weight: 600;">
                       + ${formatarDinheiro(userTeam.patrocinioMaterial.fixo)} fixo | ${(userTeam.patrocinioMaterial.royalties * 100)}% roy
                     </span>
                   </div>`
                : "<div style='color: var(--danger-color); margin-top: 4px;'>Sem patrocinador de material!</div>"
              }
            </div>
            ${userTeam.patrociniosSecundarios ? `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 8px;">
              <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">MANGAS (SLEEVES)</span>
              <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                <strong>${userTeam.patrociniosSecundarios.sleeves.nome}</strong>
                <span style="color: var(--success-color); font-weight: 600;">+ ${formatarDinheiro(userTeam.patrociniosSecundarios.sleeves.fixo)} / temp</span>
              </div>
            </div>
            <div style="border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 8px;">
              <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">COSTAS (BACK)</span>
              <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                <strong>${userTeam.patrociniosSecundarios.back.nome}</strong>
                <span style="color: var(--success-color); font-weight: 600;">+ ${formatarDinheiro(userTeam.patrociniosSecundarios.back.fixo)} / temp</span>
              </div>
            </div>
            <div style="border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 8px;">
              <span style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">CALÇÃO (SHORTS)</span>
              <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                <strong>${userTeam.patrociniosSecundarios.shorts.nome}</strong>
                <span style="color: var(--success-color); font-weight: 600;">+ ${formatarDinheiro(userTeam.patrociniosSecundarios.shorts.fixo)} / temp</span>
              </div>
            </div>
            ` : ""}
          </div>

          <div class="section-title">Expansão do Estádio</div>
          <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Capacidade Atual:</span>
              <strong>${userTeam.capacidade.toLocaleString()} lugares</strong>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn btn-secondary btn-sm btn-expandir" data-qtd="5000" style="flex: 1;">+ 5.000 (R$ 7.5M)</button>
              <button class="btn btn-secondary btn-sm btn-expandir" data-qtd="10000" style="flex: 1;">+ 10.000 (R$ 15M)</button>
            </div>
          </div>

          <div class="section-title">Empréstimos Bancários</div>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Dívida Atual:</span>
              <strong style="color: ${userTeam.emprestimo > 0 ? "var(--danger-color)" : "var(--text-muted)"}">${formatarDinheiroCompleto(userTeam.emprestimo)}</strong>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 8px;">
              <button id="btn-tomar-emprestimo" class="btn btn-secondary btn-sm" style="flex: 1; border-color: rgba(var(--danger-color), 0.2);">Tomar R$ 5M</button>
              <button id="btn-pagar-emprestimo" class="btn btn-secondary btn-sm" style="flex: 1; border-color: rgba(var(--success-color), 0.2);" ${userTeam.emprestimo === 0 ? "disabled" : ""}>Pagar R$ 5M</button>
            </div>
          </div>

          <div class="section-title">Modelo de Gestão (SAF)</div>
          <div style="font-size: 0.9rem;">
            ${userTeam.saf 
              ? `<div style="background: rgba(var(--success-color-rgb), 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(var(--success-color-rgb), 0.2);">
                   <strong style="color: var(--success-color);">Clube Convertido em SAF 💼</strong>
                   <p style="margin-top: 5px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
                     Aporte de R$ 50M consolidado. 10% da bilheteria é repassada ao grupo investidor a cada rodada.
                   </p>
                 </div>`
              : `<div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border);">
                   <strong>Clube Associativo Comum</strong>
                   <p style="margin-top: 5px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px;">
                     Aporte de **R$ 50.000.000** em troca de **10% de royalties sobre bilheterias** permanentemente.
                   </p>
                   <button id="btn-converter-saf" class="btn btn-primary btn-sm" style="width: 100%;">Converter para SAF</button>
                 </div>`
            }
          </div>
        </div>
      </div>
    `;

    // Eventos Preço do Ingresso
    document.getElementById("btn-preco-menos").addEventListener("click", () => {
      if (precoIngresso <= 10) return;
      userTeam.estadioPrecoIngresso = precoIngresso - 5;
      salvarJogo(estado);
      drawScreen();
    });

    document.getElementById("btn-preco-mais").addEventListener("click", () => {
      if (precoIngresso >= 100) return;
      userTeam.estadioPrecoIngresso = precoIngresso + 5;
      salvarJogo(estado);
      drawScreen();
    });

    // Eventos Expansão
    document.querySelectorAll(".btn-expandir").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const qtd = parseInt(e.target.getAttribute("data-qtd"));
        const custo = qtd * 1500;
        
        if (userTeam.saldo < custo) {
          alert(`Saldo insuficiente! A expansão custa R$ ${custo / 1000000}M.`);
          return;
        }
        
        const conf = confirm(`Confirmar a ampliação do estádio em ${qtd.toLocaleString()} lugares por ${formatarDinheiroCompleto(custo)}?`);
        if (!conf) return;
        
        userTeam.saldo -= custo;
        userTeam.capacidade += qtd;
        
        salvarJogo(estado);
        document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
        drawScreen();
      });
    });

    // Eventos Empréstimo
    document.getElementById("btn-tomar-emprestimo").addEventListener("click", () => {
      const maxEmprestimo = 20000000;
      if (userTeam.emprestimo >= maxEmprestimo) {
        alert("Limite de empréstimo bancário atingido!");
        return;
      }
      
      const conf = confirm("Deseja contrair um empréstimo de R$ 5.000.000 com taxa de 5% por rodada?");
      if (!conf) return;
      
      userTeam.emprestimo += 5000000;
      userTeam.saldo += 5000000;
      
      salvarJogo(estado);
      document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
      drawScreen();
    });

    document.getElementById("btn-pagar-emprestimo").addEventListener("click", () => {
      if (userTeam.emprestimo <= 0) return;
      
      const valorPagamento = Math.min(5000000, userTeam.emprestimo);
      if (userTeam.saldo < valorPagamento) {
        alert("Saldo insuficiente para efetuar o pagamento da dívida!");
        return;
      }
      
      const conf = confirm(`Deseja amortizar ${formatarDinheiroCompleto(valorPagamento)} do seu empréstimo devedor?`);
      if (!conf) return;
      
      userTeam.saldo -= valorPagamento;
      userTeam.emprestimo -= valorPagamento;
      
      salvarJogo(estado);
      document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
      drawScreen();
    });

    // Evento Converter SAF
    const btnSaf = document.getElementById("btn-converter-saf");
    if (btnSaf) {
      btnSaf.addEventListener("click", () => {
        const conf = confirm("ATENÇÃO: Você deseja converter o clube em SAF?\n\n• Aporte de Capital: +R$ 50.000.000 imediatos.\n• Taxa de Bilheteria: -10% de toda bilheteria repassada permanentemente.\n\nEsta ação é irreversível!");
        if (!conf) return;
        
        userTeam.saf = true;
        userTeam.saldo += 50000000;
        
        salvarJogo(estado);
        document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
        drawScreen();
      });
    }
  };

  drawScreen();
}
