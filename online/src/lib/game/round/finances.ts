import { db } from "@/db";
import { players, teams, teamSponsors, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTeamRank } from "./standings";
import { getConfigValue, CONFIG_KEYS } from "../config";

export interface ResultadoFinanceiroTime {
  salarios: number;
  jurosEmprestimo: number;
  bonusPatrocinio: number;
  royaltiesMaterial: number;
  bilheteriaLiquida: number;
  saldoAnterior: number;
  saldoNovo: number;
}

// Fator de venda de camisas por posição na tabela: quanto melhor a posição, maior o
// volume de vendas. Portado de js/main.js:1389 (`fatorPos`).
function fatorPosicaoVendas(rank: number): number {
  return Math.max(0.6, Math.min(1.4, 1.4 - (rank - 1) * 0.045));
}

// Percentual de royalties retido pelo investidor SAF sobre a receita de bilheteria.
// Portado de js/main.js:1289-1296.
const TAXA_SAF: Record<string, number> = { textor: 0.15, city: 0.10, minoritaria: 0.04 };

// Aplica salários, juros de empréstimo bancário e bônus de patrocínio (catálogo
// editável no Admin — ver src/db/seed-catalogs.ts) para um time ao final da rodada.
// Portado de js/main.js:1336-1400, generalizado: em vez de 5 blocos hardcoded por
// slot, qualquer patrocínio contratado (team_sponsors) é resolvido genericamente a
// partir do `goalType`/`bonusValue`/`royaltyPct` do catálogo.
export async function applyRoundFinances(
  teamId: number,
  division: string,
  matchOutcome: { won: boolean; goalsFor: number; goalsAgainst: number; ticketRevenue: number }
): Promise<ResultadoFinanceiroTime> {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new Error(`Time ${teamId} não encontrado`);

  const teamPlayers = await db.select({ salary: players.salary }).from(players).where(eq(players.teamId, teamId));
  const salarios = teamPlayers.reduce((sum, p) => sum + p.salary, 0);

  const taxaJuros = await getConfigValue(CONFIG_KEYS.bankLoanInterestRate, 0.05);
  const jurosEmprestimo = team.debt > 0 ? Math.round(team.debt * taxaJuros) : 0;

  // Bilheteria só existe pra quem jogou em casa (ticketRevenue vem 0 pro visitante).
  // SAF (se contratada) retém seu percentual de royalties sobre essa receita —
  // portado de js/main.js:1286-1297.
  const taxaSaf = team.safModel ? TAXA_SAF[team.safModel] ?? 0 : 0;
  const bilheteriaLiquida = Math.round(matchOutcome.ticketRevenue * (1 - taxaSaf));

  const contratos = await db
    .select({ sponsor: sponsors })
    .from(teamSponsors)
    .innerJoin(sponsors, eq(teamSponsors.sponsorId, sponsors.id))
    .where(eq(teamSponsors.teamId, teamId));

  let bonusPatrocinio = 0;
  let royaltiesMaterial = 0;

  if (contratos.length > 0) {
    const rank = await getTeamRank(division, teamId);
    for (const { sponsor } of contratos) {
      // sponsor.baseValue é pago uma única vez, na assinatura (ver signSponsorAction
      // em actions/finances.ts) — só os bônus de meta e royalties são recorrentes.
      if (sponsor.goalType === "win" && matchOutcome.won) {
        bonusPatrocinio += sponsor.bonusValue;
      } else if (sponsor.goalType === "clean_sheet" && matchOutcome.goalsAgainst === 0) {
        bonusPatrocinio += sponsor.bonusValue;
      } else if (sponsor.goalType === "three_goals" && matchOutcome.goalsFor >= 3) {
        bonusPatrocinio += sponsor.bonusValue;
      }

      if (sponsor.royaltyPct > 0) {
        const volumeVendas = team.reputation * 250000 * fatorPosicaoVendas(rank);
        royaltiesMaterial += Math.round(volumeVendas * (sponsor.royaltyPct / 100));
      }
    }
  }

  const saldoAnterior = team.balance;
  const saldoNovo = saldoAnterior - salarios - jurosEmprestimo + bonusPatrocinio + royaltiesMaterial + bilheteriaLiquida;

  await db.update(teams).set({ balance: saldoNovo }).where(eq(teams.id, teamId));

  return { salarios, jurosEmprestimo, bonusPatrocinio, royaltiesMaterial, bilheteriaLiquida, saldoAnterior, saldoNovo };
}
