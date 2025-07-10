/** @format */

import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";

const notificationRoutes = Router();
// PREFERENCES

notificationRoutes.put(
  "/preferences/update",
  notificationController.updateUserNotificationPreferencesController
);

notificationRoutes.get(
  "/preferences/get",
  notificationController.getUserNotificationPreferencesController
);
// NOTIFICATIONS
notificationRoutes.post(
  "/create",
  notificationController.createNotificationController
);
notificationRoutes.delete("/delete/:id", notificationController.deleteNotification);
notificationRoutes.get("/get", notificationController.getUserNotifications);
notificationRoutes.put(
  "/update",
  notificationController.markNotificationAsReadHandler
);

export default notificationRoutes;
