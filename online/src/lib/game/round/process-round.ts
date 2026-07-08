import { db } from "@/db";
import { players, teams, matches, league } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { resolveEffectiveLineup } from "../tactics/lineup-auto";
import { simularPartidaCompleta } from "../engine/match";
import { applyMatchResultToStandings } from "./standings";
import { resultadoDoTime, calcularNovaMoral, type ResultadoPartida } from "./morale";
import { recuperarFisicoSeNaoJogou, resolverCartoes, decrementarLesao, decrementarCooldownConversa } from "./injuries";
import { applyRoundFinances } from "./finances";
import { applyBoardConfidence } from "./confidence";
import { processarEmprestimos } from "./loans";
import { applyTrainingBeforeMatch, resetTacticalBonusAfterMatch } from "./training";
import { applyLeiDoEx } from "./lei-do-ex";
import { generateTransferOffersForListedPlayers } from "./transfer-offers";
import { performSeasonRollover } from "../season/rollover";
import { clearReadiness, acquireRoundLock, releaseRoundLock } from "@/lib/redis/readiness";
import { getConfigValue, CONFIG_KEYS } from "../config";

interface TeamRoundResult {
  division: string;
  resultado: ResultadoPartida;
  goalsFor: number;
  goalsAgainst: number;
  playedPlayerIds: Set<number>;
  ticketRevenue: number; // só o mandante recebe bilheteria
}

// Orquestra a conclusão de uma rodada inteira: simula todas as partidas pendentes,
// atualiza classificação, aplica moral/físico/cartões/lesões, finanças e confiança da
// diretoria para cada time, processa retornos de empréstimo e avança o relógio da liga.
// Portado de js/main.js:processarConclusaoDaRodada (1266-1656), adaptado para o mundo
// compartilhado: TODAS as partidas da rodada são simuladas do mesmo jeito (não há mais
// distinção entre "partida ao vivo do usuário" e "partidas instantâneas da CPU").
//
// Protegido por lock distribuído no Redis: o gatilho de readiness (70%) e o cron
// diário de segurança (src/worker.ts) podem disparar quase ao mesmo tempo — sem o
// lock, a mesma rodada seria simulada duas vezes.
export async function processRound(): Promise<{ round: number; matchesSimulated: number }> {
  const [leagueRow] = await db.select().from(league).limit(1);
  if (!leagueRow) throw new Error("Registro da liga (tabela `league`) não encontrado — rode o backfill.");

  const round = leagueRow.currentRound;

  const lockAdquirido = await acquireRoundLock(round);
  if (!lockAdquirido) {
    console.warn(`[processRound] rodada ${round} já está sendo processada por outro worker, ignorando.`);
    return { round, matchesSimulated: 0 };
  }

  try {
    return await processRoundLocked(leagueRow, round);
  } finally {
    await releaseRoundLock(round);
  }
}

