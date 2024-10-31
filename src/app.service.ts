import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApp() {
    throw new HttpException('ImATeapot', HttpStatus.I_AM_A_TEAPOT);
  }
}
