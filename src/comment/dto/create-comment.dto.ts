import {
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  grade: number;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  commentText: string;
}
