#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

// Requer o arquivo server.js para rodar o servidor Express
console.log('⚽ Inicializando o Firmafoot...');
require(path.join(__dirname, '../server.js'));

// Detecta o sistema operacional e abre o navegador automaticamente na porta 8080
const url = 'http://localhost:8080';
const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';

setTimeout(() => {
  console.log(`🚀 Abrindo o jogo no seu navegador: ${url}`);
  exec(`${start} ${url}`, (err) => {
    if (err) {
      console.log(`Acesse de forma manual em seu navegador: ${url}`);
    }
  });
}, 1500);
