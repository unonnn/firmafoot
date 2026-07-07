const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir arquivos estáticos do frontend (na raiz do projeto)
app.use(express.static(path.join(__dirname)));

const DB_FOLDER = path.join(__dirname, 'database');
const SAVES_FOLDER = path.join(DB_FOLDER, 'saves');
const USERS_FILE = path.join(DB_FOLDER, 'users.json');

// Garante a existência das pastas do banco de dados
if (!fs.existsSync(DB_FOLDER)) {
  fs.mkdirSync(DB_FOLDER, { recursive: true });
}
if (!fs.existsSync(SAVES_FOLDER)) {
  fs.mkdirSync(SAVES_FOLDER, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Helper para ler usuários
function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

// Helper para salvar usuários
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// API: Google Auth e Criação de Contas
app.post('/api/auth/google', (req, res) => {
  const { credential, mockUsername, mockDisplayName } = req.body;
  let username = 'convidado_dev';
  let displayName = 'Treinador Convidado';

  if (credential && credential !== 'mock_token') {
    try {
      const parts = credential.split('.');
      if (parts.length >= 2) {
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const googleProfile = JSON.parse(decodedJson);

        if (googleProfile.email) {
          username = googleProfile.email.trim().toLowerCase();
          displayName = googleProfile.name || googleProfile.email.split('@')[0];
        }
      }
    } catch (err) {
      console.error('Erro ao decodificar token do Google:', err);
    }
  } else if (mockUsername) {
    username = mockUsername.trim().toLowerCase();
    displayName = mockDisplayName || username.split('@')[0];
  }

  const users = readUsers();
  let user = users.find(u => u.username === username);

  if (!user) {
    user = {
      username,
      password: 'oauth_managed',
      displayName,
      reputacao: 50,
      titulos: 0,
      saldo: 0,
      time: 'Nenhum'
    };
    users.push(user);
  } else {
    user.displayName = displayName;
  }

  saveUsers(users);

  return res.json({
    success: true,
    token: `token_${username}`,
    username,
    displayName
  });
});

// API: Carregar Save (GET)
app.get('/api/save', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer token_')) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const username = authHeader.replace('Bearer token_', '');
  const saveFilePath = path.join(SAVES_FOLDER, `${username}.json`);

  if (!fs.existsSync(saveFilePath)) {
    return res.status(404).json({ error: 'Save não encontrado na nuvem.' });
  }

  try {
    const saveData = fs.readFileSync(saveFilePath, 'utf8');
    return res.json(JSON.parse(saveData));
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao carregar o save.' });
  }
});

// API: Salvar Progresso na Nuvem (POST)
app.post('/api/save', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer token_')) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const username = authHeader.replace('Bearer token_', '');
  const saveFilePath = path.join(SAVES_FOLDER, `${username}.json`);

  try {
    const saveObj = req.body;
    fs.writeFileSync(saveFilePath, JSON.stringify(saveObj, null, 2), 'utf8');

    // Atualiza os dados do ranking
    const userTeam = saveObj.times.find(t => t.id === saveObj.timeUsuarioId);
    const titulosCount = saveObj.historicoCampeoes ? saveObj.historicoCampeoes.length : 0;

    if (userTeam) {
      const users = readUsers();
      const userIndex = users.findIndex(u => u.username === username);
      if (userIndex !== -1) {
        users[userIndex].reputacao = userTeam.rep;
        users[userIndex].titulos = titulosCount;
        users[userIndex].saldo = userTeam.saldo;
        users[userIndex].time = userTeam.nome;
        saveUsers(users);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao salvar na nuvem:', err);
    return res.status(500).json({ error: 'Erro ao salvar o progresso.' });
  }
});

// API: Ranking de Técnicos (Leaderboard)
app.get('/api/leaderboard', (req, res) => {
  const users = readUsers();
  const sorted = [...users].sort((a, b) => {
    if (b.titulos !== a.titulos) return b.titulos - a.titulos;
    if (b.reputacao !== a.reputacao) return b.reputacao - a.reputacao;
    return b.saldo - a.saldo;
  });

  return res.json(sorted.slice(0, 20));
});

// Rota coringa para servir o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log('=============================================');
  console.log(` Servidor de Produção Firmafoot Inicializado!`);
  console.log(` Acesse em seu navegador: http://localhost:${PORT}`);
  console.log('=============================================');
});
