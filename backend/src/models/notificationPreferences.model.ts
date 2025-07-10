/** @format */

import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";
import { INotificationPreferences } from "../interfaces/INotificationPreferences";

export class NotificationPreferences
  extends Model<INotificationPreferences>
  implements INotificationPreferences
{
  declare id: string;
  declare userId: string;
  declare notifyRisk: boolean;
  declare notifyAudit: boolean;
  declare notifyUpdate: boolean;
}

NotificationPreferences.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    notifyRisk: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notifyAudit: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notifyUpdate: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "notification_preferences",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["userId", "id"],
      },
    ],
  }
);

export default NotificationPreferences;
