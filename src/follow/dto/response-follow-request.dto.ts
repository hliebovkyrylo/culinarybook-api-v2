import { IsBoolean } from 'class-validator';

export class ResponseFollowRequestDto {
  @IsBoolean()
  allowed: boolean;
}
