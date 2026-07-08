import { formatarDinheiro } from "../utils.js";

let mensagemAtivaId = null;

export function renderInbox(estado, container, callbackAcao) {
  if (!estado.mensagens) {
    estado.mensagens = [];
  }

  if (estado.mensagens.length === 0) {
    estado.mensagens.push({
      id: "msg_boas_vindas",
      remetente: "Presidente do Clube",
      assunto: "Bem-vindo ao clube!",
      conteudo: `Prezado técnico,

É com grande satisfação que lhe damos as boas-vindas ao comando do nosso clube. A diretoria e os torcedores estão ansiosos pelo início do Campeonato Brasileiro.

Nosso principal objetivo nesta temporada é consolidar uma equipe competitiva e manter as finanças sob controle. 

Desejamos muito sucesso na sua nova jornada!

Atenciosamente,
A Diretoria.`,
      lida: false,
      obrigatoria: false,
      data: "Rodada 0",
      tipoAcao: null,
      acaoConcluida: true
    });

    estado.mensagens.push({
      id: "msg_patrocinio_inicial",
      remetente: "Diretoria Comercial",
      assunto: "CONTRATOS COMERCIAIS: Assinatura de Patrocínio Obrigatória",
      conteudo: `Prezado técnico,

Para darmos início à temporada de ${estado.ano}, precisamos assinar os contratos de **Fornecimento de Material Esportivo** e **Patrocínio Master**.

Temos propostas interessantes na mesa de marcas globais e nacionais. Lembre-se: alguns patrocinadores pagam mais fixo, mas poluem nossa camisa com logos gigantes, o que reduz em 25% a venda de produtos oficiais e afasta parte do público do estádio. Outros oferecem a opção de 'Camisa Limpa' (torcida adora!).

Você deve escolher nossas parcerias antes de jogar a primeira rodada. Clique no botão abaixo para avaliar e assinar as propostas.`,
      lida: false,
      obrigatoria: true,
      data: "Rodada 0",
      tipoAcao: "patrocinio",
      acaoConcluida: false
    });
  }

  const drawScreen = () => {
    const msgs = [...estado.mensagens];
    const pendentesCount = msgs.filter(m => m.obrigatoria && !m.acaoConcluida).length;
    const badge = document.getElementById("inbox-badge");
    if (badge) {
      if (pendentesCount > 0) {
        badge.innerText = pendentesCount;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }

    const msgSelecionada = msgs.find(m => m.id === mensagemAtivaId) || null;

    container.innerHTML = `
      <div class="title-section">
        <span>Caixa de Entrada (Inbox)</span>
        <span style="font-size: 0.95rem; color: var(--text-muted); font-weight: normal;">Notificações e Decisões</span>
      </div>

      <div class="grid-2col" style="grid-template-columns: 350px 1fr; height: 500px; gap: 20px;">
        <!-- LISTA DE EMAILS -->
        <div class="glass-card" style="padding: 12px; display: flex; flex-direction: column; overflow-y: auto; gap: 10px; height: 100%;">
          ${msgs.map(m => {
            const isUnread = !m.lida ? "font-weight: 700; border-left-color: var(--accent-color);" : "";
            const isSelected = m.id === mensagemAtivaId ? "background: rgba(255,255,255,0.06); border-color: rgba(var(--accent-color-rgb), 0.3);" : "";
            const isActionRequired = m.obrigatoria && !m.acaoConcluida;
            const badgeAcao = isActionRequired ? "<span style='background: var(--danger-color); color: #fff; font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; font-weight: 700; margin-left: 5px;'>AÇÃO REQUERIDA</span>" : "";
            
            return `
              <div class="email-item" data-id="${m.id}" style="background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-left: 4px solid rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; cursor: pointer; transition: var(--transition-smooth); ${isUnread} ${isSelected}">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">
                  <span>${m.remetente}</span>
                  <span>${m.data}</span>
                </div>
                <div style="font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">
                  ${m.assunto}
                </div>
                <div style="display: flex; align-items: center; margin-top: 5px;">
                  ${badgeAcao}
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <!-- LEITOR DE EMAIL -->
        <div class="glass-card" style="padding: 24px; display: flex; flex-direction: column; height: 100%;">
          ${msgSelecionada ? `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px;">
                <span>De: <strong>${msgSelecionada.remetente}</strong></span>
                <span>Data: ${msgSelecionada.data}</span>
              </div>
              <h3 style="font-size: 1.25rem; color: #fff; font-weight: 700;">${msgSelecionada.assunto}</h3>
            </div>
            
            <div style="flex-grow: 1; overflow-y: auto; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; color: var(--text-main); padding-right: 8px;">
${msgSelecionada.conteudo}
            </div>

            <!-- Painel de Ações do E-mail -->
            ${msgSelecionada.obrigatoria && !msgSelecionada.acaoConcluida ? `
              <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; margin-top: 15px; display: flex; justify-content: flex-end;">
                ${msgSelecionada.tipoAcao === "patrocinio" ? `
                  <button id="btn-inbox-acao-patrocinio" class="btn btn-primary btn-pulse">Ver Propostas de Patrocínio</button>
                ` : ""}
                ${msgSelecionada.tipoAcao === "proposta_venda" ? `
                  <div style="display:flex; gap:12px; width:100%;">
                    <button id="btn-inbox-venda-recusar" class="btn btn-secondary btn-sm" style="flex:1;">Recusar Proposta</button>
                    <button id="btn-inbox-venda-aceitar" class="btn btn-primary btn-sm" style="flex:1;">Aceitar Proposta</button>
                  </div>
                ` : ""}
                ${msgSelecionada.tipoAcao === "proposta_emprego" ? `
                  <div style="display:flex; gap:12px; width:100%;">
                    <button id="btn-inbox-emprego-recusar" class="btn btn-secondary btn-sm" style="flex:1;">Recusar Proposta</button>
                    <button id="btn-inbox-emprego-aceitar" class="btn btn-primary btn-sm" style="flex:1;">Aceitar Cargo de Técnico</button>
                  </div>
                ` : ""}
              </div>
            ` : msgSelecionada.obrigatoria && msgSelecionada.acaoConcluida ? `
              <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; margin-top: 15px; color: var(--success-color); font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                ✔ Ação concluída e registrada.
              </div>
            ` : ""}
          ` : `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
              <span style="font-size: 3rem; margin-bottom: 10px;">✉</span>
              <p>Selecione uma mensagem na barra lateral para ler.</p>
            </div>
          `}
        </div>
      </div>
    `;

    // Event Listeners
    container.querySelectorAll(".email-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        mensagemAtivaId = id;
        
        const m = estado.mensagens.find(msg => msg.id === id);
        if (m) m.lida = true;
        
        drawScreen();
      });
    });

    const btnAcaoPatrocinio = document.getElementById("btn-inbox-acao-patrocinio");
    if (btnAcaoPatrocinio) {
      btnAcaoPatrocinio.addEventListener("click", () => {
        if (callbackAcao) {
          callbackAcao("patrocinio", () => {
            const m = estado.mensagens.find(msg => msg.tipoAcao === "patrocinio");
            if (m) {
              m.acaoConcluida = true;
              m.lida = true;
            }
            drawScreen();
          });
        }
      });
    }

    const btnVendaAceitar = document.getElementById("btn-inbox-venda-aceitar");
    const btnVendaRecusar = document.getElementById("btn-inbox-venda-recusar");
    if (btnVendaAceitar && btnVendaRecusar) {
      btnVendaAceitar.addEventListener("click", () => {
        if (callbackAcao) {
          callbackAcao("venda_aceitar", msgSelecionada.dadosExtra, () => {
            msgSelecionada.acaoConcluida = true;
            msgSelecionada.lida = true;
            drawScreen();
          });
        }
      });
      btnVendaRecusar.addEventListener("click", () => {
        if (callbackAcao) {
          callbackAcao("venda_recusar", msgSelecionada.dadosExtra, () => {
            msgSelecionada.acaoConcluida = true;
            msgSelecionada.lida = true;
            drawScreen();
          });
        }
      });
    }

    const btnEmpregoAceitar = document.getElementById("btn-inbox-emprego-aceitar");
    const btnEmpregoRecusar = document.getElementById("btn-inbox-emprego-recusar");
    if (btnEmpregoAceitar && btnEmpregoRecusar) {
      btnEmpregoAceitar.addEventListener("click", () => {
        if (callbackAcao) {
          callbackAcao("emprego_aceitar", msgSelecionada.dadosExtra, () => {
            msgSelecionada.acaoConcluida = true;
            msgSelecionada.lida = true;
            drawScreen();
          });
        }
      });
      btnEmpregoRecusar.addEventListener("click", () => {
        if (callbackAcao) {
          callbackAcao("emprego_recusar", msgSelecionada.dadosExtra, () => {
            msgSelecionada.acaoConcluida = true;
            msgSelecionada.lida = true;
            drawScreen();
          });
        }
      });
    }
  };

  drawScreen();
}
