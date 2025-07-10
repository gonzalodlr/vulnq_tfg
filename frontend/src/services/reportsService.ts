/** @format */

import api from "@/axios/axiosInstance";

export async function getReports() {
  try {
    const response = await api.get("/api/reports/get", {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error fetching Reports");
  }
}

export async function getReportById(id: string) {
  try {
    const response = await api.get(`/api/reports/get/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error fetching Report");
  }
}

export async function deleteReport(id: string) {
  try {
    const response = await api.delete(`/api/reports/delete/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error deleting Report");
  }
}
