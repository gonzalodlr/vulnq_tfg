/** @format */

import { Request, Response, NextFunction } from "express";
import UserService from "../services/user.service";
import { GetUserDTO } from "../dto/GetUserDTO";
import { ISession } from "../interfaces/ISession";
import { IUser } from "../interfaces/IUser";
import GetSessionAuthDTO from "../dto/GetSessionAuth";

const userService: UserService = new UserService();

export async function getUserInfo(req: Request, res: Response) {
  const session = req.headers.session as ISession | undefined;
  try {
    const user: IUser = await userService.getUserById(session?.userId!);
    res.json(new GetUserDTO(user));
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
}

export async function updateUser(req: Request, res: Response) {
  const session = GetSessionAuthDTO(req, res);
  if (!session) return;

  const email = req.body.email;
  const password = req.body.password;
  const phoneNumber = req.body.phoneNumber;

  try {
    const user = await userService.updateUser(
      session.userId,
      email,
      password,
      phoneNumber
    );
    res.json(new GetUserDTO(user));
  } catch (e) {
    console.error(e);
    res.status(400).end();
  }
}

export async function deleteUser(req: Request, res: Response) {
  const session = req.headers.session as ISession | undefined;
  try {
    await userService.deleteUser(session?.userId!);
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(401).end();
  }
}
