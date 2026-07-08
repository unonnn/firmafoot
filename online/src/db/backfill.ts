// Backfill único, rodado depois da migração de schema, para preencher dados que
// não existiam quando os jogadores/times reais foram seedados via scraping.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { players, league } from "./schema";
import { sortearPosicaoSecundaria } from "../lib/game/positions";
import { isNull, sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function main() {
  console.log("Rodando backfill...");

  // 1. Posição secundária para jogadores reais seedados via scraping (vieram sem esse campo).
  const semPosicaoSecundaria = await db.select().from(players).where(isNull(players.secondaryPosition));
  console.log(`-> ${semPosicaoSecundaria.length} jogadores sem posição secundária.`);

  for (const p of semPosicaoSecundaria) {
    const secundaria = sortearPosicaoSecundaria(p.position);
    if (secundaria) {
      await db.update(players).set({ secondaryPosition: secundaria }).where(sql`${players.id} = ${p.id}`);
    }
  }
  console.log("-> Posições secundárias preenchidas.");

  // 2. Relógio global da liga (singleton). Só cria se ainda não existir.
  const existingLeague = await db.select().from(league).limit(1);
  if (existingLeague.length === 0) {
    await db.insert(league).values({ seasonYear: 2026, currentRound: 1, phase: "in_season" });
    console.log("-> Registro da liga (temporada 2026, rodada 1) criado.");
  } else {
    console.log("-> Registro da liga já existe, mantido como está.");
  }

  console.log("Backfill concluído!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no backfill:", err);
  process.exit(1);
});
