import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { teams, matches, standings } from "./schema";
import { eq, desc, asc } from "drizzle-orm";
import * as dotenv from "dotenv";
import { generateRoundRobin } from "../lib/game/season/calendar";

dotenv.config({ path: ".env.local" });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const db = drizzle(pool);

async function main() {
  console.log("Gerando tabela e campeonato...");

  // 1. Limpar tabelas de partidas e classificação
  await db.delete(matches);
  await db.delete(standings);

  // 2. Buscar todos os times do banco e dividir por reputação
  const allTeams = await db.select().from(teams).orderBy(desc(teams.reputation));
  const serieA = allTeams.filter(t => t.reputation >= 80);
  const serieB = allTeams.filter(t => t.reputation < 80);

  if (serieA.length !== 20 || serieB.length !== 20) {
    console.warn(`Aviso: O número de times não é 20 (Série A: ${serieA.length}, Série B: ${serieB.length})`);
  }

  // 3. Inserir tabela de classificação zerada para todos os times
  for (const t of serieA) {
    await db.insert(standings).values({ teamId: t.id, division: 'A' });
  }
  for (const t of serieB) {
    await db.insert(standings).values({ teamId: t.id, division: 'B' });
  }
  console.log(`Classificação zerada criada para ${serieA.length + serieB.length} times.`);

  // 4. Gerar Partidas (Série A)
  const matchesSerieA = generateRoundRobin(serieA, 'A');
  console.log(`Gerados ${matchesSerieA.length} jogos para a Série A.`);

  // 5. Gerar Partidas (Série B)
  const matchesSerieB = generateRoundRobin(serieB, 'B');
  console.log(`Gerados ${matchesSerieB.length} jogos para a Série B.`);

  // 6. Inserir todas as partidas no banco (em lotes para não estourar os limites)
  const allMatches = [...matchesSerieA, ...matchesSerieB];
  
  // Lotes de 100
  const chunkSize = 100;
  for (let i = 0; i < allMatches.length; i += chunkSize) {
    const chunk = allMatches.slice(i, i + chunkSize);
    await db.insert(matches).values(chunk);
  }
  
  console.log(`Inserção de ${allMatches.length} jogos concluída no banco de dados!`);
  process.exit(0);
}

main().catch(err => {
  console.error("Erro ao gerar fixtures:", err);
  process.exit(1);
});
