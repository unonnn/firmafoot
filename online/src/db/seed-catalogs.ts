// Popula os catálogos editáveis no Admin (patrocinadores e tipos de conversa).
// Idempotente: roda `truncate + insert`, então pode ser reexecutado com segurança
// sempre que o time quiser resetar os catálogos para os valores padrão.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sponsors, conversationTypes, gameConfig } from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

// Valores extraídos das faixas usadas em js/main.js:gerarPropostasPatrocinio (420-553),
// fixados num valor representativo (o antigo sorteava dentro de uma faixa por rodada/reputação).
const sponsorSeeds: (typeof sponsors.$inferInsert)[] = [
  // Material esportivo (royalties sobre vendas de camisa) — 3 tiers por reputação
  { slot: "material", name: "Nike", baseValue: 1_200_000, royaltyPct: 22, goalType: "none", bonusValue: 0, minReputation: 75 },
  { slot: "material", name: "Adidas", baseValue: 1_250_000, royaltyPct: 20, goalType: "none", bonusValue: 0, minReputation: 75 },
  { slot: "material", name: "Puma", baseValue: 1_150_000, royaltyPct: 21, goalType: "none", bonusValue: 0, minReputation: 75 },
  { slot: "material", name: "Umbro", baseValue: 800_000, royaltyPct: 15, goalType: "none", bonusValue: 0, minReputation: 45 },
  { slot: "material", name: "Kappa", baseValue: 780_000, royaltyPct: 14, goalType: "none", bonusValue: 0, minReputation: 45 },
  { slot: "material", name: "New Balance", baseValue: 820_000, royaltyPct: 16, goalType: "none", bonusValue: 0, minReputation: 45 },
  { slot: "material", name: "Penalty", baseValue: 420_000, royaltyPct: 9, goalType: "none", bonusValue: 0, minReputation: 0 },
  { slot: "material", name: "Topper", baseValue: 400_000, royaltyPct: 9, goalType: "none", bonusValue: 0, minReputation: 0 },
  { slot: "material", name: "Kanxa", baseValue: 380_000, royaltyPct: 8, goalType: "none", bonusValue: 0, minReputation: 0 },

  // Master (patrocinador principal) — meta de rodada: vitória
  { slot: "master", name: "Betano", baseValue: 1_800_000, royaltyPct: 0, goalType: "win", bonusValue: 45_000, minReputation: 0 },
  { slot: "master", name: "Nubank", baseValue: 1_900_000, royaltyPct: 0, goalType: "win", bonusValue: 50_000, minReputation: 0 },
  { slot: "master", name: "Pixbet", baseValue: 1_850_000, royaltyPct: 0, goalType: "win", bonusValue: 48_000, minReputation: 0 },
  { slot: "master", name: "Crefisa", baseValue: 1_700_000, royaltyPct: 0, goalType: "win", bonusValue: 42_000, minReputation: 0 },
  { slot: "master", name: "EstrelaBet", baseValue: 1_750_000, royaltyPct: 0, goalType: "win", bonusValue: 44_000, minReputation: 0 },

  // Mangas — meta de rodada: clean sheet (não sofrer gol)
  { slot: "mangas", name: "TIM", baseValue: 320_000, royaltyPct: 0, goalType: "clean_sheet", bonusValue: 20_000, minReputation: 0 },
  { slot: "mangas", name: "Gatorade", baseValue: 340_000, royaltyPct: 0, goalType: "clean_sheet", bonusValue: 22_000, minReputation: 0 },
  { slot: "mangas", name: "Claro", baseValue: 310_000, royaltyPct: 0, goalType: "clean_sheet", bonusValue: 19_000, minReputation: 0 },

  // Costas — meta de rodada: 3+ gols no jogo
  { slot: "costas", name: "Brahma", baseValue: 380_000, royaltyPct: 0, goalType: "three_goals", bonusValue: 25_000, minReputation: 0 },
  { slot: "costas", name: "Mercado Livre", baseValue: 400_000, royaltyPct: 0, goalType: "three_goals", bonusValue: 27_000, minReputation: 0 },
  { slot: "costas", name: "Cartola FC", baseValue: 360_000, royaltyPct: 0, goalType: "three_goals", bonusValue: 23_000, minReputation: 0 },

  // Calção — meta de rodada: vitória
  { slot: "calcao", name: "Spoleto", baseValue: 200_000, royaltyPct: 0, goalType: "win", bonusValue: 12_000, minReputation: 0 },
  { slot: "calcao", name: "Philco", baseValue: 190_000, royaltyPct: 0, goalType: "win", bonusValue: 11_000, minReputation: 0 },
  { slot: "calcao", name: "Joli", baseValue: 210_000, royaltyPct: 0, goalType: "win", bonusValue: 13_000, minReputation: 0 },
];

