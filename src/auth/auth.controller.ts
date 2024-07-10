import { AuthService } from './auth.service';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { FastifyReply } from 'fastify';
import { createAccessToken, createRefreshToken } from '../utils/token.util';

@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res() res: FastifyReply,
  ): Promise<{ access_token: string }> {
    const user = await this.authService.signUp(signUpDto);

    const access_token = createAccessToken(user.id);
    const refresh_token = createRefreshToken(user.id);

    res.setCookie('refresh_token', refresh_token);
    return res.send({ access_token });
  }
}
