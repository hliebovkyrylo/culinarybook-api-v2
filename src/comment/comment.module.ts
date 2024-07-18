import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [CommentController],
  providers: [CommentService, UserService],
  exports: [CommentService],
})
export class CommentModule {}
