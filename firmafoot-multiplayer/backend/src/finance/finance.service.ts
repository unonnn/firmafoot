import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Debits the cost of a player purchase from the manager's balance and handles ownership transfer.
   * Leverages Prisma's interactive transactions ($transaction) to guarantee ACID consistency.
   */
  async purchasePlayer(managerId: string, playerId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch manager profile
      const user = await tx.user.findUnique({
        where: { id: managerId },
        include: { team: true },
      });

      if (!user) {
        throw new BadRequestException('Treinador não encontrado.');
      }

      if (!user.team) {
        throw new BadRequestException('O treinador não possui um clube associado.');
      }

      const balance = Number(user.saldoFinanceiro);
      if (balance < amount) {
        throw new BadRequestException(
          `Saldo insuficiente. Saldo atual: R$ ${balance.toLocaleString('pt-BR')}, Custo: R$ ${amount.toLocaleString('pt-BR')}`
        );
      }

      // 2. Fetch Player to check availability
      const player = await tx.player.findUnique({
        where: { id: playerId },
      });

      if (!player) {
        throw new BadRequestException('Jogador não encontrado.');
      }

      // If the player is already owned by this manager's team
      if (player.teamId === user.team.id) {
        throw new BadRequestException('O jogador já faz parte do seu elenco.');
      }

      // 3. Deduct balance from manager
      const updatedUser = await tx.user.update({
        where: { id: managerId },
        data: {
          saldoFinanceiro: new Prisma.Decimal(balance - amount),
        },
      });

      // 4. If player belonged to another team, credit that team's owner balance
      if (player.teamId) {
        const formerTeam = await tx.team.findUnique({
          where: { id: player.teamId },
          include: { owner: true },
        });

        if (formerTeam && formerTeam.owner) {
          const formerOwnerBalance = Number(formerTeam.owner.saldoFinanceiro);
          await tx.user.update({
            where: { id: formerTeam.owner.id },
            data: {
              saldoFinanceiro: new Prisma.Decimal(formerOwnerBalance + amount),
            },
          });
        }
      }

      // 5. Transfer player to the new team
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          teamId: user.team.id,
        },
      });

      return {
        success: true,
        novoSaldo: Number(updatedUser.saldoFinanceiro),
        jogadorId: updatedPlayer.id,
        timeId: user.team.id,
      };
    });
  }
}
