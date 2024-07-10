import { type User } from '@prisma/client';

export type IUserDTO = Omit<User, 'password'>;

export class UserMeDto implements IUserDTO {
  public id: string;
  public email: string;
  public username: string;
  public name: string;
  public image: string;
  public backgroundImage: string;
  public isVerified: boolean;
  public canResetPassword: boolean;
  public isPrivate: boolean;

  constructor(data: IUserDTO) {
    (this.id = data.id),
      (this.email = data.email),
      (this.username = data.username),
      (this.name = data.name),
      (this.image = data.image),
      (this.backgroundImage = data.backgroundImage),
      (this.isPrivate = data.isPrivate),
      (this.isVerified = data.isVerified),
      (this.canResetPassword = data.canResetPassword);
  }
}
