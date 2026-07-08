import type { NextRequest } from "next/server";
import { db } from "@/db";
import { matches, teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getConfigValue, CONFIG_KEYS } from "@/lib/game/config";
import { subscribe, publishMatchEvent, matchChannel } from "@/lib/redis/pubsub";
import { redis } from "@/lib/redis/client";
import type { MatchEvent } from "@/lib/game/engine/types";

// Nunca cachear/pré-renderizar — cada conexão é um stream ao vivo.
export const dynamic = "force-dynamic";

function sseLine(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

// "Reproduz" uma partida já simulada (matches.events) em ritmo de jogo ao vivo via
// Server-Sent Events. A simulação em si é instantânea (roda no worker da rodada,
// ver src/lib/game/round/process-round.ts); esta rota só decide o RITMO de exibição.
//
// Coordenação via Redis: a primeira conexão para uma partida vira a "condutora"
// (lock `match:<id>:playback-lock`) e pauta os eventos, publicando cada um no canal
// pub/sub da partida; conexões adicionais (ex: os dois técnicos assistindo o mesmo
// confronto) apenas assinam esse canal, garantindo que todo mundo veja os mesmos
// eventos no mesmo ritmo em vez de cada aba reproduzir a partida do zero.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isFinite(matchId)) {
    return new Response("ID de partida inválido.", { status: 400 });
  }

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
  if (!match || !match.played || !match.events) {
    return new Response("Partida não encontrada ou ainda não foi jogada.", { status: 404 });
  }

  const [homeTeam] = await db.select().from(teams).where(eq(teams.id, match.homeTeamId));
  const [awayTeam] = await db.select().from(teams).where(eq(teams.id, match.awayTeamId));

  const encoder = new TextEncoder();
  const lockKey = `match:${matchId}:playback-lock`;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const enqueue = (payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sseLine(payload)));
        } catch {
          closed = true;
        }
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // já fechado pelo outro lado
        }
      };

      enqueue({
        type: "meta",
        round: match.round,
        homeTeamName: homeTeam?.name ?? "Mandante",
        awayTeamName: awayTeam?.name ?? "Visitante",
      });

      request.signal.addEventListener("abort", close);

      // Tenta virar a "condutora" desta reprodução (TTL cobre o pior caso: 90min * ms).
      // Sem Redis disponível, degrada para "sempre condutora" — sem coordenação entre
      // abas simultâneas, mas cada uma ainda reproduz a própria partida corretamente.
      let isDriver = true;
      try {
        isDriver = (await redis.set(lockKey, "1", "EX", 300, "NX")) === "OK";
      } catch (err) {
        console.warn(`[live-match] Redis indisponível, reproduzindo sem coordenação:`, (err as Error).message);
      }

      if (!isDriver) {
        const sub = subscribe(matchChannel(matchId), (payload) => enqueue(JSON.parse(payload)));
        request.signal.addEventListener("abort", () => sub.quit());
        return;
      }

      // Publicar no canal é só para sincronizar outras abas assistindo a mesma
      // partida — nunca deve derrubar a reprodução de quem está conduzindo.
      const safePublish = async (payload: unknown) => {
        try {
          await publishMatchEvent(matchId, payload);
        } catch (err) {
          console.warn(`[live-match] falha ao publicar evento (segue reproduzindo local):`, (err as Error).message);
        }
      };

      try {
        const msPerMinute = await getConfigValue(CONFIG_KEYS.liveMatchMsPerMinute, 350);
        const events = (match.events as MatchEvent[]) ?? [];
        const eventsByMinute = new Map<number, MatchEvent[]>();
        for (const ev of events) {
          const list = eventsByMinute.get(ev.min) ?? [];
          list.push(ev);
          eventsByMinute.set(ev.min, list);
        }

        for (let minute = 1; minute <= 90 && !closed; minute++) {
          await new Promise((resolve) => setTimeout(resolve, msPerMinute));

          for (const ev of eventsByMinute.get(minute) ?? []) {
            enqueue(ev);
            await safePublish(ev);
          }
          const tick = { type: "tick", minute };
          enqueue(tick);
          await safePublish(tick);
        }

        const final = { type: "final", homeScore: match.homeScore, awayScore: match.awayScore };
        enqueue(final);
        await safePublish(final);
      } finally {
        await redis.del(lockKey).catch(() => {});
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
