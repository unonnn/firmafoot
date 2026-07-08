import { formatarDinheiroCompleto } from "../utils.js";
import { obterClassificacaoOrdenada } from "../state.js";

export function renderDashboard(estado, container) {
  const userTeam = estado.times.find(t => t.id === estado.timeUsuarioId);
  const classificacao = obterClassificacaoOrdenada(estado.classificacao);
  const userPos = classificacao.findIndex(c => c.timeId === estado.timeUsuarioId) + 1;
  
  // Próximo Jogo
  const rodada = estado.calendario[estado.rodadaAtual - 1];
  const proximoJogo = rodada.jogos.find(
    j => j.homeTeamId === estado.timeUsuarioId || j.awayTeamId === estado.timeUsuarioId
  );
  
  const adversarioId = proximoJogo.homeTeamId === estado.timeUsuarioId ? proximoJogo.awayTeamId : proximoJogo.homeTeamId;
  const adversario = estado.times.find(t => t.id === adversarioId);
  const mando = proximoJogo.homeTeamId === estado.timeUsuarioId ? "Casa" : "Fora";
  
  // Top 5 Classificação Rápida
  const top5Html = classificacao.slice(0, 5).map((c, i) => {
    const timeInfo = estado.times.find(t => t.id === c.timeId);
    const isUser = c.timeId === estado.timeUsuarioId ? "style='font-weight: 800; color: var(--accent-color);'" : "";
    return `
      <tr ${isUser}>
        <td style="text-align: center;">${i + 1}</td>
        <td>${c.nome}</td>
        <td style="text-align: center;">${c.pontos}</td>
        <td style="text-align: center;">${c.jogos}</td>
      </tr>
    `;
  }).join("");

  // Top 5 Artilheiros
  // Compilar gols de todos os jogadores de todos os times
  const todosJogadores = [];
  estado.times.forEach(t => {
    t.jogadores.forEach(j => {
      if (j.gols > 0) {
        todosJogadores.push({ nome: j.nome, time: t.nome, gols: j.gols, posicao: j.posicao });
      }
    });
  });
  // Inclui também os gols do mercado/livres se houver
  estado.mercadoTransferencias.forEach(j => {
    if (j.gols > 0) {
      todosJogadores.push({ nome: j.nome, time: "Sem Clube", gols: j.gols, posicao: j.posicao });
    }
  });
  
  const artilheirosOrdenados = todosJogadores.sort((a, b) => b.gols - a.gols).slice(0, 5);
  const artilheirosHtml = artilheirosOrdenados.length > 0 
    ? artilheirosOrdenados.map((art, i) => `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td>${art.nome} (${art.posicao})</td>
          <td>${art.time}</td>
          <td style="text-align: center; font-weight: 700; color: var(--accent-color);">${art.gols}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Nenhum gol marcado ainda.</td></tr>`;

  // Força média do elenco do usuário
  const somaForca = userTeam.jogadores.reduce((acc, curr) => acc + curr.forca, 0);
  const forcaMedia = (somaForca / userTeam.jogadores.length).toFixed(1);

  container.innerHTML = `
    <div class="title-section">
      <span>Painel do Técnico</span>
      <span style="font-size: 0.9rem; color: var(--text-muted);">Estilo: ${userTeam.escalacao.esquema}</span>
    </div>

    <!-- Grid de Informações Rápidas -->
    <div class="stats-cards-grid">
      <div class="stat-card-box">
        <span>Sua Posição</span>
        <span style="color: var(--accent-color);">${userPos}º Lugar</span>
      </div>
      <div class="stat-card-box">
        <span>Força Média</span>
        <span>${forcaMedia}</span>
      </div>
      <div class="stat-card-box">
        <span>Jogadores no Elenco</span>
        <span>${userTeam.jogadores.length} / 25</span>
      </div>
      <div class="stat-card-box">
        <span>Estádio (Capacidade)</span>
        <span style="font-size: 1.1rem; white-space: nowrap; margin-top: 8px;">
          ${userTeam.estadio} (${(userTeam.capacidade / 1000).toFixed(0)}k)
        </span>
      </div>
    </div>

    <div class="grid-3col">
      <!-- Próximo Confronto Detalhado -->
      <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="section-title">Próximo Adversário</div>
          <div style="display: flex; flex-direction: column; align-items: center; margin: 20px 0;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: ${adversario.corPrimaria}; border: 2px solid ${adversario.corSecundaria}; margin-bottom: 10px;"></div>
            <h3 style="font-size: 1.4rem; font-weight: 700;">${adversario.nome}</h3>
            <span style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Mandante: ${mando}</span>
          </div>
          <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Reputação rival:</span>
              <span style="color: var(--warning-color);">${"★".repeat(adversario.rep)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Estádio da partida:</span>
              <span>${mando === "Casa" ? userTeam.estadio : adversario.estadio}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela Rápida de Classificação -->
      <div class="glass-card" style="padding: 16px;">
        <div class="section-title">Classificação (Top 5)</div>
        <div class="table-responsive">
          <table class="custom-table" style="font-size: 0.85rem;">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">Pos</th>
                <th>Time</th>
                <th style="text-align: center;">P</th>
                <th style="text-align: center;">J</th>
              </tr>
            </thead>
            <tbody>
              ${top5Html}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabela de Artilheiros -->
      <div class="glass-card" style="padding: 16px;">
        <div class="section-title">Artilharia da Liga</div>
        <div class="table-responsive">
          <table class="custom-table" style="font-size: 0.85rem;">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>Nome</th>
                <th>Clube</th>
                <th style="text-align: center;">G</th>
              </tr>
            </thead>
            <tbody>
              ${artilheirosHtml}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Seção de Notícias / Histórico -->
    <div class="glass-card" style="margin-top: 20px; padding: 20px;">
      <div class="section-title">Informativo da Liga</div>
      <div style="font-size: 0.95rem; line-height: 1.6;">
        <p><strong>Temporada de ${estado.ano} iniciada!</strong> As principais equipes brasileiras estão prontas para a batalha pelo título nacional. A diretoria do <strong>${userTeam.nome}</strong> espera um bom desempenho tático sob o seu comando.</p>
        <p style="margin-top: 10px; color: var(--text-muted);">Dica: Visite a aba <strong>Plantel & Táticas</strong> para definir sua escalação de titulares e reservas antes de clicar em <strong>JOGAR PARTIDA</strong>.</p>
      </div>
    </div>

    <!-- Ranking Global de Técnicos (Firmafoot Cloud) -->
    <div class="glass-card" style="margin-top: 24px; padding: 20px;">
      <div class="section-title" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span>🏆 Ranking Global de Técnicos (Firmafoot Cloud)</span>
        <button id="btn-atualizar-ranking" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;">🔄 Atualizar</button>
      </div>
      <div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
        <table class="custom-table" style="font-size: 0.88rem;">
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">Pos</th>
              <th>Treinador</th>
              <th>Clube Atual</th>
              <th style="text-align: center;">Títulos Conquistados</th>
              <th style="text-align: center;">Reputação do Clube</th>
              <th style="text-align: center;">Saldo em Caixa</th>
            </tr>
          </thead>
          <tbody id="ranking-global-tbody">
            <tr>
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">
                Carregando dados do ranking...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Carrega os dados do Ranking Global de forma assíncrona
  setTimeout(async () => {
    const tbody = document.getElementById("ranking-global-tbody");
    const btnRecarregar = document.getElementById("btn-atualizar-ranking");
    
    const carregarRanking = async () => {
      try {
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 15px;">Atualizando ranking...</td></tr>`;
        }
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const list = await res.json();
          if (tbody) {
            if (list.length === 0) {
              tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 15px;">Nenhum treinador no ranking ainda. Conecte sua conta para começar!</td></tr>`;
            } else {
              tbody.innerHTML = list.map((user, index) => {
                const isCurrentUser = user.username === localStorage.getItem("firmafoot_auth_username") 
                  ? "style='background: rgba(0, 240, 255, 0.04); font-weight: 700; border-left: 3px solid var(--accent-color);'" 
                  : "";
                
                const saldoFormatado = user.saldo >= 1000000 
                  ? `R$ ${(user.saldo / 1000000).toFixed(1).replace(".", ",")}M` 
                  : `R$ ${(user.saldo / 1000).toFixed(0)}k`;
                
                const estrelas = "★".repeat(Math.ceil(user.reputacao / 20));

                return `
                  <tr ${isCurrentUser}>
                    <td style="text-align: center;"><strong>${index + 1}º</strong></td>
                    <td style="color: #fff;">${user.username}</td>
                    <td>${user.time || "Nenhum"}</td>
                    <td style="text-align: center; color: var(--warning-color); font-weight: 700;">🏆 ${user.titulos}</td>
                    <td style="text-align: center; color: var(--warning-color);">${estrelas}</td>
                    <td style="text-align: center; color: var(--success-color); font-weight: 700;">${saldoFormatado}</td>
                  </tr>
                `;
              }).join("");
            }
          }
        }
      } catch (err) {
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger-color); padding: 15px;">Erro ao carregar o ranking global.</td></tr>`;
        }
      }
    };

    if (btnRecarregar) {
      btnRecarregar.addEventListener("click", carregarRanking);
    }
    carregarRanking();
  }, 100);
}
