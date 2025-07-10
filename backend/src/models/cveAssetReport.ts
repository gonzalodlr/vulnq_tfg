/** @format */

// models/CVEAssetReport.ts
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/db";

class CVEAssetReport extends Model {}

CVEAssetReport.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    idClient: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    cve_id: { type: DataTypes.STRING, allowNull: false },
    asset_id: { type: DataTypes.STRING, allowNull: false },
    report_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "reports", key: "id" },
    },
    full_json: { type: DataTypes.JSON, allowNull: false },
  },
  {
    sequelize,
    tableName: "cve_asset_reports",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["cve_id", "asset_id"],
      },
    ],
  }
);

export default CVEAssetReport;
