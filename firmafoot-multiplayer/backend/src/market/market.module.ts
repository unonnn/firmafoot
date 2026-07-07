import { Module } from '@nestjs/common';
import { MarketGateway } from './market.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [MarketGateway, PrismaService],
})
export class MarketModule {}
