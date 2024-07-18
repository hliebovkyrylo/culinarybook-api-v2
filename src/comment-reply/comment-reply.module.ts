import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommentReplyController } from './comment-reply.controller';
import { CommentReplyService } from './comment-reply.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommentReplyController],
  providers: [CommentReplyService, UserService],
  exports: [CommentReplyService],
})
export class CommentReplyModule {}
