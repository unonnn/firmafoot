import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { teams, players } from "./schema";
import * as dotenv from "dotenv";
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: ".env.local" });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const db = drizzle(pool);

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

async function main() {
  console.log("Iniciando o Mega Seed do Brasileirão com Dados Reais...");
  
  const seedsPath = path.join(process.cwd(), 'src', 'lib', 'seeds.json');
  if (!fs.existsSync(seedsPath)) {
    console.error("ERRO: src/lib/seeds.json não encontrado. Execute o scraper.ts primeiro.");
    process.exit(1);
  }
  
  const seedsData = JSON.parse(fs.readFileSync(seedsPath, 'utf8'));
  const teamNames = Object.keys(seedsData);
  
  if (teamNames.length !== urls.length) {
    console.error("ERRO: Quantidade de times em seeds.json não bate com a lista de URLs.");
    process.exit(1);
  }

  // Limpar tabelas
  console.log("Limpando banco de dados...");
  await db.delete(players);
  await db.delete(teams);
  
  for (let i = 0; i < teamNames.length; i++) {
    const name = teamNames[i];
    const url = urls[i];
    const slug = url.split('/')[3];
    const roster = seedsData[name];
    
    // Série A são os primeiros 20 (reputação 85), Série B os últimos 20 (reputação 75)
    const isSerieA = i < 20;
    const reputation = isSerieA ? 85 : 75;
    const balance = isSerieA ? 15000000 : 5000000;
    
    console.log(`Criando time: ${name} (${isSerieA ? 'Série A' : 'Série B'})`);
    
    const [team] = await db.insert(teams).values({
      baseId: slug,
      name,
      acronym: name.substring(0, 3).toUpperCase(),
      reputation,
      balance,
      logoUrl: `/escudos/${slug}.png`,
    }).returning();
    
    console.log(` -> Inserindo ${roster.length} jogadores para ${name}`);
    for (const p of roster) {
      // Remover o valor de mercado (ex: "€ 7.00 mi.") que pode ter vindo grudado no nome
      const cleanName = p.name.split('€')[0].trim();
      
      const playerValue = p.strength * 100000;
      const playerSalary = Math.floor(playerValue / 100);

      await db.insert(players).values({
        teamId: team.id,
        name: cleanName,
        position: p.position,
        age: p.age,
        strength: p.strength,
        fitness: 100,
        morale: 100,
        value: playerValue,
        salary: playerSalary
      });
    }
  }

  console.log("✅ Seed concluído com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
