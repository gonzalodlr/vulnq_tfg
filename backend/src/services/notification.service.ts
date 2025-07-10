/** @format */

// services/notificationService.ts
import { INotification } from "../interfaces/INotification";
import { INotificationPreferences } from "../interfaces/INotificationPreferences";
import NotificationPreferences from "../models/notificationPreferences.model";
import Notification from "../models/notification.model";
import { Op, WhereOptions, fn } from "sequelize";
import { v4 as uuidv4 } from "uuid";

interface CreateNotificationInput {
  userId: string;
  type: Notification["type"];
  message: string;
  category?: Notification["category"];
  code?: string;
  expiresAt?: Date;
  recurringDays?: number;
}

export default class NotificationService {
  public async notifyUser(
    userId: string,
    type: "risk" | "audit" | "update",
    message: string
  ) {
    const prefs = await NotificationPreferences.findOne({
      where: { userId },
    });
    if (!prefs) return;

    const shouldNotify =
      (type === "risk" && prefs.notifyRisk) ||
      (type === "audit" && prefs.notifyAudit) ||
      (type === "update" && prefs.notifyUpdate);

    if (!shouldNotify) return;

    const notification: INotification = {
      id: crypto.randomUUID(),
      userId,
      type,
      message,
      read: false,
      createdAt: new Date(),
    };

    await Notification.create(notification);
    // Aquí puedes emitir vía WebSocket o push notification
  }

  /**
   * Get all notifications for a specific user
   */
  public async getNotificationsByUserId(userId: string) {
    const where: WhereOptions = {
      userId,
      [Op.or]: [
        { expiresAt: null }, // IS NULL
        { expiresAt: { [Op.gt]: fn("NOW") } }, // > NOW()  (hora de la BD)
      ],
    };

    return Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Update a single user's notification preference
   */
  updateUserPreference = async (
    userId: string,
    notificationPreferences: INotificationPreferences
  ): Promise<void> => {
    // check the notifications user and notification type are the same id
    const pref = await NotificationPreferences.findOne({ where: { userId } });
    if (!pref) {
      throw new Error("Notification preferences not found for user");
    }
    if (
      pref.userId !== notificationPreferences.userId ||
      pref.id !== notificationPreferences.id
    ) {
      throw new Error("User ID does not match notification preferences");
    }
    await NotificationPreferences.update(notificationPreferences, {
      where: { id: notificationPreferences.id },
    });
  };

  /**
   * Get a user's notification preferences
   */
  getNotificationPreferences = async (userId: string) => {
    const preferences = await NotificationPreferences.findOne({
      where: { userId },
    });
    if (!preferences) {
      throw new Error("Notification preferences not found");
    }
    return preferences;
  };

  /**
   * Create a new notification
   */
  /* public async createNewNotification(
    userId: string,
    notificationData: Omit<INotification, "id" | "userId" | "createdAt">
  ) {
    const notification: INotification = {
      id: crypto.randomUUID(),
      userId,
      ...notificationData,
      createdAt: new Date(),
    };
    const newNotification = await Notification.create(notification);
    return newNotification;
  } */

  async createNotification(
    input: CreateNotificationInput
  ): Promise<Notification | null> {
    const { userId, code, recurringDays } = input;

    if (code) {
      const existing = await Notification.findOne({ where: { userId, code } });

      if (existing) {
        if (recurringDays && existing.lastTriggeredAt) {
          const diffTime =
            Date.now() - new Date(existing.lastTriggeredAt).getTime();
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          if (diffDays < recurringDays) return null;
        } else {
          return null;
        }

        return existing.update({
          message: input.message,
          lastTriggeredAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return Notification.create({
      id: uuidv4(),
      userId: input.userId,
      type: input.type,
      category: input.category,
      message: input.message,
      read: false,
      code: input.code,
      expiresAt: input.expiresAt,
      recurringDays: input.recurringDays,
      lastTriggeredAt: recurringDays ? new Date() : undefined,
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await Notification.update(
      { read: true },
      { where: { id: notificationId } }
    );
  }

  /**
   * Delete a notification by ID
   */
  public async deleteNotification(notificationId: string) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }
    await notification.destroy();
    return { message: "Notification deleted successfully" };
  }
}
