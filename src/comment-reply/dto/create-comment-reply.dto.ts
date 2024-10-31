import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  commentText: string;
}
