/** @format */

import { IUser } from "../interfaces/IUser";

export class GetUserDTO {
  id: string;
  name?: string;
  phone?: string;
  email: string;
  activated: Boolean;
  activationCode: String;

  constructor(user: IUser) {
    this.id = user.id || "";
    this.name = user.name || undefined;
    this.phone = user.phone || undefined;
    this.email = user.email;
    this.activated = user.activated;
    this.activationCode = user.activationCode;
  }
}
