/** @format */

import {
  getNotifications,
  createNotificationService,
  deleteNotification,
} from "@/services/notificationService";
import { INotification } from "@/types/INotification";

export async function fetchNotifications(): Promise<INotification[]> {
  return await getNotifications();
}

export async function createNotification(notification: INotification) {
  return await createNotificationService(notification);
}

export async function removeNotification(id: string) {
  return await deleteNotification(id);
}
