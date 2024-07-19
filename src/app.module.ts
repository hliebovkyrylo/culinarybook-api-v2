import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BlacklistModule } from './blacklist/blacklist.module';
import { CommentModule } from './comment/comment.module';
import { CommentReplyModule } from './comment-reply/comment-reply.module';
import { LikeModule } from './like/like.module';
import { SaveModule } from './save/save.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ScheduleModule.forRoot(),
    BlacklistModule,
    CommentModule,
    CommentReplyModule,
    LikeModule,
    SaveModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
