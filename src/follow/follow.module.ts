import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [FollowController],
  providers: [FollowService, UserService],
  exports: [FollowService],
})
export class FollowModule {}
