/** @format */

import { NextFunction, Router, Request, Response } from "express";
import {
  deleteUser,
  updateUser,
  getUserInfo,
} from "../controllers/authenticated.user.controller";

const autheticateUserRouter = Router();

autheticateUserRouter.delete("/delete", deleteUser);
autheticateUserRouter.put("/update", updateUser);
autheticateUserRouter.get("/user", getUserInfo);

autheticateUserRouter.use(
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).end();
  }
);

export default autheticateUserRouter;
