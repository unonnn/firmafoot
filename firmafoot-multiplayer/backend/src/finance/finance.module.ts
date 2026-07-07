import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [FinanceService, PrismaService],
  exports: [FinanceService],
})
export class FinanceModule {}
