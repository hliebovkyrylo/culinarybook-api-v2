import { IsNumber, MaxLength, MinLength } from 'class-validator';

export class VerifyAccountDto {
  @IsNumber()
  @MinLength(6)
  @MaxLength(6)
  code: number;
}
