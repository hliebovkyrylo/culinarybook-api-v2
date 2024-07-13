import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FastifyInstance, fastify } from 'fastify';

const fastifyInstance: FastifyInstance = fastify();

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: 'FASTIFY_INSTANCE',
      useValue: fastifyInstance,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
