import { db } from "@/db";
import { players, teams, messages } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";

// Devolve um jogador emprestado ao clube de origem, restaurando o salário original.
// Usado tanto pelo vencimento automático do contrato (`processarEmprestimos`, ao
// final da rodada) quanto pela devolução antecipada feita manualmente pelo técnico
// (ver actions/players.ts). Portado de js/main.js:1464-1513 e
// js/components/tactics.js:875-901.
export async function returnPlayerFromLoan(playerId: number) {
  const [p] = await db.select().from(players).where(eq(players.id, playerId));
  if (!p || !p.loanFromTeamId) return;

  const origemId = p.loanFromTeamId;

  await db.update(players).set({
    teamId: origemId,
    loanFromTeamId: null,
    loanRoundsLeft: null,
    salary: p.originalSalary ?? p.salary,
    originalSalary: null,
    characteristic: null, // sai de qualquer escalação do time que o emprestava
  }).where(eq(players.id, p.id));

  const [emprestador, origem] = await Promise.all([
    p.teamId ? db.select().from(teams).where(eq(teams.id, p.teamId)).then((r) => r[0]) : undefined,
    db.select().from(teams).where(eq(teams.id, origemId)).then((r) => r[0]),
  ]);

  const destinatarios = [emprestador?.userId, origem?.userId].filter((id): id is string => Boolean(id));
  for (const userId of destinatarios) {
    await db.insert(messages).values({
      userId,
      sender: "Departamento de Futebol",
      subject: `Fim do Empréstimo: ${p.name}`,
      content: `O contrato de empréstimo do atleta ${p.name} (${p.position}, força ${p.strength}) expirou. O jogador retornou ao seu clube de origem${origem ? `, o ${origem.name}` : ""}.`,
    });
  }
}

// Decrementa o tempo de empréstimo de todo mundo e devolve quem chegou a zero.
// `loanRoundsLeft === null` significa "até o fim da temporada": não expira sozinho
// rodada a rodada, só na virada de temporada (Fase 8) ou devolução manual antecipada.
// Portado de js/main.js:1464-1513.
export async function processarEmprestimos() {
  const emprestados = await db.select().from(players).where(isNotNull(players.loanFromTeamId));

  for (const p of emprestados) {
    if (p.loanRoundsLeft === null) continue;

    const roundsLeft = p.loanRoundsLeft - 1;
    if (roundsLeft > 0) {
      await db.update(players).set({ loanRoundsLeft: roundsLeft }).where(eq(players.id, p.id));
      continue;
    }

    await returnPlayerFromLoan(p.id);
  }
}
