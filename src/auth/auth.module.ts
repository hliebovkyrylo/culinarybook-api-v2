import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';

@Module({
  imports: [PrismaModule],
  controllers: [AbortController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
