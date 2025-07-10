/** @format */

import { ISoftware } from "@/types/ISoftware";
import api from "@/axios/axiosInstance";

export async function postSoftware(software: ISoftware) {
  try {
    const response = await api.post("/api/softwares/create", software, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status !== 201) {
      throw new Error("Failed to create software");
    } else {
      console.log("Software created successfully:", response.data);
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error creating software");
  }
}

export async function getSoftwares(): Promise<ISoftware[]> {
  try {
    const response = await api.get("/api/softwares/get", {
      withCredentials: true,
    });
    return response.data as ISoftware[];
  } catch (error: any) {
    console.error("Error fetching softwares:", error);
    throw new Error(
      error.response?.data?.message || "Error fetching softwares"
    );
  }
}

export async function getSoftwareById(id: string): Promise<ISoftware> {
  try {
    const response = await api.get(`/api/softwares/get/${id}`, {
      withCredentials: true,
    });
    return response.data as ISoftware;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error fetching software");
  }
}

export async function deleteSoftware(id: string): Promise<{ message: string }> {
  try {
    const response = await api.delete(`/api/softwares/delete/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error deleting software");
  }
}
