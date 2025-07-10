/** @format */

import { DataTypes, Model, Sequelize } from "sequelize";
import crypto from "crypto";
import { IUser } from "../interfaces/IUser";

// Definir el modelo User
export class User extends Model<IUser> implements IUser {
  /** @type {string} */
  declare id: string;
  /** @type {string | undefined} */
  declare name?: string;
  /** @type {string | undefined} */
  declare phone?: string;
  /** @type {string} */
  declare email: string;
  /** @type {number} */
  declare role: number;
  /** @type {boolean} */
  declare activated: boolean;
  /** @type {string} */
  declare activationCode: string;
  /** @type {string} */
  declare salt: string;
  /** @type {string} */
  declare hash: string;

  // Method to set the password
  public setPassword(password: string): void {
    this.salt = crypto.randomBytes(16).toString("hex");
    this.hash = crypto
      .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
      .toString("hex");
  }

  // Method to validate the password
  public validPassword(password: string): boolean {
    const hash = crypto
      .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
      .toString("hex");
    return this.hash === hash;
  }
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: "unique_phone",
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: "unique_email",
      },
      role: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: {
          isIn: [[0, 1, 2]],
        },
      },
      activated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      activationCode: {
        type: DataTypes.STRING,
      },
      salt: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "users",
      timestamps: false,
    }
  );
};

export default User;
