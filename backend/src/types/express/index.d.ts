import "express";

declare module "express-serve-static-core" {
  interface Request {
    session?: any; // Or use your ISession type if you have it
  }
}