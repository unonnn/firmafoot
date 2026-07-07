# ⚽ Firmafoot - Career Football Manager

**Firmafoot** é um simulador de gerenciamento de futebol (Football Manager) moderno, rápido e imersivo rodando diretamente no navegador. O jogo foi desenvolvido utilizando uma arquitetura modular em **Pure HTML5, Vanilla CSS3 e JavaScript (ES6 Modules)**, com autenticação mandatória e persistência de dados 100% em **Nuvem (Cloud Saves)**, integrada com decodificação de JWTs no servidor.

Treine seu time do coração, controle as finanças da sua "firma", mude de posições táticas com arrastar-e-soltar, gerencie a moral de cada jogador, faça contratos comerciais e construa uma carreira de sucesso sincronizada de onde estiver!

---

## 🌟 Principais Funcionalidades

### 📋 1. Táticas Avançadas & Plantel Inteligente
* **Divisão de Elenco Visual:** Tabela do plantel dividida de forma clara em *Titulares*, *Reservas* e *Não Relacionados (Banco)*.
* **Arrastar e Soltar (Drag & Drop):** Posicione ou substitua jogadores arrastando-os diretamente sobre o campo tático virtual ou sobre a tabela.
* **Recomendações Dinâmicas:** Ao selecionar um jogador titular, as opções de reservas compatíveis da mesma posição acendem em verde pulsante na tabela. Ao clicar em um reserva, a posição tática sugerida pulsa no gramado.
* **Esquemas Táticos Diversos:** Suporte a múltiplas formações (`4-4-2`, `4-3-3`, `3-5-2`, `5-3-2`, `3-4-3`, `4-5-1`, `4-2-3-1`, `5-4-1`).

### 🏃 2. Sistema de Posições Específicas & Improvisações
* **Posições Reais:** Substituição de posições genéricas por posições do futebol moderno: Goleiro (`GOL`), Lateral Esquerdo (`LE`), Lateral Direito (`LD`), Zagueiro (`ZAG`), Volante (`VOL`), Meio-Campo (`MEI`), Ponta Esquerda (`PE`), Ponta Direita (`PD`) e Centroavante (`CA`).
* **Segunda Posição:** Atletas podem jogar em sua posição principal ou secundária.
* **Penalidades Realistas:** 
  * 0% de perda se jogar na posição principal.
  * 10% de perda se atuar na posição secundária.
  * 15% a 20% de perda por improvisações próximas (ex: laterais na ala oposta, volante como meia).
  * 30% por improvisações gerais (ex: zagueiro no ataque).
  * 80% se goleiro jogar na linha ou vice-versa.

### 💬 3. Interação e Gestão de Vestiário
* **Conversa com o Atleta:** Promova reuniões táticas e de grupo com seus jogadores:
  * *Elogiar:* Aumenta a **moral em +10**.
  * *Cobrar Foco:* Tem 50% de chance de motivar (**+12 moral**) e 50% de chatear (**-10 moral**).
  * *Dar Folga:* Recupera **+15% de energia física**, com perda de **-5 de moral** pelo ritmo.
* **Contratos:** Faça propostas de renovação contratual (luvas de R$ 10k aumentam o salário em 15% e deixam a **moral em 100%**).
* **Rescisões e Devoluções:** Rescinda contratos pagando multa de 5 semanas de salário, ou devolva jogadores emprestados sem custos adicionais.

### 🤝 4. Mercado de Transferências & Empréstimos
* **Navegação de Times:** Visualize elencos, salários, valores de passes e status contratuais de qualquer um dos 20 clubes da Série A.
* **Compra vs Empréstimo:** Faça ofertas de compra definitiva ou negocie empréstimos cobrindo 50% ou 100% do salário por 10 rodadas ou até o fim da temporada.
* **Lei do Ex (Cláusula de Empréstimo):** Atletas emprestados que enfrentam seus clubes de origem precisam de pagamento de uma **multa contratual de 2% de seu valor de mercado** para entrarem em campo. Se você não pagar, o jogador é vetado e deve ser retirado dos relacionados!

### 🚨 5. Carreira de Técnico (Sondagens & Demissão)
* **Confiança da Diretoria:** A diretoria avalia seu trabalho round a round de 0% a 100% com base nos resultados e nas expectativas da tabela (Z4 puxa a moral para baixo, G4 aumenta).
* **Demitido!:** Se a confiança cair abaixo de **15%**, você é demitido. O jogo exibe um painel de demissão oferecendo 3 contratos de times da metade inferior para recomeçar sua história.
* **Convites da CPU:** Se sua confiança for maior ou igual a **85%**, há uma chance de 8% a cada rodada de receber propostas de emprego na Inbox para assumir outros times maiores da liga!

### 💰 6. Patrocínios Reais & Uniforme Completo
* **5 Slots Comerciais:** Assine patrocínios para o *Material Esportivo*, *Master*, *Mangas*, *Costas* e *Calção*.
* **Geração Randômica:** No início de cada temporada, novas propostas comerciais aleatórias são geradas dependendo da reputação do clube.
* **Metas de Rodada:**
  * *Mangas:* Bônus se terminar a partida sem sofrer gols (Clean Sheet).
  * *Costas:* Bônus se marcar 3 ou mais gols no jogo.
  * *Calção:* Bônus por vitória.

---

## 💾 Persistência de Dados & Banco de Dados (Produção)

