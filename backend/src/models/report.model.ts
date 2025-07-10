/** @format */

import { DataTypes, Model, Sequelize } from "sequelize";
import { IReport } from "../interfaces/IReport";

export class Report extends Model<IReport> implements IReport {
  declare id: string;
  declare idClient: string;
  declare data: object;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

export const initReportModel = (sequelize: Sequelize) => {
  Report.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      idClient: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      tableName: "reports",
      timestamps: true,
    }
  );
};

export default Report;
