import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import MongoStore from 'connect-mongo';
import { config } from 'dotenv';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import { HttpExeptionFilter } from './middleware/http-exeption.middleware';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import fastifyOauth2 from '@fastify/oauth2';
import { fastifyGoogleOauthConfig } from './config/fastify-google-oauth.config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

config();

const port = process.env.PORT || 4000;
const corsOrigin = process.env.CORS_ORIGIN as string;
const sessionSecret = process.env.SESSION_SECRET as string;
const sessionDBUrl = process.env.SESSION_DATABASE_URL as string;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 1048576,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const constrains = validationErrors[0].constraints;
        return new BadRequestException(constrains);
      },
    }),
  );

  app.useGlobalFilters(new HttpExeptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.register(fastifyCors, {
    origin: corsOrigin,
    credentials: true,
  });

  await app.register(fastifyCookie);
  await app.register(fastifyOauth2, fastifyGoogleOauthConfig);

  await app.register(fastifySession, {
    secret: sessionSecret,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: sessionDBUrl,
    }),
  });

  await app.listen(port);
}
bootstrap();
