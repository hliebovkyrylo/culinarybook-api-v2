import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SaveController } from './save.controller';
import { SaveService } from './save.service';
import { UserService } from '../user/user.service';

@Module({
  imports: [PrismaModule],
  controllers: [SaveController],
  providers: [SaveService, UserService],
  exports: [SaveService],
})
export class SaveModule {}
