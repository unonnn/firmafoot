import { Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [MatchService, PrismaService],
})
export class MatchModule {}
