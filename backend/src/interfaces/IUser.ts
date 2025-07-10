/** @format */

export interface IUser {
  id?: string;
  name?: string;
  phone?: string;
  email: string;
  password?: string;
  role: number;
  salt: String;
  hash: String;
  activated: Boolean;
  activationCode: String;
}
