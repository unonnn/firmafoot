import { obterClassificacaoOrdenada } from "../state.js";

export function renderClassification(estado, container) {
  const classificacao = obterClassificacaoOrdenada(estado.classificacao);
  
  const linhasHtml = classificacao.map((c, i) => {
    const posicao = i + 1;
    let posClass = "pos-normal";
    
    // Zonas do Brasileirão
    if (posicao <= 4) {
      posClass = "pos-g4"; // G4 - Libertadores direta
    } else if (posicao <= 6) {
      posClass = "pos-g6"; // G6 - Pré-Libertadores
    } else if (posicao >= 17) {
      posClass = "pos-z4"; // Z4 - Rebaixamento
    }
    
    const isUser = c.timeId === estado.timeUsuarioId ? "style='background: rgba(0, 240, 255, 0.08); font-weight: 700; color: #fff;'" : "";
    
    return `
      <tr ${isUser}>
        <td><div class="pos-box ${posClass}">${posicao}</div></td>
        <td style="font-weight: 600;">${c.nome} ${c.timeId === estado.timeUsuarioId ? "★" : ""}</td>
        <td style="text-align: center; font-weight: 700; color: var(--accent-color);">${c.pontos}</td>
        <td style="text-align: center;">${c.jogos}</td>
        <td style="text-align: center;">${c.vitorias}</td>
        <td style="text-align: center;">${c.empates}</td>
        <td style="text-align: center;">${c.derrotas}</td>
        <td style="text-align: center;">${c.golsPro}</td>
        <td style="text-align: center;">${c.golsContra}</td>
        <td style="text-align: center; font-weight: 600; color: ${c.saldoGols > 0 ? "var(--success-color)" : c.saldoGols < 0 ? "var(--danger-color)" : "var(--text-muted)"}">${c.saldoGols > 0 ? "+" : ""}${c.saldoGols}</td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="title-section">
      <span>Classificação da Série A</span>
      <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: normal;">Rodada ${estado.rodadaAtual - 1} de 38</span>
    </div>
    
    <div class="glass-card" style="padding: 16px;">
      <div class="table-responsive">
        <table class="custom-table classification-table">
          <thead>
            <tr>
              <th style="text-align: center;">Pos</th>
              <th>Clube</th>
              <th style="text-align: center;">P</th>
              <th style="text-align: center;">J</th>
              <th style="text-align: center;">V</th>
              <th style="text-align: center;">E</th>
              <th style="text-align: center;">D</th>
              <th style="text-align: center;">GP</th>
              <th style="text-align: center;">GC</th>
              <th style="text-align: center;">SG</th>
            </tr>
          </thead>
          <tbody>
            ${linhasHtml}
          </tbody>
        </table>
      </div>
      
      <!-- Legenda das Zonas -->
      <div style="display: flex; gap: 20px; margin-top: 20px; font-size: 0.8rem; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div class="pos-box pos-g4" style="margin: 0; width: 16px; height: 16px; font-size: 0.6rem;"></div>
          <span style="color: var(--text-muted);">Copa Libertadores (Fase de Grupos)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div class="pos-box pos-g6" style="margin: 0; width: 16px; height: 16px; font-size: 0.6rem;"></div>
          <span style="color: var(--text-muted);">Pré-Libertadores</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div class="pos-box pos-z4" style="margin: 0; width: 16px; height: 16px; font-size: 0.6rem;"></div>
          <span style="color: var(--text-muted);">Zona de Rebaixamento</span>
        </div>
      </div>
    </div>
  `;
}
