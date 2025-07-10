/** @format */

import { DataTypes, Model, Sequelize } from "sequelize";
import { ISoftware } from "../interfaces/ISoftware";

export class Software extends Model<ISoftware> implements ISoftware {
  declare id_software: string;
  declare id_asset: string;
  declare software_name: string;
  declare version: string;
  declare vendor?: string;
  declare os?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initSoftwareModel = (sequelize: Sequelize) => {
  Software.init(
    {
      id_software: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      id_asset: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      software_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      version: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      vendor: DataTypes.STRING,
      os: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "software",
      timestamps: true,
    }
  );
};
