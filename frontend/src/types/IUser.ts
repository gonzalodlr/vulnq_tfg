/** @format */

export interface IUser {
  id?: string;
  name?: string;
  phone?: string;
  email: string;
  activated: boolean;
  activationCode: string;
}
