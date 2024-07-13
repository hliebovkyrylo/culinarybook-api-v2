import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { createAccessToken, createRefreshToken } from '../utils/token.util';
import { SignInDto } from './dto/sign-in.dto';
import { FastifyInstance } from 'fastify';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('FASTIFY_INSTANCE') private readonly fastify: FastifyInstance,
  ) {}

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

  async handleOAuthLogin(profile: any) {
    try {
      const email = profile.email;
      let user = await this.prisma.user.findFirst({
        where: {
          email: email,
        },
      });

      if (!user) {
        const randomPassword = this.generateRandomString(8);
        const hashedRandomPassword = await bcrypt.hash(randomPassword, 8);

        user = await this.prisma.user.create({
          data: {
            email: email,
            username: email + email.split('@')[0],
            name: profile.name,
            image: '',
            backgroundImage: '',
            isVerified: true,
            canResetPassword: false,
            password: hashedRandomPassword,
            isPrivate: false,
          },
        });
      }

      const access_token = createAccessToken(user.id);
      const refresh_token = createRefreshToken(user.id);

      return { access_token, refresh_token };
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Internal server error');
    }
  }

  private generateRandomString(length: number): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }
}
