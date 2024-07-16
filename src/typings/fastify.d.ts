import { User } from '@prisma/client';
import { OAuth2Namespace } from '@fastify/oauth2';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }

  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}
