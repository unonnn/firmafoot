import { db } from "@/db";
import { teams, messages, users } from "@/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { getTeamRank } from "./standings";
import { getConfigValue, CONFIG_KEYS } from "../config";

// Ajusta a confiança da diretoria de um time humano e sinaliza (via mensagem
// acionável — a tela de resolução fica para a Fase 6) risco de demissão ou convite de
// emprego de outro clube. Portado de js/main.js:1557-1635. Só roda para times com
// `userId` — confiança de diretoria não importa para times de CPU.
export async function applyBoardConfidence(
  teamId: number,
  division: string,
  matchOutcome: { won: boolean; drew: boolean },
  currentRound: number
) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team || !team.userId) return;

  let confidence = team.boardConfidence;

  if (matchOutcome.won) confidence = Math.min(100, confidence + 5);
  else if (matchOutcome.drew) confidence = Math.min(100, Math.max(0, confidence + 1));
  else confidence = Math.max(0, confidence - 7);

  const rank = await getTeamRank(division, teamId);
  if (rank <= 4) confidence = Math.min(100, confidence + 1);
  else if (rank >= 17) confidence = Math.max(0, confidence - 2);

  if (team.reputation >= 75 && rank > 10) confidence = Math.max(0, confidence - 2);

  await db.update(teams).set({ boardConfidence: confidence }).where(eq(teams.id, teamId));

  const limiteDemissao = await getConfigValue(CONFIG_KEYS.boardConfidenceFireThreshold, 15);
  const limiteConvite = await getConfigValue(CONFIG_KEYS.boardConfidenceInviteThreshold, 85);
  const rodadaMinimaConvite = await getConfigValue(CONFIG_KEYS.boardConfidenceInviteMinRound, 5);
  const chanceConvite = await getConfigValue(CONFIG_KEYS.boardConfidenceInviteChance, 0.08);

  if (confidence <= limiteDemissao) {
    const técnicoDemitido = team.userId;

    // Demite de verdade: libera o clube e o técnico (o jogador ainda pode escolher
    // qualquer time livre pela tela normal de seleção, ou aceitar uma das 3
    // propostas abaixo direto pela caixa de entrada). Portado de
    // js/main.js:1592-1595, mas aqui a demissão acontece de fato em vez de só marcar
    // uma flag — o mundo compartilhado precisa liberar o clube pra outro jogador.
    await db.update(teams).set({ userId: null }).where(eq(teams.id, teamId));
    await db.update(users).set({ teamId: null }).where(eq(users.id, técnicoDemitido));

    await db.insert(messages).values({
      userId: técnicoDemitido,
      sender: "Diretoria (Presidente)",
      subject: "Você foi Demitido",
      content: `A confiança da diretoria no seu trabalho caiu para ${confidence}% e a diretoria do ${team.name} decidiu encerrar o seu contrato. Escolha um novo clube na tela inicial, ou avalie as propostas abaixo enviadas por outros clubes.`,
      mandatory: true,
      actionType: "fired",
      actionData: { confidence },
      actionDone: true,
    });

    // Oferece 3 propostas de clubes sem técnico, priorizando os de menor reputação
    // (a "metade inferior da tabela" do jogo original) — portado de js/main.js:1781-1881.
    const candidatos = await db.select().from(teams).where(isNull(teams.userId)).orderBy(asc(teams.reputation));
    const escolhidos = candidatos.slice(0, 10).sort(() => 0.5 - Math.random()).slice(0, 3);

    for (const clube of escolhidos) {
      await db.insert(messages).values({
        userId: técnicoDemitido,
        sender: `Presidente do ${clube.name}`,
        subject: `Proposta de Contrato: ${clube.name}`,
        content: `Após sua saída, a diretoria do ${clube.name} gostaria de contar com o seu trabalho para reconstruir o time.`,
        mandatory: true,
        actionType: "job_offer",
        actionData: { teamId: clube.id },
      });
    }

    return;
  }

  if (confidence >= limiteConvite && currentRound >= rodadaMinimaConvite && Math.random() < chanceConvite) {
    const [pendente] = await db.select().from(messages).where(
      and(eq(messages.userId, team.userId), eq(messages.actionType, "job_offer"), eq(messages.actionDone, false))
    );
    if (!pendente) {
      // Só oferece clubes sem técnico humano — não faz sentido convidar para um time
      // que já está sendo comandado por outro jogador no mundo compartilhado.
      const candidatos = await db.select().from(teams).where(isNull(teams.userId));
      const outroClube = candidatos[Math.floor(Math.random() * candidatos.length)];
      if (outroClube) {
        await db.insert(messages).values({
          userId: team.userId,
          sender: `Presidente do ${outroClube.name}`,
          subject: `Proposta de Contrato: ${outroClube.name}`,
          content: `A diretoria do ${outroClube.name} acompanhou seu trabalho e quer formalizar uma proposta para você assumir o comando do clube.`,
          mandatory: true,
          actionType: "job_offer",
          actionData: { teamId: outroClube.id },
        });
      }
    }
  }
}
