import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CommentReplyService } from './comment-reply.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { FastifyRequest } from 'fastify';
import { CreateCommentReplyDto } from './dto/create-comment-reply.dto';
import { CommentReply, User } from '@prisma/client';

@Controller('comment-reply')
export class CommentReplyController {
  constructor(private commentReplyService: CommentReplyService) {}

  @Post('create/for/:commentId')
  @UseGuards(AuthGuard)
  async createCommentReply(
    @Req() req: FastifyRequest,
    @Body() createCommentReplyDto: CreateCommentReplyDto,
    @Param('commentId') commentId: string,
  ): Promise<CommentReply> {
    const user = req.user as User;

    return this.commentReplyService.createCommentReply(
      commentId,
      user.id,
      createCommentReplyDto,
    );
  }
}
