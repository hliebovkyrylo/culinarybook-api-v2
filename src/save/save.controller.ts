import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { User } from '@prisma/client';
import { SaveService } from './save.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('save')
export class SaveController {
  constructor(private saveService: SaveService) {}

  @Post('create/for/:recipeId')
  @UseGuards(AuthGuard)
  async createSave(
    @Req() req: FastifyRequest,
    @Param('recipeId') recipeId: string,
  ): Promise<string> {
    const user = req.user as User;

    return this.saveService.createSave(recipeId, user.id);
  }

  @Delete('for/:recipeId/delete')
  @UseGuards(AuthGuard)
  async removeSave(
    @Req() req: FastifyRequest,
    @Param('recipeId') recipeId: string,
  ): Promise<string> {
    const user = req.user as User;

    return this.saveService.removeSave(recipeId, user.id);
  }

  @Get('for/:recipeId/state')
  @UseGuards(AuthGuard)
  async getSaveState(
    @Req() req: FastifyRequest,
    @Param('recipeId') recipeId: string,
  ): Promise<{ isSaved: boolean }> {
    const user = req.user as User;

    return this.saveService.getSaveState(recipeId, user.id);
  }
}
