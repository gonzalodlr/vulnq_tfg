/** @format */

import {
  loginUser,
  fetchUserData,
  signup,
  fetchUserNotification,
  updateUserNotification,
} from "@/services/authService";
import { sendForgotPasswordEmail } from "@/services/authService";
import { INotificationPreferences } from "@/types/INotificationPreferences";
import { NextResponse } from "next/server";

export async function handleLogin(email: string, password: string) {
  return await loginUser(email, password);
}

export async function fetchUserProfile() {
  try {
    return await fetchUserData();
  } catch (error: any) {
    throw new Error("Failed to fetch profile: " + error.message);
  }
}

export async function handleForgotPassword(email: string) {
  try {
    const response = await sendForgotPasswordEmail(email);
    return response;
  } catch (error: any) {
    throw new Error(error.message || "Failed to send reset email");
  }
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  lastName: string;
  phoneNumber: string;
}

/**
 * Thin controller that can be swapped for
 * additional client-side logic (analytics, localStorage…)
 */
export const handleSignup = async (data: SignupPayload) => {
  return await signup(data);
};

export async function handleLogout() {
  try {
    await fetch("/api/logout", { method: "GET" });
    // Redirige al usuario al login o home
    window.location.href = "/";
  } catch (error: any) {
    throw new Error("Logout failed: " + error.message);
  }
}

export async function fetchUserNotificationPreferences(): Promise<INotificationPreferences> {
  try {
    return await fetchUserNotification();
  } catch (error: any) {
    throw new Error("Failed to fetch profile: " + error.message);
  }
}

export async function updateUserNotificationPreferences(
  preferences: INotificationPreferences
): Promise<INotificationPreferences> {
  try {
    return await updateUserNotification(preferences);
  } catch (error: any) {
    throw new Error(
      "Failed to update notification preferences: " + error.message
    );
  }
}
