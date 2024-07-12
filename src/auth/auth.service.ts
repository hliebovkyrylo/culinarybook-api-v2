import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { createAccessToken, createRefreshToken } from '../utils/token.util';
import { SignInDto } from './dto/sign-in.dto';
import { Profile } from 'passport-google-oauth20';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signUp(
    data: SignUpDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 8);
      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          isVerified: false,
          canResetPassword: false,
        },
      });

      const access_token = createAccessToken(user.id);
      const refresh_token = createRefreshToken(user.id);

      return { access_token, refresh_token };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `This ${error.meta?.target === 'User_email_key' ? 'email' : 'username'} already exist`,
        );
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async signIn(
    data: SignInDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: data.email,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isCorrectPassword = await bcrypt.compare(
        data.password,
        user.password,
      );

      if (!isCorrectPassword) {
        throw new BadRequestException('Invalid data provided');
      }

      const access_token = createAccessToken(user.id);
      const refresh_token = createRefreshToken(user.id);

      return { access_token, refresh_token };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
