import { Module } from '@nestjs/common';
import { FeedsController } from './feeds.controller';
import { FeedsService } from './feeds.service';
import { PrismaModule } from '@server/prisma/prisma.module';
import { TrpcModule } from '@server/trpc/trpc.module';

@Module({
  imports: [PrismaModule, TrpcModule],
  controllers: [FeedsController],
  providers: [FeedsService],
})
export class FeedsModule {}
