/** @format */

import { Request, Response } from "express";
import { NotificationType } from "../types/notification.type";
import { sendNotificationsForType } from "../services/email.service";
import NotificationService from "../services/notification.service";
import { ISession } from "../interfaces/ISession";
import UserService from "../services/user.service";
import { IUser } from "../interfaces/IUser";
import { INotificationPreferences } from "../interfaces/INotificationPreferences";

const userService: UserService = new UserService();
const notificationService: NotificationService = new NotificationService();

/**
 * Send notification emails for a given type
 */
export const notifyUsersController = async (req: Request, res: Response) => {
  const type = req.params.type as NotificationType;
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;

  if (!["risk", "audit", "update"].includes(type)) {
    res.status(400).json({ message: "Invalid notification type" });
    return;
  }
  if (!userId) {
    res.status(401).json({ message: "User ID is missing from session" });
    return;
  }
  try {
    const user: IUser = await userService.getUserById(userId);
    await sendNotificationsForType(type, user);
    res.status(200).json({ message: `Notifications of type "${type}" sent.` });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

/**
 * Update a user's notification preference
 */
export const updateUserNotificationPreferencesController = async (
  req: Request,
  res: Response
) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;

  const notification: INotificationPreferences =
    req.body as INotificationPreferences;

  if (!notification) {
    res.status(400).json({ message: "Invalid notification data or type" });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: "User ID is missing from session" });
    return;
  }

  try {
    await notificationService.updateUserPreference(userId, notification);
    res.status(200).json({ message: `Preference for notification updated.` });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

/**
 * Get a user's notification preferences
 */
export const getUserNotificationPreferencesController = async (
  req: Request,
  res: Response
) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;

  if (!userId) {
    res.status(401).json({ message: "User ID is missing from session" });
    return;
  }

  try {
    const preferences =
      await notificationService.getNotificationPreferences(userId);
    res.status(200).json(preferences);
  } catch (err) {
    res.status(404).json({ error: err });
  }
};

/**
 * Get all notification from a user
 */
export const getUserNotifications = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;

  if (!userId) {
    res.status(401).json({ message: "User ID is missing from session" });
    return;
  }

  try {
    const notifications =
      await notificationService.getNotificationsByUserId(userId);
    res.status(200).json(notifications);
  } catch (err) {
    res.status(404).json({ error: err });
  }
};

/**
 * Create a new notification
 */
export const createNotificationController = async (
  req: Request,
  res: Response
) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  const notificationData = req.body;
  const { type, message, category, code, expiresAt, recurringDays } =
    notificationData;

  if (!userId) {
    res.status(401).json({ message: "User ID is missing from session" });
    return;
  }

  try {
    const notification = await notificationService.createNotification({
      userId,
      type,
      message,
      category,
      code,
      expiresAt,
      recurringDays,
    });

    if (!notification) {
      res.status(200).json({ status: "duplicate-prevented" });
      return;
    }

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export async function markNotificationAsReadHandler(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: "Notification ID required" });
    return;
  }

  try {
    await notificationService.markAsRead(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
}

/**
 * Delete a notification
 */
export const deleteNotification = async (req: Request, res: Response) => {
  const session = req.headers.session as ISession | undefined;
  const userId = session?.userId;
  const notificationId = req.params.id;

  if (!userId) {
    res.status(401).json({ message: "User ID is missing from session" });
    return;
  }

  if (!notificationId) {
    res.status(400).json({ message: "Notification ID is required" });
    return;
  }

  try {
    await notificationService.deleteNotification(notificationId);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
