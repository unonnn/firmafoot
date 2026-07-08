// Processo standalone (NÃO roda dentro do runtime do Next.js/serverless).
// Rodar com `npm run worker`. Consome a fila de processamento de rodada e mantém o
// cron diário de segurança (garante que a liga avança mesmo se ninguém marcar
// "pronto" — ver actions/round.ts para o gatilho de 70%).
import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnectionOptions } from "@/lib/redis/client";
import { ROUND_QUEUE_NAME, roundQueue, type ProcessRoundJobData } from "@/lib/redis/queue";
import { processRound } from "@/lib/game/round/process-round";

async function handleProcessRound(data: ProcessRoundJobData) {
  console.log(`[worker] processando rodada (motivo: ${data.reason})...`);
  const resultado = await processRound();
  console.log(`[worker] rodada ${resultado.round} concluída — ${resultado.matchesSimulated} partida(s) simulada(s).`);
}

const worker = new Worker<ProcessRoundJobData>(
  ROUND_QUEUE_NAME,
  async (job) => {
    if (job.name === "process-round") {
      await handleProcessRound(job.data);
    }
  },
  { connection: redisConnectionOptions() }
);

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} concluído.`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} falhou:`, err);
});

// Job repetível diário (03:00) como rede de segurança — mesmo id de repeat, então
// registrar de novo a cada boot do worker é idempotente (BullMQ não duplica).
async function registrarCronDiario() {
  await roundQueue.add(
    "process-round",
    { reason: "cron" } satisfies ProcessRoundJobData,
    { repeat: { pattern: "0 3 * * *" }, jobId: "daily-round-cron" }
  );
  console.log("[worker] cron diário (03:00) registrado.");
}

registrarCronDiario().catch((err) => console.error("[worker] falha ao registrar cron diário:", err));

console.log("[worker] Firmafoot round worker iniciado, aguardando jobs...");

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
