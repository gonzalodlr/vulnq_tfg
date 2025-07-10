/** @format */

import api from "@/axios/axiosInstance";
import { INotification } from "@/types/INotification";

export async function getNotifications() {
  try {
    const response = await api.get("/api/notifications/get", {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching Notifications"
    );
  }
}

export async function createNotificationService(notification: INotification) {
  try {
    const response = await api.post(
      `/api/notifications/create`,
      notification,
      {
      withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching Notification"
    );
  }
}

export async function deleteNotification(id: string) {
  try {
    const response = await api.delete(`/api/notifications/delete/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error deleting Notification"
    );
  }
}
