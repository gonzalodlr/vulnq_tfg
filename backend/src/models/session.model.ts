/** @format */

import { randomBytes } from "crypto";
import { ISession } from "../interfaces/ISession";

export class Session implements ISession {
  sessionId: string;
  userId: string;
  email: string;
  role: number;
  createdAt: Date;
  expiresAt: Date;

  constructor(userId: string, email: string, role: number) {
    this.sessionId = randomBytes(16).toString("hex");
    this.email = email;
    this.role = role;
    this.userId = userId;
    this.createdAt = new Date();
    this.expiresAt = new Date(this.createdAt.getTime() + 60 * 60 * 1000); // 1 hour later
  }
}

export default Session;
