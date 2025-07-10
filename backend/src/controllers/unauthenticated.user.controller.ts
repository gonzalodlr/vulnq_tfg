/** @format */

import { Request, Response, NextFunction } from "express";
import UserService from "../services/user.service";
import { GetUserDTO } from "../dto/GetUserDTO";
import User from "../models/user.model";
import { ISession } from "../interfaces/ISession";
import { IUser } from "../interfaces/IUser";
import { sendActivationEmail } from "../services/email.service";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import NotificationService from "../services/notification.service";
import NotificationPreferences from "../models/notificationPreferences.model";

const notificationService: NotificationService = new NotificationService();
const userService: UserService = new UserService();

export async function userCreation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const name = `${req.body.name} ${req.body.lastName}`;
    const { email, phoneNumber, password } = req.body;
    if (email.length > 0 && password.length > 0) {
      const user: User = await userService.createUser(
        name,
        email,
        phoneNumber,
        0, // Role: 0 (User)
        password
      );
      if (user) {
        NotificationPreferences.create({
          id: crypto.randomUUID(),
          userId: user.id,
          notifyRisk: true,
          notifyAudit: true,
          notifyUpdate: true,
        });

        await notificationService.createNotification({
          userId: user.id,
          type: "info",
          message: "Welcome! Let's secure your assets.",
          code: "welcome",
          category: "system",
        });
        // Send activation email
        //await sendActivationEmail(user.email, user.activationCode);
      }
      res.status(200).json(new GetUserDTO(user));
    } else {
      res.status(400).end();
    }
  } catch (e) {
    console.error(e);
    next(e); // Forward to error handler
  }
}

export async function userLogin(req: Request, res: Response) {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const session: ISession = await userService.loginUser(email, password);
    const user: IUser = await userService.getUserById(session.userId);

    // JWT Access Token and Refresh Token
    const accessToken = jwt.sign(
      { session: session },
      config.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const refreshToken = jwt.sign(
      { session: session },
      config.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("session_token", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
    );

    // Send access token as body
    res.json({
      refreshToken: refreshToken,
      user: new GetUserDTO(user),
    });
  } catch (e) {
    console.error(e);
    res.status(401).end();
  }
}

export async function activateUser(req: Request, res: Response) {
  const code = req.params.code;
  var status = 400;
  if (code != undefined && code.length > 0) {
    status = (await userService.activate(code)) ? 200 : 404;
  }
  res.status(status).end();
}

// Refresh Token: obtener un nuevo Access Token usando el Refresh Token
export const refreshToken = (req: Request, res: Response): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401).json({ message: "Refresh token required" });
    return;
  }

  jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }
    // Generar un nuevo Access Token
    const accessToken = jwt.sign(
      { session: user.session },
      config.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      }
    );

    // Enviar el nuevo Access Token
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("session_token", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, // 1 hora
      })
    );

    res.json({ message: "Access token refreshed", accessToken: accessToken });
  });
};

// Refresh Access Token: obtener un nuevo Access Token usando el Refresh Token
export const refreshAccessToken = (req: Request, res: Response): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401).json({ message: "Refresh token required" });
    return;
  }

  jwt.verify(refreshToken, config.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }
    // Generate a new Access Token
    const accessToken = jwt.sign(
      { session: user.session },
      config.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      }
    );

    // Send the new Access Token
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("session_token", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, // 1 hora
      })
    );

    res.json({ message: "Access token refreshed", accessToken: accessToken });
  });
};
