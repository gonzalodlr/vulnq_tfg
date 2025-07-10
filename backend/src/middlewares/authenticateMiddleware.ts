/** @format */

import { Request, Response, NextFunction } from "express";
import SecurityService from "../services/security.service";

const securityService: SecurityService = new SecurityService();

export default function authenticateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.cookies?.session_token;

  // Strip 'Bearer ' prefix if present
  const raw = authorization?.replace(/^Bearer\s+/i, "");
  //console.log("Authorization token: ", raw);
  if (!raw || raw.length === 0) {
    res.status(403).end("You need to be authenticated");
  } else {
    try {
      const data: any = securityService.getSession(raw!);
      if (data != undefined && data.session) {
        req.headers.session = data.session;
        next();
      } else {
        res.status(401).json({ message: "Invalid or expired token" });
      }
    } catch (e) {
      // Clear the cookie if the token is invalid
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      });
      res.status(401).json({
        message: "Invalid or expired token",
      });
    }
  }
}
