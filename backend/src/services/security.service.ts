/** @format */

import { config } from "../config/config";
import { ISession } from "../interfaces/ISession";

import jwt from "jsonwebtoken";

export default class SecurityService {
  public generateAuthToken(session: ISession) {
    return jwt.sign({ session: session }, config.jwtSecret!, {
      expiresIn: "2h",
    });
  }
  public getSession(token: string) {
    return <ISession>jwt.verify(token, config.ACCESS_TOKEN_SECRET!);
  }

  public verifyToken(token: string) {
    try {
      return jwt.verify(token, config.jwtSecret!);
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
