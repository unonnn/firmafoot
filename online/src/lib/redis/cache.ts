import { redis } from "./client";

const DEFAULT_TTL_SECONDS = 60;

function namespaced(key: string) {
  return `cache:${key}`;
}

// Cache-aside: tenta ler do Redis, senão computa via `loader`, grava e retorna.
// Redis aqui é estritamente uma otimização — se a conexão falhar (não configurada,
// fora do ar, etc.) caímos direto no `loader()` em vez de derrubar quem chamou. Isso
// importa especialmente para src/lib/game/config.ts: parâmetros de rodada (confiança
// da diretoria, juros) não podem parar de funcionar por causa do Redis.
export async function cached<T>(key: string, loader: () => Promise<T>, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<T> {
  try {
    const raw = await redis.get(namespaced(key));
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.warn(`[cache] leitura falhou para "${key}", computando direto:`, (err as Error).message);
  }

  const value = await loader();

  try {
    await redis.set(namespaced(key), JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.warn(`[cache] escrita falhou para "${key}" (valor ainda foi retornado):`, (err as Error).message);
  }

  return value;
}

export async function invalidateCache(key: string) {
  try {
    await redis.del(namespaced(key));
  } catch (err) {
    console.warn(`[cache] invalidação falhou para "${key}":`, (err as Error).message);
  }
}

// Invalida todas as chaves que casam com um prefixo (ex: "standings:*").
export async function invalidateCachePattern(pattern: string) {
  try {
    const keys = await redis.keys(namespaced(pattern));
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`[cache] invalidação por padrão falhou para "${pattern}":`, (err as Error).message);
  }
}
