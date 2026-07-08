import { Queue } from "bullmq";
import { redisConnectionOptions } from "./client";

export const ROUND_QUEUE_NAME = "round-processing";

declare global {
  // eslint-disable-next-line no-var
  var __firmafootRoundQueue: Queue | undefined;
}

function ensureQueue(): Queue {
  if (!globalThis.__firmafootRoundQueue) {
    // BullMQ usa sua própria cópia do ioredis internamente; ver comentário em client.ts.
    globalThis.__firmafootRoundQueue = new Queue(ROUND_QUEUE_NAME, { connection: redisConnectionOptions() });
  }
  return globalThis.__firmafootRoundQueue;
}

// Proxy: assim como `redis` em client.ts, adiar a construção da Queue (e portanto a
// validação de REDIS_URL) até o primeiro uso de verdade. Sem isso, qualquer módulo do
// app que importe (mesmo que transitivamente) algo de src/app/actions/round.ts
// derrubaria a própria home page quando REDIS_URL não estivesse configurada — a
// Queue era construída na avaliação do módulo, não quando alguém chamava `.add()`.
export const roundQueue: Queue = new Proxy({} as Queue, {
  get(_target, prop, _receiver) {
    const queue = ensureQueue();
    const value = Reflect.get(queue, prop, queue);
    return typeof value === "function" ? value.bind(queue) : value;
  },
});

export type ProcessRoundJobData = {
  reason: "readiness" | "cron" | "manual";
};

// Enfileira o processamento da rodada atual. `jobId` fixo evita duplicar o job
// caso readiness e cron disparem quase ao mesmo tempo (BullMQ ignora jobId repetido
// enquanto o job anterior não for concluído/removido).
export async function enqueueRoundProcessing(round: number, data: ProcessRoundJobData) {
  await roundQueue.add("process-round", data, {
    jobId: `round-${round}`,
    removeOnComplete: 50,
    removeOnFail: 50,
  });
}
