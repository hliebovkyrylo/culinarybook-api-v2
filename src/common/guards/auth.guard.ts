import { FastifyRequest } from 'fastify';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { verifyToken } from '../../utils/token.util';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

export class AuthGuard implements CanActivate {
  constructor(@Inject(UserService) private userService: UserService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const accessToken = req.headers.authorization;

    if (!accessToken) {
      throw new UnauthorizedException('Access token no provided');
    }

    try {
      const id = verifyToken(accessToken);
      const user = await this.userService.getUserById(id);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      req.user = user;
      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Access token has expired');
      }

      if (error instanceof JsonWebTokenError) {
        throw new BadRequestException('Access token is not valid');
      }
    }
  }
}
