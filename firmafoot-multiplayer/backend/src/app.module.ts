import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { MatchModule } from './match/match.module';
import { MarketModule } from './market/market.module';
import { FinanceModule } from './finance/finance.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MatchModule,
    MarketModule,
    FinanceModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
