import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __firmafootRedis: Redis | undefined;
}

function getRedisUrl() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL não configurada. Defina-a no .env (ex: redis://localhost:6379).");
  }
  return url;
}

function createClient() {
  // lazyConnect: só abre o socket no primeiro comando de verdade — importar este
  // módulo (direta ou transitivamente) nunca deve, por si só, exigir Redis disponível.
  return new Redis(getRedisUrl(), { maxRetriesPerRequest: null, lazyConnect: true });
}

function ensureClient(): Redis {
  if (!globalThis.__firmafootRedis) {
    globalThis.__firmafootRedis = createClient();
  }
  return globalThis.__firmafootRedis;
}

// Proxy: a validação de REDIS_URL e a conexão real só acontecem quando algum comando
// (ex: `redis.get(...)`) é efetivamente chamado, nunca só por importar este módulo.
// Isso evita que uma REDIS_URL ausente derrube funcionalidades que não dependem
// estritamente de Redis (ex: leitura de config com fallback via `cached()`).
export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop, _receiver) {
    const client = ensureClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// BullMQ empacota sua própria cópia (potencialmente com versão diferente) do ioredis.
// Passar uma instância `Redis` do nosso ioredis para Queue/Worker do BullMQ quebra o
// typecheck (duas classes `Redis` nominalmente diferentes). Em vez disso, entregamos
// só as opções de conexão como objeto plano — o BullMQ cria a própria instância com a
// sua cópia do ioredis, sem conflito de tipos.
export function redisConnectionOptions() {
  const parsed = new URL(getRedisUrl());
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    tls: parsed.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null as null,
  };
}
