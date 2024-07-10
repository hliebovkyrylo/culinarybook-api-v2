import { AuthService } from './auth.service';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { FastifyReply } from 'fastify';

@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  async signUp(
    @Body() signUpDto: SignUpDto,
    @Res() res: FastifyReply,
  ): Promise<{ access_token: string }> {
    const tokens = await this.authService.signUp(signUpDto);

    res.setCookie('refresh_token', tokens.refresh_token);
    return { access_token: tokens.access_token };
  }
}
