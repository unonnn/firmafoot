import { redis } from "./client";

const READY_TTL_SECONDS = 60 * 60 * 24 * 3; // 3 dias, evita lixo se uma rodada nunca fechar
const LOCK_TTL_SECONDS = 60 * 10; // tempo máximo que o processamento de uma rodada pode levar

function readySetKey(round: number) {
  return `round:${round}:ready`;
}

function lockKey(round: number) {
  return `round:${round}:lock`;
}

export async function markUserReady(round: number, userId: string) {
  const key = readySetKey(round);
  await redis.sadd(key, userId);
  await redis.expire(key, READY_TTL_SECONDS);
}

export async function isUserReady(round: number, userId: string) {
  return (await redis.sismember(readySetKey(round), userId)) === 1;
}

export async function countReady(round: number) {
  return redis.scard(readySetKey(round));
}

export async function clearReadiness(round: number) {
  await redis.del(readySetKey(round));
}

// Lock distribuído (SET NX) para garantir que só um worker processe a rodada por vez,
// mesmo se readiness (70%) e o cron diário dispararem ao mesmo tempo.
export async function acquireRoundLock(round: number): Promise<boolean> {
  const result = await redis.set(lockKey(round), "1", "EX", LOCK_TTL_SECONDS, "NX");
  return result === "OK";
}

export async function releaseRoundLock(round: number) {
  await redis.del(lockKey(round));
}
