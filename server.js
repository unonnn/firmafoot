const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir arquivos estáticos do frontend (na raiz do projeto)
app.use(express.static(path.join(__dirname)));

// Inicialização condicional do Prisma
let prisma = null;
const useDatabase = !!process.env.DATABASE_URL;

if (useDatabase) {
  try {
    prisma = new PrismaClient();
    console.log('✅ Banco de Dados Relacional (PostgreSQL via Prisma) Ativado!');
  } catch (err) {
    console.error('❌ Falha ao inicializar o Prisma Client. Usando fallback de arquivos.', err);
    prisma = null;
  }
} else {
  console.log('⚠️ DATABASE_URL não definida. Usando fallback local baseado em arquivos JSON (database/).');
}

// Configurações fallback de arquivos
const DB_FOLDER = path.join(__dirname, 'database');
const SAVES_FOLDER = path.join(DB_FOLDER, 'saves');
const USERS_FILE = path.join(DB_FOLDER, 'users.json');

if (!useDatabase) {
  if (!fs.existsSync(DB_FOLDER)) fs.mkdirSync(DB_FOLDER, { recursive: true });
  if (!fs.existsSync(SAVES_FOLDER)) fs.mkdirSync(SAVES_FOLDER, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Helpers do fallback de arquivos
function readUsersLocal() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
}

function saveUsersLocal(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// API: Google Auth e Criação de Contas
app.post('/api/auth/google', async (req, res) => {
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

  if (useDatabase && prisma) {
    try {
      const user = await prisma.user.upsert({
        where: { username },
        update: { displayName },
        create: {
          username,
          displayName,
          reputacao: 50,
          titulos: 0,
          saldo: 0,
          time: 'Nenhum'
        }
      });
      return res.json({
        success: true,
        token: `token_${user.username}`,
        username: user.username,
        displayName: user.displayName
      });
    } catch (err) {
      console.error('Erro no cadastro do banco relacional:', err);
    }
  }

  // Fallback local
  const users = readUsersLocal();
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

  saveUsersLocal(users);

  return res.json({
    success: true,
    token: `token_${username}`,
    username,
    displayName
  });
});

// API: Carregar Save (GET)
app.get('/api/save', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer token_')) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const username = authHeader.replace('Bearer token_', '');

  if (useDatabase && prisma) {
    try {
      const saveRecord = await prisma.save.findUnique({
        where: { username }
      });
      if (saveRecord && saveRecord.saveData) {
        return res.json(saveRecord.saveData);
      }
      return res.status(404).json({ error: 'Save não encontrado no banco.' });
    } catch (err) {
      console.error('Erro ao buscar save no banco:', err);
    }
  }

  // Fallback local
  const saveFilePath = path.join(SAVES_FOLDER, `${username}.json`);
  if (!fs.existsSync(saveFilePath)) {
    return res.status(404).json({ error: 'Save não encontrado localmente.' });
  }

  try {
    const saveData = fs.readFileSync(saveFilePath, 'utf8');
    return res.json(JSON.parse(saveData));
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao carregar o save local.' });
  }
});

// API: Salvar Progresso na Nuvem (POST)
app.post('/api/save', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer token_')) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const username = authHeader.replace('Bearer token_', '');
  const saveObj = req.body;

  const userTeam = saveObj.times.find(t => t.id === saveObj.timeUsuarioId);
  const titulosCount = saveObj.historicoCampeoes ? saveObj.historicoCampeoes.length : 0;

  if (useDatabase && prisma) {
    try {
      await prisma.save.upsert({
        where: { username },
        update: { saveData: saveObj },
        create: { username, saveData: saveObj }
      });

      if (userTeam) {
        await prisma.user.update({
          where: { username },
          data: {
            reputacao: userTeam.rep,
            titulos: titulosCount,
            saldo: userTeam.saldo,
            time: userTeam.nome
          }
        });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('Erro ao salvar no banco relacional:', err);
    }
  }

  // Fallback local
  const saveFilePath = path.join(SAVES_FOLDER, `${username}.json`);
  try {
    fs.writeFileSync(saveFilePath, JSON.stringify(saveObj, null, 2), 'utf8');

    if (userTeam) {
      const users = readUsersLocal();
      const userIndex = users.findIndex(u => u.username === username);
      if (userIndex !== -1) {
        users[userIndex].reputacao = userTeam.rep;
        users[userIndex].titulos = titulosCount;
        users[userIndex].saldo = userTeam.saldo;
        users[userIndex].time = userTeam.nome;
        saveUsersLocal(users);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao salvar no arquivo local:', err);
    return res.status(500).json({ error: 'Erro ao salvar o progresso.' });
  }
});

// API: Ranking de Técnicos (Leaderboard)
app.get('/api/leaderboard', async (req, res) => {
  if (useDatabase && prisma) {
    try {
      const dbUsers = await prisma.user.findMany({
        take: 20,
        orderBy: [
          { titulos: 'desc' },
          { reputacao: 'desc' },
          { saldo: 'desc' }
        ]
      });
      const formatted = dbUsers.map(u => ({
        username: u.username,
        displayName: u.displayName,
        reputacao: u.reputacao,
        titulos: u.titulos,
        saldo: Number(u.saldo),
        time: u.time
      }));
      return res.json(formatted);
    } catch (err) {
      console.error('Erro ao buscar ranking no banco:', err);
    }
  }

  // Fallback local
  const users = readUsersLocal();
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
  console.log(` Modo: ${useDatabase ? 'PostgreSQL (Prisma)' : 'Fallback Arquivos JSON'}`);
  console.log(` Acesse em seu navegador: http://localhost:${PORT}`);
  console.log('=============================================');
});
