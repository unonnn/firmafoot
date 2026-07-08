import { db } from "@/db";
import { gameConfig } from "@/db/schema";
import { cached, invalidateCache } from "@/lib/redis/cache";

const CONFIG_CACHE_KEY = "game-config:all";
const CONFIG_CACHE_TTL_SECONDS = 300;

async function loadAllConfig(): Promise<Record<string, number>> {
  const rows = await db.select().from(gameConfig);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// Lê um parâmetro numérico configurável no Admin (game_config), com cache de 5min no
// Redis. `fallback` cobre o caso de a chave ainda não ter sido semeada.
export async function getConfigValue(key: string, fallback: number): Promise<number> {
  const all = await cached(CONFIG_CACHE_KEY, loadAllConfig, CONFIG_CACHE_TTL_SECONDS);
  return all[key] ?? fallback;
}

export async function invalidateConfigCache() {
  await invalidateCache(CONFIG_CACHE_KEY);
}

// Chaves usadas pelo motor de rodada — mantidas num único lugar para evitar strings
// soltas espalhadas pelos módulos de round/*.
export const CONFIG_KEYS = {
  boardConfidenceFireThreshold: "board_confidence_fire_threshold",
  boardConfidenceInviteThreshold: "board_confidence_invite_threshold",
  boardConfidenceInviteMinRound: "board_confidence_invite_min_round",
  boardConfidenceInviteChance: "board_confidence_invite_chance",
  bankLoanInterestRate: "bank_loan_interest_rate",
  roundReadyThresholdPct: "round_ready_threshold_pct",
  liveMatchMsPerMinute: "live_match_ms_per_minute",
  matchFitnessDecayMultiplier: "match_fitness_decay_multiplier",
} as const;
