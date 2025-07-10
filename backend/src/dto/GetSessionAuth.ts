/** @format */

import { ISession } from "../interfaces/ISession";
import SecurityService from "../services/security.service";
import { Request, Response } from "express";

const securityService: SecurityService = new SecurityService();

export default function GetSessionAuthDTO(req: Request, res: Response) {
  const authorization = req.headers.authorization;
  try {
    const session: ISession = securityService.getSession(authorization!);
    return session;
  } catch (e) {
    console.error(e);
    res.status(401).end();
    return;
  }
}
