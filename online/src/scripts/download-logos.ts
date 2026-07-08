import * as fs from 'fs';
import * as path from 'path';

const urls = [
  // Serie A
  "https://www.transfermarkt.com.br/se-palmeiras-sao-paulo/kader/verein/1023/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/flamengo-rio-de-janeiro/kader/verein/614/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/ec-cruzeiro-belo-horizonte/kader/verein/609/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/corinthians-sao-paulo/kader/verein/199/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/botafogo-rio-de-janeiro/kader/verein/537/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/esporte-clube-bahia/kader/verein/10010/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/fluminense-rio-de-janeiro/kader/verein/2462/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/vasco-da-gama-rio-de-janeiro/kader/verein/978/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/fc-santos/kader/verein/221/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/gremio-porto-alegre/kader/verein/210/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/red-bull-bragantino/kader/verein/8793/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/clube-atletico-mineiro/kader/verein/330/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/fc-sao-paulo/kader/verein/585/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/club-athletico-paranaense/kader/verein/679/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/sc-internacional-porto-alegre/kader/verein/6600/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/esporte-clube-vitoria/kader/verein/2125/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/coritiba-fc/kader/verein/776/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/mirassol-futebol-clube-sp-/kader/verein/3876/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/clube-do-remo-pa-/kader/verein/10997/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/chapecoense/kader/verein/17776/saison_id/2025/plus/1",

  // Serie B
  "https://www.transfermarkt.com.br/fortaleza-esporte-clube/kader/verein/10870/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/sport-club-do-recife/kader/verein/8718/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/ceara-sporting-club/kader/verein/2029/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/cuiaba-ec-mt-/kader/verein/28022/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/esporte-clube-juventude/kader/verein/10492/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/gremio-novorizontino-sp-/kader/verein/37474/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/goias-ec/kader/verein/3197/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/criciuma-esporte-clube/kader/verein/7178/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/clube-de-regatas-brasil-al-/kader/verein/11449/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/athletic-club-mg-/kader/verein/64918/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/vila-nova-futebol-clube-go-/kader/verein/5677/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/atletico-clube-goianiense/kader/verein/15172/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/america-futebol-clube-mg-/kader/verein/2863/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/operario-ferroviario-ec-pr-/kader/verein/27214/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/sao-bernardo-futebol-clube-sp-/kader/verein/16439/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/avai-fc-sc-/kader/verein/2035/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/botafogo-futebol-clube-sp-/kader/verein/9030/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/clube-nautico-capibaribe/kader/verein/2646/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/aa-ponte-preta/kader/verein/1134/saison_id/2025/plus/1",
  "https://www.transfermarkt.com.br/londrina-esporte-clube-pr-/kader/verein/1693/saison_id/2025/plus/1"
];

async function downloadLogos() {
  const dir = path.join(process.cwd(), 'public', 'escudos');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const teamId = url.split('verein/')[1].split('/')[0];
    const slug = url.split('/')[3];
    
    // Usar o slug inteiro para não sobrescrever (ex: botafogo-rj e botafogo-sp)
    const logoUrl = `https://tmssl.akamaized.net/images/wappen/head/${teamId}.png`;
    const destPath = path.join(dir, `${slug}.png`);
    
    console.log(`Baixando logo de ${slug} (${logoUrl})...`);
    
    try {
      const response = await fetch(logoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        }
      });
      
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(destPath, Buffer.from(buffer));
      console.log(`✅ Salvo: ${destPath}`);
      
    } catch (err) {
      console.error(`Erro ao baixar ${logoUrl}:`, err);
    }
  }
}

downloadLogos();
