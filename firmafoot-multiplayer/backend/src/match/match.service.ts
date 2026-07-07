import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MatchStatus, Prisma } from '@prisma/client';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron Job that runs periodically
   * to automatically simulate scheduled matches that are currently PENDING.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async executeScheduledMatches() {
    this.logger.log('Iniciando processamento de partidas agendadas...');

    // Fetch pending matches scheduled on or before the current time
    const pendingMatches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.PENDENTE,
        dataAgendada: {
          lte: new Date(),
        },
      },
      include: {
        homeTeam: {
          include: {
            jogadores: true,
            owner: true,
          },
        },
        awayTeam: {
          include: {
            jogadores: true,
            owner: true,
          },
        },
      },
    });

    if (pendingMatches.length === 0) {
      this.logger.log('Nenhuma partida pendente encontrada para simulação.');
      return;
    }

    this.logger.log(`Encontrada(s) ${pendingMatches.length} partida(s) para simulação.`);

    for (const match of pendingMatches) {
      try {
        await this.simulateAndSaveMatch(match);
      } catch (err) {
        this.logger.error(`Falha ao simular partida ${match.id}: ${err.message}`);
      }
    }
  }

  /**
   * Simulates a match based on the relative overall force of players and updates database states.
   */
  private async simulateAndSaveMatch(match: any) {
    const homeTeam = match.homeTeam;
    const awayTeam = match.awayTeam;

    const homeForce = homeTeam.jogadores.reduce((sum: number, p: any) => sum + p.forca, 0) / Math.max(1, homeTeam.jogadores.length);
    const awayForce = awayTeam.jogadores.reduce((sum: number, p: any) => sum + p.forca, 0) / Math.max(1, awayTeam.jogadores.length);

    const homeAdvantage = 5; 
    const probabilityDiff = (homeForce - awayForce) + homeAdvantage;

    let golsHome = 0;
    let golsAway = 0;

    for (let chance = 0; chance < 5; chance++) {
      const roll = Math.random() * 100;
      if (roll < 25) {
        const goalRoll = Math.random() * 100;
        const homeScoreChance = 50 + probabilityDiff * 1.5;
        
        if (goalRoll < homeScoreChance) {
          golsHome++;
        } else {
          golsAway++;
        }
      }
    }

    const occupancyRate = 0.6 + Math.random() * 0.4;
    const crowd = Math.round(homeTeam.capacidade * occupancyRate);
    const ticketPrice = 45;
    const matchRevenue = crowd * ticketPrice;

    await this.prisma.$transaction(async (tx) => {
      // 1. Update match record
      await tx.match.update({
        where: { id: match.id },
        data: {
          golsHome,
          golsAway,
          status: MatchStatus.FINALIZADA,
        },
      });

      // 2. Credit match ticket revenue to home team owner's balance
      if (homeTeam.owner) {
        const currentBalance = Number(homeTeam.owner.saldoFinanceiro);
        await tx.user.update({
          where: { id: homeTeam.owner.id },
          data: {
            saldoFinanceiro: new Prisma.Decimal(currentBalance + matchRevenue),
          },
        });
      }

      // 3. Credit victory bonuses
      const victoryBonus = 100000;
      if (golsHome > golsAway && homeTeam.owner) {
        const balance = Number(homeTeam.owner.saldoFinanceiro);
        await tx.user.update({
          where: { id: homeTeam.owner.id },
          data: { saldoFinanceiro: new Prisma.Decimal(balance + victoryBonus) },
        });
      } else if (golsAway > golsHome && awayTeam.owner) {
        const balance = Number(awayTeam.owner.saldoFinanceiro);
        await tx.user.update({
          where: { id: awayTeam.owner.id },
          data: { saldoFinanceiro: new Prisma.Decimal(balance + victoryBonus) },
        });
      }
    });

    this.logger.log(
      `Partida ${match.id} Finalizada: ${homeTeam.nome} ${golsHome} x ${golsAway} ${awayTeam.nome}. Público: ${crowd.toLocaleString()} pagantes.`
    );
  }
}
