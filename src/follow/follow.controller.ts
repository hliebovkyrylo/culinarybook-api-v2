import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { FastifyRequest } from 'fastify';
import { User } from '@prisma/client';
import { ResponseFollowRequestDto } from './dto/response-follow-request.dto';

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

  @Post('follow-request/user/:userId/is-allow')
  @UseGuards(AuthGuard)
  async responseFollowRequest(
    @Req() req: FastifyRequest,
    @Param('userId') userId: string,
    @Body() responseFollowRequestDto: ResponseFollowRequestDto,
  ): Promise<string> {
    const user = req.user as User;

    return this.followService.responseFollowRequest(
      userId,
      user.id,
      responseFollowRequestDto,
    );
  }
}
