/** @format */

export interface INotification {
  id: string;
  userId: string;
  type: "risk" | "audit" | "update" | "reminder" | "info" | "warning";
  category?: "asset" | "subasset" | "vuln" | "system";
  message: string;
  read: boolean;
  code?: string;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  recurringDays?: number;
  lastTriggeredAt?: Date;
}
