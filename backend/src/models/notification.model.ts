/** @format */

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db"; // tu conexión
import { INotification } from "../interfaces/INotification";

export type NotificationCreationAttributes = Optional<
  INotification,
  | "id"
  | "read"
  | "createdAt"
  | "updatedAt"
  | "expiresAt"
  | "code"
  | "category"
  | "recurringDays"
  | "lastTriggeredAt"
>;

class Notification
  extends Model<INotification, NotificationCreationAttributes>
  implements INotification
{
  declare id: string;
  declare userId: string;
  declare type: INotification["type"];
  declare category?: INotification["category"];
  declare message: string;
  declare read: boolean;
  declare code?: string;
  declare expiresAt?: Date;
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare recurringDays?: number;
  declare lastTriggeredAt?: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "risk",
        "audit",
        "update",
        "reminder",
        "info",
        "warning"
      ),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM("asset", "subasset", "vuln", "system"),
      allowNull: true,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    code: {
      type: DataTypes.STRING,
    },
    expiresAt: {
      type: DataTypes.DATE,
    },
    recurringDays: {
      type: DataTypes.INTEGER,
    },
    lastTriggeredAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    tableName: "notifications",
    timestamps: true,
  }
);

export default Notification;
