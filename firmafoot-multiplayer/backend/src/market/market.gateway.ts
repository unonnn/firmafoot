import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'market',
})
export class MarketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MarketGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway do Mercado de Transferências inicializado com sucesso.');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Conectado no Mercado: Cliente ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Desconectado do Mercado: Cliente ${client.id}`);
  }

  /**
   * Handles incoming placeBid event.
   * Format: client.emit('placeBid', { auctionId: string, managerId: string, bidAmount: number })
   */
  @SubscribeMessage('placeBid')
  async handlePlaceBid(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string; managerId: string; bidAmount: number }
  ) {
    const { auctionId, managerId, bidAmount } = data;

    try {
      // Execute the bid operation inside an ACID transaction to prevent concurrency race conditions
      const updatedAuction = await this.prisma.$transaction(async (tx) => {
        // 1. Fetch current auction status
        const auction = await tx.marketAuction.findUnique({
          where: { id: auctionId },
          include: { player: true },
        });

        if (!auction) {
          throw new BadRequestException('Leilão não encontrado.');
        }

        // 2. Check if auction has already expired
        if (new Date() > new Date(auction.dataExpiracao)) {
          throw new BadRequestException('O leilão deste jogador já expirou.');
        }

        // 3. Check if the new bid is higher than the current bid
        const currentBid = Number(auction.lanceAtual);
        if (bidAmount <= currentBid) {
          throw new BadRequestException(`O lance deve ser maior do que o atual de R$ ${currentBid.toLocaleString('pt-BR')}`);
        }

        // 4. Verify that bidder has sufficient funds to back this bid
        const user = await tx.user.findUnique({
          where: { id: managerId },
        });

        if (!user) {
          throw new BadRequestException('Treinador não cadastrado.');
        }

        const balance = Number(user.saldoFinanceiro);
        if (balance < bidAmount) {
          throw new BadRequestException(`Saldo insuficiente para realizar este lance.`);
        }

        // 5. Success: update the auction with the new bid and highest bidder
        return tx.marketAuction.update({
          where: { id: auctionId },
          data: {
            lanceAtual: new Prisma.Decimal(bidAmount),
            maiorLanceUserId: managerId,
          },
          include: {
            player: true,
            maiorLanceUser: {
              select: { nome: true },
            },
          },
        });
      });

      // 6. Broadcast updated auction to all connected clients
      this.server.emit('auctionUpdate', {
        auctionId: updatedAuction.id,
        playerId: updatedAuction.playerId,
        playerName: updatedAuction.player.nome,
        lanceAtual: Number(updatedAuction.lanceAtual),
        maiorLanceUserId: updatedAuction.maiorLanceUserId,
        maiorLanceUserName: updatedAuction.maiorLanceUser?.nome || 'Nenhum',
        dataExpiracao: updatedAuction.dataExpiracao,
      });

      return { success: true, message: 'Lance efetuado com sucesso!' };

    } catch (err) {
      this.logger.warn(`Erro ao registrar lance do cliente ${client.id}: ${err.message}`);
      client.emit('auctionError', { message: err.message });
      return { success: false, error: err.message };
    }
  }
}
