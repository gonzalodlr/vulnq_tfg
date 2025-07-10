/** @format */
import api from "@/axios/axiosInstance";
import type { SignupPayload } from "@/controllers/authController";
import { INotificationPreferences } from "@/types/INotificationPreferences";
import { IUser } from "@/types/IUser";

export async function loginUser(email: string, password: string) {
  try {
    const response = await api.post(
      "/api/login",
      { email, password },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    // // Sacar el token del encabezado de la respuesta
    // const token = response.headers["token"];
    // if (token) {
    //   axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    //   sessionStorage.setItem("token", token);
    // }

    //sessionStorage.setItem("user", JSON.stringify(response.data));
    // Devolver los datos del usuario
    return response.data;
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(error.response?.data?.message || "Invalid credentials");
  }
}

// Obtain Access Token using Refresh Token
export const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await api.post(
      "/api/refresh-token",
      { refreshToken },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error refreshing access token", error);
    throw error;
  }
};

export const fetchUserData: () => Promise<IUser> = async () => {
  try {
    const response = await api.get("/api/auth/user", {
      withCredentials: true,
    });
    console.log("User Data:", response.data); // Verificar los datos del usuario

    return response.data;
  } catch (error: any) {
    console.error("Error fetching user data", error);
    if (error.response && error.response.status === 401) {
      throw new Error("Unauthorized access. Please log in again.");
    }
  }
};

/** POST /auth/signup */
export const signup = async (payload: SignupPayload) => {
  try {
    const { email, password, name, lastName } = payload;
    const response = await api.post(
      "/api/signup",
      {
        email,
        password,
        name,
        lastName,
      },
      {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data; // response.data contendrá el DTO devuelto por el backend
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Signup failed");
  }
};

export async function sendForgotPasswordEmail(email: string) {
  try {
    const response = await api.post("/api/auth/forgot-password", { email });
    return response.data; // Devuelve la respuesta del backend
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error sending reset email"
    );
  }
}

export async function fetchUserNotification() {
  try {
    const response = await api.get("/api/notifications/preferences/get", {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching notifications", error);
    throw new Error(
      error.response?.data?.message || "Error fetching notifications"
    );
  }
}

export async function updateUserNotification(
  preferences: INotificationPreferences
) {
  try {
    const response = await api.put(
      "/api/notifications/preferences/update",
      preferences,
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating notification preferences", error);
    throw new Error(
      error.response?.data?.message || "Error updating notification preferences"
    );
  }
}
