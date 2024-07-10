import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { SignUpDto } from './dto/sign-up.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signUp(data: SignUpDto): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 8);
      return await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          isVerified: false,
          canResetPassword: false,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `This ${error.meta?.target === 'User_email_key' ? 'email' : 'username'} already exist`,
        );
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
