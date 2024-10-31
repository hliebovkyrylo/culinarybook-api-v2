import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/auth.guard';
import { FastifyRequest } from 'fastify';
import { UserDto } from './dto/user.dto';
import { UserMeDto } from './dto/user-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPreviewDto } from './dto/user-preview.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('get/me')
  @UseGuards(AuthGuard)
  async getMe(@Request() req: FastifyRequest): Promise<UserMeDto> {
    const user = req.user as User;
    const userMe = await this.userService.getUserById(user.id);

    return new UserMeDto(userMe);
  }

  @Get('get/:userId')
  async getUserById(@Param('userId') userId: string): Promise<UserDto> {
    const user = await this.userService.getUserById(userId);
    return new UserDto(user);
  }

  @Patch('update')
  @UseGuards(AuthGuard)
  async updateUser(
    @Request() req: FastifyRequest,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserMeDto> {
    const user = req.user as User;
    const updatedUser = await this.userService.updateUser(
      user.id,
      updateUserDto,
    );

    return new UserMeDto(updatedUser);
  }

  @Get('/recommended/users/get')
  @UseGuards(AuthGuard)
  async getRecommendedUsers(
    @Request() req: FastifyRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('username') username?: string,
  ): Promise<{ users: UserPreviewDto[] }> {
    const user = req.user as User;
    const users = await this.userService.getRecommendedUsers(
      user.id,
      +page,
      +limit,
      username,
    );

    return { users: users.map((user) => new UserPreviewDto(user)) };
  }

  @Get('/popular/users/get')
  async getPopularUsers(): Promise<{ users: UserPreviewDto[] }> {
    const users = await this.userService.getPopularUsers();
    return { users: users.map((user) => new UserPreviewDto(user)) };
  }
}
