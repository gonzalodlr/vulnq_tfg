/** @format */

import express from "express";
import cors from "cors";
import syncModels from "./scripts/syncDatabase";
import { config } from "./config/config";
import cookieParser from "cookie-parser";
import unautheticateUserRouter from "./routes/unauthenticate.user.route";
import autheticateUserRouter from "./routes/authenticate.user.route";
import authenticateMiddleware from "./middlewares/authenticateMiddleware";
import helmet from "helmet";
import assetRoutes from "./routes/asset.route";
import softwareRoutes from "./routes/software.route";
import reportRoutes from "./routes/report.route";
import cveRoutes from "./routes/cve.route";
import notificationRoutes from "./routes/notification.route";
import * as emailService from "./services/email.service";

class App {
  public app: express.Application = express();
  constructor(port: number) {
    console.log("Initializing server...");
    this.app.use(
      cors({
        origin: config.frontendUrl,
        credentials: true, // Allow cookies to be sent
        exposedHeaders: ["token"],
      })
    );
    // Necesario para leer cookies
    this.app.use(cookieParser());
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.initializeRouterMiddlewares();
    this.startServer(port);
  }

  private initializeRouterMiddlewares() {
    this.app.use("/api/", unautheticateUserRouter);
    this.app.use("/api/auth", authenticateMiddleware, autheticateUserRouter);

    this.app.use("/api/assets", authenticateMiddleware, assetRoutes);
    this.app.use("/api/softwares", authenticateMiddleware, softwareRoutes);
    this.app.use("/api/reports", authenticateMiddleware, reportRoutes);
    this.app.use("/api/cves", authenticateMiddleware, cveRoutes);
    this.app.use(
      "/api/notifications",
      authenticateMiddleware,
      notificationRoutes
    );
    /* this.app.post("/email/send", async (req: any, res: any, next) => {
      try {
        const { email, activationCode } = req.body;
        if (typeof email !== "string" || typeof activationCode !== "string") {
          return res
            .status(400)
            .json({ message: "Missing or invalid parameters" });
        }
        await emailService.sendActivationEmail(email, activationCode);
        res.status(200).json({ message: "Activation email sent" });
      } catch (error) {
        next(error);
      }
    }); */
  }

  private async startServer(port: number) {
    console.log("Starting server...");
    try {
      await syncModels();
      this.app.listen(port, config.IP_ADDRESS, () => {
        console.log(`Server running on http://${config.IP_ADDRESS}:${port}`);
      });
    } catch (error) {
      console.error("Failed to start the server:", error);
    }
  }
}
export default App;

// Start the application
new App((config.port as number) || 5002);
