/** @format */

import fs from "fs";
import path from "path";
import { Resend } from "resend";
import NotificationPreferences from "../models/notificationPreferences.model";
import { NotificationType } from "../types/notification.type";
import { IUser } from "../interfaces/IUser";
import { config } from "../config/config";

const resend = new Resend(config.RESEND_API_KEY);

const SUBJECTS: Record<NotificationType, string> = {
  risk: "⚠️ Risk Alert",
  audit: "📋 Audit Notice",
  update: "🔄 System Update",
};
const URL_ACTIVATION_LINK = `http://localhost:3000/auth/activate/`;
const TEMPLATE_PATHS: Record<NotificationType, string> = {
  risk: "risk.html",
  audit: "audit.html",
  update: "update.html",
};

const getPreferenceField = (type: NotificationType): string => {
  switch (type) {
    case "risk":
      return "notifyRisk";
    case "audit":
      return "notifyAudit";
    case "update":
      return "notifyUpdate";
    default:
      throw new Error("Invalid notification type");
  }
};

/**
 * Sends notifications of a given type to all users who opted in
 */
export const sendNotificationsForType = async (
  type: NotificationType,
  user: IUser
): Promise<void> => {
  const field = getPreferenceField(type);
  const templatePath = path.join(
    __dirname,
    "..",
    "views",
    "templates",
    TEMPLATE_PATHS[type]
  );
  const html = fs.readFileSync(templatePath, "utf-8");

  // Check if user has opted in for this notification type
  const preference = await NotificationPreferences.findOne({
    where: { userId: user.id },
  });
  if (!preference || !(preference as any)[field]) {
    console.log(`User ${user.id} has not opted in for ${type} notifications.`);
    return;
  }
  // Send the email using Resend
  if (!user.email) {
    console.error(`User ${user.id} does not have an email address.`);
    return;
  }

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: user.email,
    subject: SUBJECTS[type],
    html,
  });
};

/**
 * Create a new account activation notification for a user
 */
export const sendActivationEmail = async (
  email: string,
  activationCode: string
) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "activation.html"
  );
  let html = fs.readFileSync(templatePath, "utf-8");

  // Rellena el template con el código y el enlace
  html = html.replace("{{ACTIVATION_CODE}}", activationCode);
  html = html.replace(
    "{{ACTIVATION_LINK}}",
    `${URL_ACTIVATION_LINK}${activationCode}`
  );

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Activate your account",
    html,
  });
};
