/** @format */

import { NextFunction, Router, Request, Response } from "express";
import {
  activateUser,
  refreshToken,
  userCreation,
  userLogin,
} from "../controllers/unauthenticated.user.controller";

const unautheticateUserRouter = Router();

unautheticateUserRouter.post("/signup", userCreation);
unautheticateUserRouter.post("/login", userLogin);
unautheticateUserRouter.get("/activate/:code", activateUser);
unautheticateUserRouter.post("/refresh-token", refreshToken);

unautheticateUserRouter.use(
  (_err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).end();
  }
);

export default unautheticateUserRouter;
