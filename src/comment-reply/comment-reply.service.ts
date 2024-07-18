import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentReply } from '@prisma/client';
import { CreateCommentReplyDto } from './dto/create-comment-reply.dto';

@Injectable()
export class CommentReplyService {
  constructor(private prisma: PrismaService) {}

  async createCommentReply(
    commentId: string,
    userId: string,
    createCommentReplyDto: CreateCommentReplyDto,
  ): Promise<CommentReply> {
    try {
      const comment = await this.prisma.comment.findFirst({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      const commentReplies = await this.prisma.commentReply.findMany({
        where: {
          commentText: createCommentReplyDto.commentText,
          commentId: commentId,
          userId: userId,
        },
      });

      if (commentReplies.length >= 5) {
        throw new ConflictException('More than 5 comment with the same text');
      }

      const commentReply = await this.prisma.commentReply.create({
        data: {
          commentText: createCommentReplyDto.commentText,
          userId: userId,
          commentId: commentId,
        },
      });

      if (userId.toString() !== comment.userId.toString()) {
        await this.prisma.notification.create({
          data: {
            userId: comment.userId,
            noficitaionCreatorId: userId,
            type: 'comment-reply',
            noficationData: createCommentReplyDto.commentText,
            recipeId: comment.recipeId,
          },
        });
      }

      return commentReply;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
