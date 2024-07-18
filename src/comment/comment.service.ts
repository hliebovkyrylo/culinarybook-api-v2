import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Comment, User } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async createComment(
    recipeId: string,
    user: User,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    try {
      const recipe = await this.prisma.recipe.findFirst({
        where: { id: recipeId },
      });

      if (!recipe) {
        throw new NotFoundException('Recipe not found');
      }

      const existedComments = await this.prisma.comment.findMany({
        where: {
          recipeId: recipeId,
          userId: user.id,
          commentText: createCommentDto.commentText,
        },
      });

      if (existedComments.length > 5) {
        throw new ConflictException(
          'You have posted more than 5 comments with the same text',
        );
      }

      return this.prisma.comment.create({
        data: { ...createCommentDto, recipeId: recipeId, userId: user.id },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getCommentsByRecipeId(recipeId: string): Promise<Comment[]> {
    try {
      return this.prisma.comment.findMany({
        where: { recipeId: recipeId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, image: true, username: true },
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async deleteComment(userId: string, commentId: string): Promise<string> {
    try {
      const comment = await this.prisma.comment.findFirst({
        where: { id: commentId },
        include: { user: { select: { id: true } } },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      if (userId.toString() !== comment.user.id.toString()) {
        throw new ForbiddenException('Have no access to change comment');
      }

      await this.prisma.comment.delete({
        where: { id: commentId },
      });

      const notification = await this.prisma.notification.findFirst({
        where: {
          recipeId: comment.recipeId,
          noficitaionCreatorId: userId,
          type: 'comment',
        },
      });

      if (notification) {
        await this.prisma.notification.delete({
          where: { id: notification.id },
        });
      }

      return 'Comment deleted';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
