import { AuthService } from './auth.service';
import { Body, Controller, Res, Post } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { FastifyReply } from 'fastify';
import { SignInDto } from './dto/sign-in.dto';

@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