O **Firmafoot** suporta dois modos de persistência de dados de forma inteligente e automática:

1. **Modo Desenvolvimento (Sem Banco Externo):**
   * Se o servidor for iniciado sem a variável de ambiente `DATABASE_URL`, o sistema ativa automaticamente o fallback local baseado em arquivos JSON (dentro do diretório `database/`).
   * Perfeito para rodar localmente sem precisar configurar nada.
2. **Modo Produção (Banco Relacional PostgreSQL):**
   * Ao rodar em servidores de produção (ex: Render, Railway, Heroku), onde o sistema de arquivos é volátil e zera a cada reinicialização, o jogo conecta-se a um banco **PostgreSQL** via **Prisma ORM**.
   * Para ativar o banco, configure a variável de ambiente `DATABASE_URL` no seu painel de hospedagem e execute:
     ```bash
     npm run prisma:generate
     npm run prisma:push
     ```
   * Isso cria as tabelas de **User** (perfis autenticados via Google) e **Save** (contendo o JSON completo da carreira do usuário) garantindo que os saves nunca sejam apagados.

---

## 🛠️ Tecnologias Utilizadas
* **HTML5** & **CSS3** (Visual Glassmorphism, responsividade tática e animações em Keyframes).
* **JavaScript Moderno (ES6 Modules)** (Estrutura componentizada sem frameworks pesados, garantindo carregamento instantâneo).
* **Google Identity Services (OAuth / JWT)** (Autenticação unificada segura do Google).
* **Node.js (Express) & Prisma ORM** (Servidor HTTP de produção gerenciando rotas de login, saves em nuvem e ranking de técnicos).
* **PostgreSQL** (Banco de dados relacional oficial utilizado em produção).

---

## 🚀 Como Executar e Hospedar

### Pré-requisitos
* Um navegador web moderno (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
* [Node.js](https://nodejs.org/) (versão >= 16.0.0) instalado.

### Método 1: Execução Direta via NPX (Sem Clone)
Se o pacote estiver publicado no NPM, você e seus amigos podem rodar o jogo localmente de forma instantânea sem clonar o código, apenas executando:
```bash
npx firmafoot
```
*(Nota: Substitua pelo nome do seu pacote personalizado caso publique com outro nome).*

### Método 2: Executando o Código-Fonte
1. Clone este repositório:
   ```bash
   git clone https://github.com/unonnn/firmafoot.git
   cd firmafoot
   ```
2. **Método A (Recomendado - Node.js):** Instale as dependências e inicie o servidor local:
   ```bash
   npm install
   npm start
   ```
3. **Método B (PowerShell - Exclusivo Windows):** Inicie o script auxiliar de desenvolvimento:
   ```powershell
   ./server.ps1
   ```
4. Abra seu navegador em:
   👉 **[http://localhost:8080/](http://localhost:8080/)**

---

## 📦 Como Publicar no NPM (Registry)

Se você deseja disponibilizar o **Firmafoot** para ser executado via `npx` por qualquer pessoa:

1. Faça login na sua conta do NPM no terminal:
   ```bash
   npm login
   ```
2. Caso o nome de pacote `firmafoot` já esteja sendo usado por outro projeto no registro público, altere a propriedade `"name"` no seu [package.json](file:///C:/Users/rafael.ferraz/brasfoot-game/package.json) para um nome único (ex: `"firmafoot-app"` ou seu escopo `@seu-usuario/firmafoot`).
3. Publique o pacote na rede:
   ```bash
   npm publish --access public
   ```

---

## 📂 Estrutura de Arquivos do Projeto

```text
firmafoot/
├── index.html               # Estrutura principal e esqueleto de Modais
├── style.css                # Estilização Glassmorphism e posicionamentos táticos
├── server.js                # Servidor de Produção em Node.js (com Google Auth e Prisma SQL)
├── server.ps1               # Servidor de Desenvolvimento local em PowerShell
├── package.json             # Definição de dependências e scripts de inicialização
├── prisma/
│   └── schema.prisma        # Modelagem do banco de dados relacional para Produção
├── database/                # Banco de dados local baseado em JSON (Saves e Users)
├── js/
│   ├── main.js              # Controlador central do jogo, avanços e rodadas
│   ├── db.js                # Banco de dados de times, jogadores e atributos (com Tiers de Fornecedores)
│   ├── state.js             # Serialização e manipulação do Google Cloud Saves
│   ├── engine.js            # Motor físico de simulação de gols e cartões da partida
│   ├── utils.js             # Formatadores de moeda e auxiliares matemáticos
│   └── components/          # Telas modulares injetadas dinamicamente
│       ├── dashboard.js     # Mural de notícias, ranking global de técnicos e classificação
│       ├── tactics.js       # Campo tático de arraste e listagem de plantel
│       ├── market.js        # Painel de transferências, propostas e empréstimos
│       ├── finances.js      # Gerenciamento de ingressos, dívida, patrocinadores e 3 modelos SAF
│       ├── classification.js# Tabela de pontuação, saldo de gols e histórico
│       └── inbox.js         # Leitor de e-mails obrigatórios e ações comerciais
```

---

## 🏆 Créditos e Licença
Desenvolvido por fãs de jogos clássicos de gerenciamento de futebol. Código livre sob a licença MIT. 

Divirta-se subindo as divisões e organizando as finanças do seu clube rumo à glória eterna! ⚽🔥
