import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { createAccessToken, createRefreshToken } from '../utils/token.util';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signUp(
    data: SignUpDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
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
  }
}
