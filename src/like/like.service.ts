import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService) {}

  async createLike(recipeId: string, userId: string): Promise<string> {
    try {
      const recipe = await this.prisma.recipe.findFirst({
        where: { id: recipeId },
      });

      if (!recipe) {
        throw new NotFoundException('Recipe not found');
      }

      const isAlreadyLiked = await this.prisma.like.findFirst({
        where: { recipeId: recipeId, userId: userId },
      });

      if (isAlreadyLiked) {
        throw new ConflictException('Already liked');
      }

      await this.prisma.like.create({
        data: {
          userId: userId,
          recipeId: recipeId,
        },
      });

      if (recipe.ownerId.toString() !== userId.toString()) {
        await this.prisma.notification.create({
          data: {
            userId: recipe.ownerId,
            noficitaionCreatorId: userId,
            type: 'like',
            recipeId: recipeId,
          },
        });
      }

      return 'Like created';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async removeLike(recipeId: string, userId: string): Promise<string> {
    try {
      const like = await this.prisma.like.findFirst({
        where: { recipeId: recipeId, userId: userId },
      });

      if (!like) {
        throw new NotFoundException('Like not found');
      }

      await this.prisma.like.delete({
        where: { id: like.id },
      });

      const notification = await this.prisma.notification.findFirst({
        where: {
          noficitaionCreatorId: userId,
          recipeId: like.recipeId,
          type: 'like',
        },
      });

      if (notification) {
        await this.prisma.notification.delete({
          where: { id: notification.id },
        });
      }

      return 'Like removed';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getLikeState(
    recipeId: string,
    userId: string,
  ): Promise<{ isLiked: boolean }> {
    const like = await this.prisma.like.findFirst({
      where: { recipeId: recipeId, userId: userId },
    });

    return { isLiked: !!like };
  }
}
