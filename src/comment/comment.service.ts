import {
  ConflictException, Get,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException, Param
} from "@nestjs/common";
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
}
