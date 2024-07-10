import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const jwtSecret = process.env.JWT_SECRET as string;
const jwtAccessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
const jwtRefreshTokenExpiresIn = process.env.REFRESH_EXPIRES_IN;

interface IPayload {
  id: string;
}

export const createAccessToken = (id: string) => {
  return jwt.sign(
    {
      id,
    },
    jwtSecret,
    {
      expiresIn: jwtAccessTokenExpiresIn,
    },
  );
};

export const createRefreshToken = (id: string) => {
  const refreshToken = jwt.sign(
    {
      id,
    },
    jwtSecret,
    {
      expiresIn: jwtRefreshTokenExpiresIn,
    },
  );

  return serialize('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.PRODUCTION === 'true',
    sameSite: process.env.PRODUCTION === 'true' ? 'strict' : 'lax',
    maxAge: 60 * 60 * 24 * 31,
    path: '/',
  });
};

export const createNoSerializedRefreshToken = (id: string) => {
  return jwt.sign(
    {
      id,
    },
    jwtSecret,
    {
      expiresIn: jwtRefreshTokenExpiresIn,
    },
  );
};

export const verifyToken = (token: string) => {
  const payload = jwt.verify(token, jwtSecret) as IPayload;

  return payload.id;
};
