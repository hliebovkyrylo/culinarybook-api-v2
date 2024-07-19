import {
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { FastifyRequest } from 'fastify';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('like')
export class LikeController {
  constructor(private likeService: LikeService) {}

  @Post('create/for/:recipeId')
  @UseGuards(AuthGuard)
  async createLike(
    @Req() req: FastifyRequest,
    @Param('recipeId') recipeId: string,
  ): Promise<string> {
    const user = req.user as User;

    return this.likeService.createLike(recipeId, user.id);
  }

  @Delete('for/:recipeId/delete')
  @UseGuards(AuthGuard)
  async removeLike(
    @Req() req: FastifyRequest,
    @Param('recipeId') recipeId: string,
  ): Promise<string> {
    const user = req.user as User;

    return this.likeService.removeLike(recipeId, user.id);
  }
}
