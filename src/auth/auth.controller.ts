import { AuthService } from './auth.service';
import {
  Body,
  Controller,
  Res,
  Post,
  Get,
  Req,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { SignInDto } from './dto/sign-in.dto';
import sget from 'simple-get';
import { AuthGuard } from '../common/guards/auth.guard';
import { User } from '@prisma/client';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res() res: FastifyReply,
  ): Promise<{ access_token: string }> {
    const result = await this.authService.signUp(signUpDto);

    res.setCookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.PRODUCTION === 'true',
      sameSite: process.env.PRODUCTION === 'true' ? 'strict' : 'lax',
      maxAge: 31 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.send({ access_token: result.access_token });
  }

  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res() res: FastifyReply,
  ): Promise<{ access_token: string }> {
    const result = await this.authService.signIn(signInDto);

    res.setCookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.PRODUCTION === 'true',
      sameSite: process.env.PRODUCTION === 'true' ? 'strict' : 'lax',
      maxAge: 31 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.send({ access_token: result.access_token });
  }

  @Get('google/callback')
  async googleAuthCallback(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    try {
      req.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
        req,
        (err, result) => {
          if (err) {
            res.send(err);
            return;
          }

          sget.concat(
            {
              url: 'https://www.googleapis.com/oauth2/v2/userinfo',
              method: 'GET',
              headers: {
                Authorization: 'Bearer ' + result.token.access_token,
              },
              json: true,
            },
            async (err, _, data) => {
              if (err) {
                return res
                  .code(302)
                  .redirect(`${process.env.CORS_ORIGIN}/sign-in`);
              }

              const result = await this.authService.handleOAuthLogin(data);

              res.setCookie('refresh_token', result.refresh_token, {
                httpOnly: true,
                secure: process.env.PRODUCTION === 'true',
                sameSite: process.env.PRODUCTION === 'true' ? 'strict' : 'lax',
                maxAge: 31 * 24 * 60 * 60 * 1000,
                path: '/',
              });

              res.setCookie('access_token', result.access_token, {
                httpOnly: false,
                secure: process.env.PRODUCTION === 'true',
                sameSite: process.env.PRODUCTION === 'true' ? 'strict' : 'lax',
                maxAge: 2 * 24 * 60 * 60 * 1000,
                path: '/',
                domain: '.culinarybook.website',
              });

              return res.code(302).redirect(process.env.CORS_ORIGIN);
            },
          );
        },
      );
    } catch (error) {
      return res.code(302).redirect(`${process.env.CORS_ORIGIN}/sign-in`);
    }
  }

  @Post('sign-out')
  async signOut(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<string> {
    const refresh_token = req.cookies.refresh_token;
    await this.authService.addRefreshTokenToBlacklist(refresh_token);

    res.clearCookie('refresh_token', { domain: '.culinarybook.website' });
    res.clearCookie('refresh_token');

    return res.send('You are successfully sign out');
  }

  @Post('send-code')
  @UseGuards(AuthGuard)
  async sendConfirmationCode(@Req() req: FastifyRequest): Promise<string> {
    const user = req.user as User;

    return await this.authService.sendConfirmationCode(user.id, user.email);
  }

  @Post('verify-account')
  @UseGuards(AuthGuard)
  async verifyAccount(
    @Req() req: FastifyRequest,
    @Body() verifyAccountDto: VerifyAccountDto,
  ): Promise<string> {
    const user = req.user as User;

    return await this.authService.verifyAccount(
      user,
      verifyAccountDto.code.toString(),
    );
  }

  @Patch('update/password')
  @UseGuards(AuthGuard)
  async updatePassword(
    @Req() req: FastifyRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<string> {
    const user = req.user as User;

    return await this.authService.changePassword(user, changePasswordDto);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPassword: ForgotPasswordDto,
  ): Promise<string> {
    return await this.authService.forgotPassword(forgotPassword);
  }

  @Patch(':email/reset-password')
  async resetPassword(
    @Param('email') email: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<string> {
    return await this.authService.resetPassword(email, resetPasswordDto);
  }

  @Post('refresh-token')
  async generateTokens(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<{ access_token: string }> {
    const refresh_token = req.cookies.refresh_token;
    const result =
      await this.authService.generateTokensByRefreshToken(refresh_token);

    res.setCookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.PRODUCTION === 'true',
      sameSite: process.env.PRODUCTION === 'true' ? 'strict' : 'lax',
      maxAge: 31 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.send({ access_token: result.access_token });
  }
}
