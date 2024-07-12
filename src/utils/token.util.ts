import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { InternalServerErrorException } from '@nestjs/common';

const jwtSecret = process.env.JWT_SECRET as string;
const jwtAccessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN as string;
const jwtRefreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN as string;

interface IPayload {
  id: string;
}

export const createAccessToken = (id: string) => {
  try {
    return jwt.sign(
      {
        id,
      },
      jwtSecret,
      {
        expiresIn: jwtAccessTokenExpiresIn,
      },
    );
  } catch (error) {
    console.log(error);
    throw new InternalServerErrorException('Internal server error');
  }
};

export const createRefreshToken = (id: string) => {
  try {
    return jwt.sign(
      {
        id,
      },
      jwtSecret,
      {
        expiresIn: jwtRefreshTokenExpiresIn,
      },
    );
  } catch (error) {
    console.log(error);
    throw new InternalServerErrorException('Internal server error');
  }
};

export const verifyToken = (token: string) => {
  try {
    const payload = jwt.verify(token, jwtSecret) as IPayload;

    return payload.id;
  } catch (error) {
    console.log(error);
    throw new InternalServerErrorException('Internal server error');
  }
};
