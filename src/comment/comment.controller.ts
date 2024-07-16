import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { FastifyRequest } from 'fastify';
import { AuthGuard } from '../common/guards/auth.guard';
import { User, Comment } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post('create/for/recipe/:recipeId')
  @UseGuards(AuthGuard)
  async createComment(
    @Req() req: FastifyRequest,
    @Body() createCommentDto: CreateCommentDto,
    @Param('recipeId') recipeId: string,
  ): Promise<Comment> {
    const user = req.user as User;

    return this.commentService.createComment(recipeId, user, createCommentDto);
  }
}
