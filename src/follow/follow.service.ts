import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  async createFollow(
    requesterId: string,
    requestedId: string,
  ): Promise<string> {
    try {
      const requestedUser = await this.prisma.user.findUnique({
        where: { id: requestedId },
      });

      if (!requestedUser) {
        throw new NotFoundException('User not found');
      }

      const isAlreadyFollowed = await this.prisma.follow.findFirst({
        where: { userId: requestedId, followerId: requesterId },
      });

      if (isAlreadyFollowed) {
        throw new ConflictException('Already followed');
      }

      if (requestedUser.isPrivate) {
        await this.prisma.followRequest.create({
          data: { requesterId: requesterId, requestedId: requestedId },
        });
        await this.prisma.notification.create({
          data: {
            userId: requestedId,
            noficitaionCreatorId: requesterId,
            type: 'follow-request',
            recipeId: null,
          },
        });
      } else {
        await this.prisma.follow.create({
          data: { followerId: requesterId, userId: requestedId },
        });
        await this.prisma.notification.create({
          data: {
            userId: requestedId,
            noficitaionCreatorId: requesterId,
            type: 'follow',
            recipeId: null,
          },
        });
      }

      return requestedUser.isPrivate ? 'Follow request sent' : 'Followed';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
