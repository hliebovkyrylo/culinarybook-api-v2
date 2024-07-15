import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlacklistService } from './blacklist.service';

@Module({
  imports: [PrismaModule],
  providers: [BlacklistService],
  exports: [BlacklistService],
})
export class BlacklistModule {}
