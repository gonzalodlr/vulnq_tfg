/** @format */

import { DataTypes, Model, Sequelize } from "sequelize";
import { IAsset } from "../interfaces/IAsset";

export class Asset extends Model<IAsset> implements IAsset {
  declare id: string;
  declare idClient: string;
  declare name: string;
  declare type: string;
  declare vendor?: string;
  declare model?: string;
  declare os?: string;
  declare location?: string;
  declare observations?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initAssetModel = (sequelize: Sequelize) => {
  Asset.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      idClient: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: DataTypes.STRING,
      vendor: DataTypes.STRING,
      model: DataTypes.STRING,
      os: DataTypes.STRING,
      location: DataTypes.STRING,
      observations: DataTypes.STRING,
    },
    {
      sequelize,
      tableName: "assets",
      timestamps: true,
    }
  );
};
