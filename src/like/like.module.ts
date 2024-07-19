import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [LikeController],
  providers: [LikeService, UserService],
  exports: [LikeService],
})
export class LikeModule {}
