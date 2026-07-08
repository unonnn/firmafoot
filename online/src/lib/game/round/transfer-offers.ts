import { db } from "@/db";
import { players, teams, transferOffers, messages } from "@/db/schema";
import { eq, ne } from "drizzle-orm";

const CHANCE_PROPOSTA_POR_RODADA = 0.15;

// Sorteia propostas de compra da CPU para jogadores listados para transferência.
// Portado de js/main.js:1515-1555. A resolução (aceitar/recusar) vira uma action
// separada (resolveTransferOfferAction em actions/market.ts) — a tela de inbox que
// chama isso é trabalho da Fase 6.
export async function generateTransferOffersForListedPlayers(round: number) {
  const listados = await db.select().from(players).where(eq(players.transferListed, true));

  for (const p of listados) {
    if (p.isInjured || !p.teamId) continue;
    if (Math.random() >= CHANCE_PROPOSTA_POR_RODADA) continue;

    const candidatos = await db.select().from(teams).where(ne(teams.id, p.teamId));
    const comprador = candidatos[Math.floor(Math.random() * candidatos.length)];
    if (!comprador) continue;

    const valorProposta = Math.round(p.value * (0.85 + Math.random() * 0.25));
    if (comprador.balance < valorProposta) continue;

    const [oferta] = await db.insert(transferOffers).values({
      fromTeamId: comprador.id,
      toTeamId: p.teamId,
      playerId: p.id,
      type: "buy",
      feeValue: valorProposta,
      salaryPct: 100,
      status: "pending",
      round,
    }).returning();

    const [sellerTeam] = await db.select().from(teams).where(eq(teams.id, p.teamId));
    if (sellerTeam?.userId) {
      await db.insert(messages).values({
        userId: sellerTeam.userId,
        sender: comprador.name,
        subject: `Proposta Oficial: ${p.name}`,
        content: `O ${comprador.name} enviou uma proposta de R$ ${valorProposta.toLocaleString("pt-BR")} pelo passe de ${p.name} (${p.position}, força ${p.strength}), que está listado para transferência.`,
        mandatory: true,
        actionType: "transfer_offer",
        actionData: { offerId: oferta.id },
      });
    }
  }
}
