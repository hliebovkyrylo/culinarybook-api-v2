import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username: string;

  @IsString()
  @MinLength(2)
  @MaxLength(32)
  name: string;

  @IsString()
  @MaxLength(8)
  @MaxLength(32)
  password: string;

  @IsOptional()
  @IsBoolean()
  readonly isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly canResetPassword?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly isVerified?: boolean;

  @IsOptional()
  @IsString()
  readonly image?: string;

  @IsOptional()
  @IsString()
  readonly backgroundImage?: string;
}