async function processRoundLocked(
  leagueRow: typeof league.$inferSelect,
  round: number
): Promise<{ round: number; matchesSimulated: number }> {
  const pendingMatches = await db.select().from(matches).where(and(eq(matches.round, round), eq(matches.played, false)));

  if (pendingMatches.length === 0) {
    return { round, matchesSimulated: 0 };
  }

  const fitnessDecayMultiplier = await getConfigValue(CONFIG_KEYS.matchFitnessDecayMultiplier, 1.0);
  const teamResults = new Map<number, TeamRoundResult>();

  for (const match of pendingMatches) {
    const [homeTeam] = await db.select().from(teams).where(eq(teams.id, match.homeTeamId));
    const [awayTeam] = await db.select().from(teams).where(eq(teams.id, match.awayTeamId));
    if (!homeTeam || !awayTeam) continue;

    // Foco de treino é aplicado antes da partida — o bônus tático só existe se
    // acumulado ANTES do motor calcular o poder do time (ver src/lib/game/round/training.ts).
    await applyTrainingBeforeMatch(homeTeam.id, homeTeam.trainingFocus);
    await applyTrainingBeforeMatch(awayTeam.id, awayTeam.trainingFocus);

    const homePlayers = await db.select().from(players).where(eq(players.teamId, homeTeam.id));
    const awayPlayers = await db.select().from(players).where(eq(players.teamId, awayTeam.id));

    // "Lei do ex": jogador emprestado pelo adversário desta partida só joga se o
    // clube pagar a multa (cobrada automaticamente se houver saldo); sem saldo, fica
    // de fora só deste jogo (não conta como lesão/suspensão real).
    const barradosHome = await applyLeiDoEx(homeTeam.id, awayTeam.id);
    const barradosAway = await applyLeiDoEx(awayTeam.id, homeTeam.id);
    const homePlayersElegiveis = homePlayers.filter((p) => !barradosHome.includes(p.id));
    const awayPlayersElegiveis = awayPlayers.filter((p) => !barradosAway.includes(p.id));

    const homeLineup = resolveEffectiveLineup(homePlayersElegiveis, homeTeam.formation);
    const awayLineup = resolveEffectiveLineup(awayPlayersElegiveis, awayTeam.formation);

    const [homeTeamAtualizado] = await db.select().from(teams).where(eq(teams.id, homeTeam.id));
    const [awayTeamAtualizado] = await db.select().from(teams).where(eq(teams.id, awayTeam.id));

    const result = simularPartidaCompleta(
      { lineup: homeLineup, bonusTatico: homeTeamAtualizado?.tacticalBonus ?? 0 },
      { lineup: awayLineup, bonusTatico: awayTeamAtualizado?.tacticalBonus ?? 0 },
      { homeCapacity: homeTeam.capacity ?? 20000, homeTicketPrice: homeTeam.ticketPrice, homeReputation: homeTeam.reputation, fitnessDecayMultiplier }
    );

    await resetTacticalBonusAfterMatch(homeTeam.id);
    await resetTacticalBonusAfterMatch(awayTeam.id);

    await db.update(matches).set({
      played: true,
      homeScore: result.home.goals,
      awayScore: result.away.goals,
      events: result.events,
      attendance: result.attendance,
      revenue: result.revenue,
    }).where(eq(matches.id, match.id));

    const todosJogadoresDaPartida = [...homePlayers, ...awayPlayers];
    for (const [playerId, state] of result.finalPlayerStates) {
      const original = todosJogadoresDaPartida.find((p) => p.id === playerId);
      if (!original) continue;

      await db.update(players).set({
        fitness: Math.round(state.fitness),
        yellowCards: state.yellowCards,
        redCard: state.redCard,
        goals: original.goals + state.goalsThisMatch,
        isInjured: state.injuredThisMatch ? true : original.isInjured,
        injuryTime: state.injuredThisMatch ? state.injuryRoundsOut : original.injuryTime,
        matchesPlayed: original.matchesPlayed + 1,
      }).where(eq(players.id, playerId));
    }

    await applyMatchResultToStandings(match.division, homeTeam.id, awayTeam.id, result.home.goals, result.away.goals);

    teamResults.set(homeTeam.id, {
      division: match.division,
      resultado: resultadoDoTime(result.home.goals, result.away.goals),
      goalsFor: result.home.goals,
      goalsAgainst: result.away.goals,
      playedPlayerIds: new Set(homeLineup.map((s) => s.player.id)),
      ticketRevenue: result.revenue,
    });
    teamResults.set(awayTeam.id, {
      division: match.division,
      resultado: resultadoDoTime(result.away.goals, result.home.goals),
      goalsFor: result.away.goals,
      goalsAgainst: result.home.goals,
      playedPlayerIds: new Set(awayLineup.map((s) => s.player.id)),
      ticketRevenue: 0,
    });
  }

  for (const [teamId, res] of teamResults) {
    const teamPlayers = await db.select().from(players).where(eq(players.teamId, teamId));

    for (const p of teamPlayers) {
      const jogou = res.playedPlayerIds.has(p.id);
      const isReserva = p.characteristic === "reserva";
      const cartoes = resolverCartoes(p.yellowCards, p.redCard);
      const lesao = decrementarLesao(p.isInjured, p.injuryTime);

      await db.update(players).set({
        morale: calcularNovaMoral(p.morale, res.resultado, jogou, isReserva),
        fitness: recuperarFisicoSeNaoJogou(p.fitness, jogou),
        yellowCards: cartoes.yellowCards,
        redCard: cartoes.redCard,
        isInjured: lesao.isInjured,
        injuryTime: lesao.injuryTime,
        conversationCooldown: decrementarCooldownConversa(p.conversationCooldown),
      }).where(eq(players.id, p.id));
    }

    await applyRoundFinances(teamId, res.division, {
      won: res.resultado === "vitoria",
      goalsFor: res.goalsFor,
      goalsAgainst: res.goalsAgainst,
      ticketRevenue: res.ticketRevenue,
    });

    await applyBoardConfidence(
      teamId,
      res.division,
      { won: res.resultado === "vitoria", drew: res.resultado === "empate" },
      round
    );
  }

  await processarEmprestimos();
  await generateTransferOffersForListedPlayers(round);

  const [ultimaPartida] = await db.select({ round: matches.round }).from(matches).orderBy(desc(matches.round)).limit(1);
  const ultimaRodada = ultimaPartida?.round ?? round;

  if (round < ultimaRodada) {
    await db.update(league).set({ currentRound: round + 1, updatedAt: new Date() }).where(eq(league.id, leagueRow.id));
  } else {
    // Última rodada da temporada: vira a temporada na hora (campeões, acesso/
    // rebaixamento, novo calendário) em vez de só marcar "fora de temporada" e travar
    // o jogo — ver src/lib/game/season/rollover.ts.
    await performSeasonRollover();
  }

  try {
    await clearReadiness(round);
  } catch (err) {
    // Não deixamos uma falha de Redis derrubar uma rodada inteira já persistida no
    // Postgres — o pior caso é o set de readiness expirar sozinho (TTL de 3 dias).
    console.error("Falha ao limpar readiness no Redis (rodada já processada normalmente):", err);
  }

  return { round, matchesSimulated: pendingMatches.length };
}
