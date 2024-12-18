import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import {
  createAccessToken,
  createRefreshToken,
  verifyToken,
} from '../utils/token.util';
import { SignInDto } from './dto/sign-in.dto';
import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import * as path from 'node:path';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CanResetPasswordDto } from './dto/can-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async sendConfirmationCode(userId: string, email: string) {
    try {
      const code = crypto.randomInt(100000, 999999).toString();
      const hashedCode = await bcrypt.hash(code, 8);

      const currentCode = await this.prisma.verificationCode.findFirst({
        where: {
          userId: userId,
        },
      });

      if (currentCode) {
        await this.prisma.verificationCode.delete({
          where: {
            id: currentCode.id,
          },
        });
      }

      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 10);

      await this.prisma.verificationCode.create({
        data: {
          code: hashedCode,
          expiryTime: expiryTime.getTime(),
          userId: userId,
        },
      });

      await this.sendCodeToEmail(email, code);

      return 'Code sent';
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async verifyAccount(user: User, code: string) {
    try {
      const trueCode = await this.prisma.verificationCode.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (!trueCode) {
        throw new NotFoundException('Code not found');
      }

      const isCorrectCode = await bcrypt.compare(code, trueCode.code);

      if (!isCorrectCode) {
        throw new ConflictException('Wrong entered code');
      }

      if (Date.now() > trueCode.expiryTime) {
        throw new ConflictException('Code has expired');
      }

      if (user.isVerified) {
        throw new BadRequestException('Account already verified');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
      await this.prisma.verificationCode.delete({ where: { id: trueCode.id } });

      return 'Account verified';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async changePassword(user: User, data: ChangePasswordDto): Promise<string> {
    try {
      const isMatchPasswords = await bcrypt.compare(
        data.oldPassword,
        user.password,
      );

      if (!isMatchPasswords) {
        throw new ConflictException('Old password is not correct');
      }

      if (data.newPassword !== data.confirmNewPassword) {
        throw new ConflictException('Password mismatch');
      }

      const hashedNewPassword = await bcrypt.hash(data.newPassword, 8);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      return 'Password successfully changed';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async forgotPassword(forgotPassword: ForgotPasswordDto): Promise<string> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: forgotPassword.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.sendConfirmationCode(user.id, forgotPassword.email);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async canResetPassword(
    canResetPasswordDto: CanResetPasswordDto,
  ): Promise<string> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: canResetPasswordDto.email },
        include: { vereficationCode: true },
      });

      if (!user.vereficationCode) {
        throw new NotFoundException('Code not found');
      }

      const isCorrectCode = await bcrypt.compare(
        canResetPasswordDto.code,
        user.vereficationCode.code,
      );

      if (!isCorrectCode) {
        throw new ConflictException('Code incorrect');
      }

      if (Date.now() > user.vereficationCode.expiryTime) {
        throw new ConflictException('Code has expired');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { canResetPassword: true },
      });
      await this.prisma.verificationCode.delete({
        where: { id: user.vereficationCode.id },
      });

      return 'Access allowed';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async resetPassword(
    email: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<string> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.canResetPassword === false) {
        throw new ForbiddenException('You cant reset your password');
      }

      if (resetPasswordDto.confirmPassword !== resetPasswordDto.password) {
        throw new ConflictException('Password mismatch');
      }

      const hashedNewPassword = await bcrypt.hash(resetPasswordDto.password, 8);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword, canResetPassword: false },
      });

      return 'Password updated';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async generateTokensByRefreshToken(
    refresh_token?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      if (!refresh_token) {
        throw new UnauthorizedException('Refresh token no provided');
      }

      const isBlacklisted = await this.prisma.blacklistedToken.findFirst({
        where: { token: refresh_token },
      });
      if (isBlacklisted) {
        throw new UnauthorizedException('Refresh token is blacklisted');
      }

      const userId = verifyToken(refresh_token);
      const user = await this.prisma.user.findFirst({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newAccessToken = createAccessToken(userId);
      const newRefreshToken = createRefreshToken(userId);

      await this.prisma.blacklistedToken.create({
        data: {
          token: refresh_token,
          expiresAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          reason: 'Access token has expired',
        },
      });

      return { access_token: newAccessToken, refresh_token: newRefreshToken };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  async addRefreshTokenToBlacklist(refresh_token?: string): Promise<string> {
    try {
      if (!refresh_token) {
        throw new NotFoundException('Refresh token not provided');
      }

      await this.prisma.blacklistedToken.create({
        data: {
          token: refresh_token,
          expiresAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
          reason: 'Logged out',
        },
      });

      return 'Token blacklisted';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

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

  private async sendCodeToEmail(email: string, code: string) {
    const templatePath = path.resolve(
      __dirname,
      '../../views/confirmationCode.ejs',
    );
    const html = await ejs.renderFile(templatePath, { code, email });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_USER as string,
        pass: process.env.NODEMAILER_PASS as string,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_USER as string,
      to: email,
      subject: 'Your confirmation code for Culinarybook✅',
      text: 'Your confirmation code',
      html: html,
    };

    return await transporter.sendMail(mailOptions);
  }
}
