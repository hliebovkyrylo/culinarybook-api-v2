import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Follow, Like, Recipe, Saved, User, Visited } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPreviewDto } from './dto/user-preview.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      if (error.code === 'P2002') {
        throw new ConflictException(
          'Unique constraint failed on the fields: ' + error.meta.target,
        );
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getRecommendedUsers(
    userId: string,
    page: number = 1,
    limit: number = 10,
    username?: string,
  ): Promise<UserPreviewDto[]> {
    try {
      const timeThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const userInteractions = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          like: {
            where: { createdAt: { gte: timeThreshold } },
            include: { recipe: true },
          },
          saved: {
            where: { createdAt: { gte: timeThreshold } },
            include: { recipe: true },
          },
          visited: {
            where: { createdAt: { gte: timeThreshold } },
            include: { recipe: true },
          },
        },
      });

      const allRecipes = [
        ...(userInteractions?.like.map((l) => l.recipe) || []),
        ...(userInteractions?.saved.map((s) => s.recipe) || []),
        ...(userInteractions?.visited.map((v) => v.recipe) || []),
      ];

      if (allRecipes.length === 0) {
        return await this.getPopularUsers(userId, page, limit, username);
      }

      const typesOfFood = new Set(
        allRecipes.map((recipe) => recipe.typeOfFood),
      );

      const { titleTfIdf, ingredientsTfIdf } = this.calculateTfIdf(allRecipes);

      const topTitleKeywords = this.getTopKeywords(titleTfIdf, 30);
      const topIngredientsKeywords = this.getTopKeywords(ingredientsTfIdf, 30);

      const recommendedUsers = await this.prisma.user.findMany({
        where: {
          id: { not: userId },
          username: {
            contains: username,
            mode: 'insensitive',
          },
          recipe: {
            some: {
              OR: [
                {
                  title: {
                    in:
                      topTitleKeywords.length > 0
                        ? topTitleKeywords
                        : undefined,
                  },
                },
                {
                  ingradients: {
                    in:
                      topIngredientsKeywords.length > 0
                        ? topIngredientsKeywords
                        : undefined,
                  },
                },
                { typeOfFood: { in: Array.from(typesOfFood) } },
              ],
            },
          },
        },
        include: {
          recipe: {
            include: {
              like: true,
              saved: true,
              visited: true,
            },
          },
          follows: true,
        },
        orderBy: [
          { follows: { _count: 'desc' } },
          { recipe: { _count: 'desc' } },
        ],
        skip: (page - 1) * limit,
        take: limit,
      });

      const scoredUsers = await Promise.all(
        recommendedUsers.map(async (user) => {
          const score = await this.calculateUserScore(
            user,
            topTitleKeywords,
            topIngredientsKeywords,
            typesOfFood,
          );
          return {
            ...user,
            score,
            followersCount: user.follows.length,
            recipesCount: user.recipe.length,
          };
        }),
      );

      return scoredUsers.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error in getRecommendedUsers:', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getPopularUsers(
    userId?: string,
    page: number = 1,
    limit: number = 10,
    username?: string,
  ): Promise<UserPreviewDto[]> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const popularUsers = await this.prisma.user.findMany({
        where: {
          id: { not: userId },
          username: {
            contains: username,
            mode: 'insensitive',
          },
        },
        include: {
          follows: {
            where: {
              createdAt: { gte: oneDayAgo },
            },
          },
          _count: {
            select: { follows: true, recipe: true },
          },
          recipe: {
            include: {
              like: true,
              saved: true,
              visited: true,
            },
          },
        },
        orderBy: {
          follows: { _count: 'desc' },
        },
      });

      const popularUserInfo = popularUsers.map((user) => ({
        ...user,
        followersCount: user._count.follows,
        recipesCount: user._count.recipe,
      }));

      const sortedPopularUsers = popularUserInfo.sort((a, b) => {
        const aRecentFollowers = a.follows.length;
        const bRecentFollowers = b.follows.length;
        if (aRecentFollowers !== bRecentFollowers) {
          return bRecentFollowers - aRecentFollowers;
        }
        return b.followersCount - a.followersCount;
      });

      return sortedPopularUsers.slice((page - 1) * limit, page * limit);
    } catch (error) {
      console.error('Error in getPopularUsers:', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  private calculateTfIdf(recipes: Recipe[]): {
    titleTfIdf: Record<string, number>;
    ingredientsTfIdf: Record<string, number>;
  } {
    const totalDocuments = recipes.length;
    const fields: ('title' | 'ingradients')[] = ['title', 'ingradients'];

    return fields.reduce(
      (acc, field) => {
        const wordFrequency = {};
        const wordDocumentFrequency = {};

        recipes.forEach((recipe) => {
          const words = String(recipe[field]).toLowerCase().split(/\s+/);
          const uniqueWords = new Set(words);

          uniqueWords.forEach((word) => {
            wordDocumentFrequency[word] =
              (wordDocumentFrequency[word] || 0) + 1;
          });

          words.forEach((word) => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          });
        });

        const tfidf = {};
        Object.keys(wordFrequency).forEach((word) => {
          const tf = wordFrequency[word] / totalDocuments;
          const idf = Math.log(
            totalDocuments / (wordDocumentFrequency[word] || 1),
          );
          tfidf[word] = tf * idf;
        });

        acc[`${field}TfIdf`] = tfidf;
        return acc;
      },
      {} as {
        titleTfIdf: Record<string, number>;
        ingredientsTfIdf: Record<string, number>;
      },
    );
  }

  private getTopKeywords(
    tfidf: Record<string, number>,
    count: number,
  ): string[] {
    if (tfidf) {
      return Object.entries(tfidf)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map((entry) => entry[0]);
    } else {
      return [];
    }
  }

  private async calculateUserScore(
    user: User & {
      recipe: (Recipe & {
        like: Like[];
        saved: Saved[];
        visited: Visited[];
      })[];
      follows: Follow[];
    },
    topTitleKeywords: string[],
    topIngredientsKeywords: string[],
    typesOfFood: Set<string>,
  ): Promise<number> {
    const recipeScores = user.recipe.map((recipe) => {
      const titleRelevance = topTitleKeywords.filter((keyword) =>
        recipe.title.toLowerCase().includes(keyword),
      ).length;

      const ingredientsRelevance = topIngredientsKeywords.filter((keyword) =>
        recipe.ingradients.toLowerCase().includes(keyword),
      ).length;

      const typeOfFoodRelevance = typesOfFood.has(recipe.typeOfFood) ? 1 : 0;
      const popularity =
        recipe.like.length + recipe.saved.length + recipe.visited.length;

      return (
        (titleRelevance * 2 + ingredientsRelevance + typeOfFoodRelevance) *
        popularity
      );
    });

    const recipeScore = recipeScores.reduce((sum, score) => sum + score, 0);
    const followScore = user.follows.length * 10;

    return recipeScore + followScore;
  }
}
