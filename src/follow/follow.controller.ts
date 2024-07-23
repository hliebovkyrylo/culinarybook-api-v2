import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { FastifyRequest } from 'fastify';
import { User } from '@prisma/client';

@Controller('follow')
export class FollowController {
  constructor(private followService: FollowService) {}

  @Post('create/for/:userId')
  @UseGuards(AuthGuard)
  async createFollow(
    @Req() req: FastifyRequest,
    @Param('userId') userId: string,
  ): Promise<string> {
    const user = req.user as User;

    return this.followService.createFollow(user.id, userId);
  }
}
