import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// List of all Serie A and Serie B team URLs
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

function mapPosition(pos: string) {
  const p = pos.toLowerCase();
  if (p.includes('goleiro')) return 'GOL';
  if (p.includes('zagueiro')) return 'ZAG';
  if (p.includes('lateral esq')) return 'LE';
  if (p.includes('lateral dir')) return 'LD';
  if (p.includes('volante')) return 'VOL';
  if (p.includes('meia')) return 'MEI';
  if (p.includes('ponta esq')) return 'PE';
  if (p.includes('ponta dir')) return 'PD';
  if (p.includes('atacante') || p.includes('centroavante')) return 'CA';
  return 'MEI'; // default
}

async function scrapeTransfermarkt() {
  const result: any = {};
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i+1}/${urls.length}] Raspando ${url}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });
      
      if (!response.ok) {
        console.error(`Erro ao acessar ${url}: ${response.status}`);
        continue;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const teamNameRaw = $('h1.data-header__headline-wrapper').text().trim() || url.split('/')[3].replace(/-/g, ' ');
      const teamName = teamNameRaw.replace(/\s+/g, ' ').replace('Plantel ', '').trim();
      
      const players: any[] = [];
      
      $('table.items tbody tr.odd, table.items tbody tr.even').each((_, el) => {
        const nameNode = $(el).find('td.hauptlink a');
        if (!nameNode.length) return;
        const name = nameNode.text().trim();
        
        const posNode = $(el).find('table.inline-table tr:nth-child(2) td');
        const posText = posNode.text().trim() || 'Meia';
        const position = mapPosition(posText);
        
        // Age is usually in a centered column, looking like '10/02/1990 (34)'
        let age = 25;
        $(el).find('td.zentriert').each((_, td) => {
          const txt = $(td).text().trim();
          if (txt.includes('(') && txt.includes(')')) {
            const match = txt.match(/\((\d+)\)/);
            if (match && match[1]) {
              age = parseInt(match[1]);
            }
          }
        });
        
        players.push({
          name,
          position,
          age,
          strength: Math.floor(Math.random() * 15) + 65 // Random strength base for now
        });
      });
      
      result[teamName] = players;
      console.log(`-> Encontrados ${players.length} jogadores para ${teamName}`);
      
      // Delay to avoid blocking
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (err) {
      console.error(`Erro fatal em ${url}:`, err);
    }
  }
  
  const outputPath = path.join(process.cwd(), 'src', 'lib', 'seeds.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n✅ Scraping completo! Arquivo salvo em: ${outputPath}`);
}

scrapeTransfermarkt();
