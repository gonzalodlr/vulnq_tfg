/** @format */
import { IUser } from "../interfaces/IUser";
import User from "../models/user.model";
import Session from "../models/session.model";
import crypto from "crypto";

export default class UserService {
  public async createUser(
    name: string,
    email: string,
    phoneNumber: string,
    role: number,
    password: string
  ) {
    const user = new User();
    user.name = name;
    user.email = email;
    user.phone = phoneNumber;
    user.role = role;
    user.setPassword(password);
    user.activated = true; // Default to activated
    user.activationCode = crypto.randomBytes(16).toString("hex");
    try {
      return await user.save();
    } catch (e) {
      throw new Error("Error creating user");
    }
  }

  async getUsers(): Promise<IUser[]> {
    try {
      return await User.findAll();
    } catch (e) {
      throw new Error("Error getting users");
    }
  }

  async loginUser(email: string, password: string): Promise<Session> {
    const user = await User.findOne({ where: { email: email } });

    if (
      user != undefined &&
      (await user!.validPassword(password)) &&
      user.activated
    ) {
      return new Session(user.id, user.email, user.role);
    } else {
      throw new Error("Login failed");
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (e) {
      throw new Error("Error getting user by id");
    }
  }

  public async activate(code: string): Promise<boolean> {
    const user = await User.findOne({ where: { activationCode: code } });
    if (user != undefined) {
      user.activated = true;
      user.activationCode = "";
      await user.save();
      return true;
    } else {
      return false;
    }
  }

  public async triggerActivation(userId: string) {
    const user = await User.findOne({ where: { id: userId } });
    if (user != undefined) {
      user.activated = !user.activated;
      user.save();
    }
  }

  public async deleteUser(userId: string) {
    const user = await User.findOne({ where: { id: userId } });
    if (user != undefined) {
      await user.destroy();
    }
  }

  public async updateUser(
    userId: string,
    email: string,
    password: string,
    phoneNumber: string
  ) {
    const user = await User.findOne({ where: { id: userId } });
    if (user != undefined) {
      user.email = email;
      user.setPassword(password);
      user.phone = phoneNumber;
      await user.save();
      return user;
    }
    throw new Error("User not found");
  }
}
