import { redis } from "./client";

export function matchChannel(matchId: number) {
  return `match:${matchId}`;
}

export const ROUND_EVENTS_CHANNEL = "round:events";

export async function publishMatchEvent(matchId: number, event: unknown) {
  await redis.publish(matchChannel(matchId), JSON.stringify(event));
}

export async function publishRoundEvent(event: unknown) {
  await redis.publish(ROUND_EVENTS_CHANNEL, JSON.stringify(event));
}

// Assinantes precisam de uma conexão dedicada: enquanto em modo "subscriber",
// o ioredis não permite mandar outros comandos nessa mesma conexão.
// O chamador é responsável por `sub.quit()` quando terminar (ex: cliente desconectou do SSE).
export function subscribe(channel: string, onMessage: (payload: string) => void) {
  const sub = redis.duplicate();
  sub.subscribe(channel);
  sub.on("message", (ch, message) => {
    if (ch === channel) onMessage(message);
  });
  return sub;
}