// Efeitos extraídos de js/components/tactics.js:797-828 (conversas do modal do jogador).
const conversationSeeds: (typeof conversationTypes.$inferInsert)[] = [
  {
    key: "elogiar",
    label: "Elogiar",
    description: "Você elogia o comprometimento do jogador. Ele fica motivado e sua moral sobe.",
    moraleEffect: 10,
    moraleEffectAlt: null,
    fitnessEffect: 0,
    successChance: 100,
    cooldownRounds: 3,
  },
  {
    key: "cobrar",
    label: "Cobrar Foco",
    description: "Você cobra mais foco nos treinos. 50% de chance de motivar (+12 moral) ou soar injusto (-10 moral).",
    moraleEffect: 12,
    moraleEffectAlt: -10,
    fitnessEffect: 0,
    successChance: 50,
    cooldownRounds: 3,
  },
  {
    key: "folga",
    label: "Dar Folga",
    description: "Você dá folga extra ao jogador. A condição física se recupera, mas ele perde um pouco de ritmo (moral).",
    moraleEffect: -5,
    moraleEffectAlt: null,
    fitnessEffect: 15,
    successChance: 100,
    cooldownRounds: 3,
  },
];

// Parâmetros numéricos do simulador, editáveis no Admin (game_config). Portados dos
// limiares fixos de js/main.js:1557-1635 (confiança da diretoria) e da taxa de juros
// de empréstimo bancário (js/main.js:1378-1381).
const configSeeds: (typeof gameConfig.$inferInsert)[] = [
  {
    key: "board_confidence_fire_threshold",
    value: 15,
    label: "Limite de demissão (confiança da diretoria)",
    description: "Se a confiança da diretoria cair para este valor (0-100) ou menos, o técnico é avisado de risco de demissão.",
  },
  {
    key: "board_confidence_invite_threshold",
    value: 85,
    label: "Limite para convites de emprego",
    description: "Confiança mínima da diretoria (0-100) para que o técnico comece a receber propostas de outros clubes.",
  },
  {
    key: "board_confidence_invite_min_round",
    value: 5,
    label: "Rodada mínima para convites de emprego",
    description: "Nenhum convite de emprego é gerado antes desta rodada da temporada.",
  },
  {
    key: "board_confidence_invite_chance",
    value: 0.08,
    label: "Chance de convite de emprego por rodada",
    description: "Probabilidade (0 a 1) de surgir um convite de outro clube a cada rodada, quando os demais critérios são atendidos.",
  },
  {
    key: "bank_loan_interest_rate",
    value: 0.05,
    label: "Taxa de juros do empréstimo bancário",
    description: "Percentual (0 a 1) cobrado por rodada sobre a dívida em aberto do clube.",
  },
  {
    key: "round_ready_threshold_pct",
    value: 0.7,
    label: "Percentual de prontos para avançar rodada",
    description: "Fração (0 a 1) de técnicos humanos ativos que precisam marcar 'pronto' para a rodada ser processada automaticamente, sem esperar o cron diário.",
  },
  {
    key: "live_match_ms_per_minute",
    value: 350,
    label: "Velocidade da partida ao vivo (ms por minuto simulado)",
    description: "Quantos milissegundos reais cada minuto simulado de partida leva na tela de 'partida ao vivo'. 350ms ≈ 31s para os 90 minutos.",
  },
  {
    key: "match_fitness_decay_multiplier",
    value: 1.0,
    label: "Multiplicador de desgaste físico por partida",
    description: "Escala o quanto a condição física dos titulares cai durante uma partida (1.0 = padrão, ~8-10% por jogo; 0.5 = metade do desgaste; 0 = sem desgaste).",
  },
];

async function main() {
  console.log("Semeando catálogos (sponsors, conversation_types, game_config)...");

  await db.delete(sponsors);
  await db.insert(sponsors).values(sponsorSeeds);
  console.log(`-> ${sponsorSeeds.length} patrocinadores inseridos.`);

  await db.delete(conversationTypes);
  await db.insert(conversationTypes).values(conversationSeeds);
  console.log(`-> ${conversationSeeds.length} tipos de conversa inseridos.`);

  // game_config usa upsert (onConflictDoUpdate) em vez de delete+insert, pra não
  // resetar valores que o admin já tenha ajustado manualmente ao rerodar o seed.
  for (const cfg of configSeeds) {
    await db.insert(gameConfig).values(cfg).onConflictDoNothing({ target: gameConfig.key });
  }
  console.log(`-> ${configSeeds.length} parâmetros de configuração garantidos (sem sobrescrever ajustes existentes).`);

  console.log("Catálogos semeados com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao semear catálogos:", err);
  process.exit(1);
});
