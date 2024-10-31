import { User } from '@prisma/client';

export type IUserPreviewDto = Omit<
  User,
  'password' | 'isVerified' | 'canResetPassword' | 'email' | 'isPrivate'
> & {
  followersCount: number;
  recipesCount: number;
};

export class UserPreviewDto implements IUserPreviewDto {
  public id: string;
  public username: string;
  public name: string;
  public image: string;
  public backgroundImage: string;
  public followersCount: number;
  public recipesCount: number;

  constructor(data: IUserPreviewDto) {
    (this.id = data.id),
      (this.username = data.username),
      (this.name = data.name),
      (this.image = data.image),
      (this.backgroundImage = data.backgroundImage),
      (this.followersCount = data.followersCount),
      (this.recipesCount = data.recipesCount);
  }
}
