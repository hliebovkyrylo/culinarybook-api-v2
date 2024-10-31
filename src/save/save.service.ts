import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SaveService {
  constructor(private prisma: PrismaService) {}

  async createSave(recipeId: string, userId: string): Promise<string> {
    try {
      const recipe = await this.prisma.recipe.findFirst({
        where: { id: recipeId },
      });

      if (!recipe) {
        throw new NotFoundException('Recipe not found');
      }

      const isAlreadySaved = await this.prisma.saved.findFirst({
        where: { userId: userId, recipeId: recipeId },
      });

      if (isAlreadySaved) {
        throw new ConflictException('Already saved');
      }

      await this.prisma.saved.create({
        data: { userId: userId, recipeId: recipeId },
      });

      if (userId !== recipe.ownerId) {
        await this.prisma.notification.create({
          data: {
            userId: recipe.ownerId,
            noficitaionCreatorId: userId,
            type: 'save',
            recipeId: recipeId,
          },
        });
      }

      return 'Saved';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async removeSave(recipeId: string, userId: string): Promise<string> {
    try {
      const save = await this.prisma.saved.findFirst({
        where: { recipeId: recipeId, userId: userId },
      });

      if (!save) {
        throw new NotFoundException('Save not found');
      }

      await this.prisma.saved.delete({
        where: { id: save.id },
      });

      const notification = await this.prisma.notification.findFirst({
        where: {
          noficitaionCreatorId: userId,
          recipeId: recipeId,
          type: 'save',
        },
      });

      if (notification) {
        await this.prisma.notification.delete({
          where: { id: notification.id },
        });
      }

      return 'Save removed';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getSaveState(
    recipeId: string,
    userId: string,
  ): Promise<{ isSaved: boolean }> {
    const save = await this.prisma.saved.findFirst({
      where: { userId: userId, recipeId: recipeId },
    });

    return { isSaved: !!save };
  }
}
