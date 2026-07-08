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
    
    // Taxa SAF se for SAF
    let taxaSafEstimada = 0;
    if (userTeam.saf) {
      let percent = 0.10;
      if (userTeam.saf === "textor") percent = 0.15;
      else if (userTeam.saf === "city") percent = 0.10;
      else if (userTeam.saf === "minoritaria") percent = 0.04;
      
      taxaSafEstimada = Math.round(receitaEstimada * percent);
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
            <div style="display: flex; justify-content: space-between; color: var(--danger-color); font-size: 0.82rem; margin-top: 4px;">
              <span>Royalties SAF (${userTeam.saf === "textor" ? "15%" : userTeam.saf === "minoritaria" ? "4%" : "10%"}):</span>
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
                   <strong style="color: var(--success-color);">
                     SAF Ativa: ${userTeam.saf === "textor" ? "Modelo Imperial (Estilo Textor) 💼" : userTeam.saf === "city" ? "Modelo Grupo Global (Estilo City) 🌍" : "Modelo Parcial (SAF Minoritária) 🤝"}
                   </strong>
                   <p style="margin-top: 5px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.45;">
                     ${userTeam.saf === "textor" 
                       ? "Aporte de R$ 60M consolidado. 50% das dívidas amortizadas. Royalties: 15% das receitas de jogos repassadas ao investidor." 
                       : userTeam.saf === "city" 
                         ? "Aporte de R$ 40M consolidado. Vantagens: 50% de desconto nos olheiros, 10% de desconto em compras do mercado. Royalties: 10% de taxa." 
                         : "Aporte de R$ 15M consolidado. Vantagem: Controle político mantido pela associação. Royalties mínimos: 4% de taxa."}
                   </p>
                 </div>`
              : `<div style="display: flex; flex-direction: column; gap: 12px;">
                   <!-- Modelo Textor -->
                   <div style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border);">
                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                       <strong style="color: #fff; font-size: 0.85rem;">Modelo Imperial (Estilo Textor)</strong>
                       <span style="color: var(--success-color); font-weight: 700; font-size: 0.8rem;">+ R$ 60M</span>
                     </div>
                     <p style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.35; margin-bottom: 8px;">
                       Venda do controle total. Amortiza **50% das dívidas bancárias** atuais. Investidor exige **15% de royalties** de bilheterias.
                     </p>
                     <button id="btn-saf-textor" class="btn btn-primary btn-sm" style="width: 100%; font-size: 0.75rem; padding: 4px 8px;">Adotar Modelo Textor</button>
                   </div>

                   <!-- Modelo Grupo City -->
                   <div style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border);">
                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                       <strong style="color: #fff; font-size: 0.85rem;">Modelo Grupo Global (Estilo City)</strong>
                       <span style="color: var(--success-color); font-weight: 700; font-size: 0.8rem;">+ R$ 40M</span>
                     </div>
                     <p style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.35; margin-bottom: 8px;">
                       Parceria de rede. **50% de desconto nos olheiros/scouts** e **10% de desconto em transferências**. Investidor exige **10% de royalties**.
                     </p>
                     <button id="btn-saf-city" class="btn btn-primary btn-sm" style="width: 100%; font-size: 0.75rem; padding: 4px 8px;">Adotar Modelo Grupo City</button>
                   </div>

                   <!-- Modelo Minoritária -->
                   <div style="background: rgba(255,255,255,0.01); padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border);">
                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                       <strong style="color: #fff; font-size: 0.85rem;">Modelo Parcial (SAF Minoritária)</strong>
                       <span style="color: var(--success-color); font-weight: 700; font-size: 0.8rem;">+ R$ 15M</span>
                     </div>
                     <p style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.35; margin-bottom: 8px;">
                       Venda parcial sem perda de controle da associação tradicional do clube. Investidor exige apenas **4% de royalties**.
                     </p>
                     <button id="btn-saf-minoritaria" class="btn btn-primary btn-sm" style="width: 100%; font-size: 0.75rem; padding: 4px 8px;">Adotar Modelo Minoritário</button>
                   </div>
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

    // Eventos Converter SAF
    const btnTextor = document.getElementById("btn-saf-textor");
    const btnCity = document.getElementById("btn-saf-city");
    const btnMinoritaria = document.getElementById("btn-saf-minoritaria");

    if (btnTextor) {
      btnTextor.addEventListener("click", () => {
        const conf = confirm("Deseja adotar o Modelo Imperial (Estilo Textor)?\n\n• Aporte de Capital: +R$ 60.000.000 em caixa.\n• Dívida Bancária: Reduzida em 50%.\n• Royalties de Bilheteria: -15% permanentemente.\n\nEsta ação é irreversível!");
        if (!conf) return;
        userTeam.saf = "textor";
        userTeam.saldo += 60000000;
        if (userTeam.emprestimo > 0) {
          userTeam.emprestimo = Math.round(userTeam.emprestimo * 0.5);
        }
        salvarJogo(estado);
        document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
        drawScreen();
      });
    }

    if (btnCity) {
      btnCity.addEventListener("click", () => {
        const conf = confirm("Deseja adotar o Modelo Grupo Global (Estilo City)?\n\n• Aporte de Capital: +R$ 40.000.000 em caixa.\n• Rede de Scouts: 50% de desconto nos olheiros e 10% nas compras de jogadores.\n• Royalties de Bilheteria: -10% permanentemente.\n\nEsta ação é irreversível!");
        if (!conf) return;
        userTeam.saf = "city";
        userTeam.saldo += 40000000;
        salvarJogo(estado);
        document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
        drawScreen();
      });
    }

    if (btnMinoritaria) {
      btnMinoritaria.addEventListener("click", () => {
        const conf = confirm("Deseja adotar o Modelo Parcial (SAF Minoritária)?\n\n• Aporte de Capital: +R$ 15.000.000 em caixa.\n• Royalties de Bilheteria: -4% permanentemente (associação tradicional retém o controle).\n\nEsta ação é irreversível!");
        if (!conf) return;
        userTeam.saf = "minoritaria";
        userTeam.saldo += 15000000;
        salvarJogo(estado);
        document.getElementById("user-club-balance").innerText = formatarDinheiro(userTeam.saldo);
        drawScreen();
      });
    }
  };

  drawScreen();
}
