/** @format */

// cveService.ts
import api from "@/axios/axiosInstance";
import { config } from "@/config/config"; // Asegúrate de importar config si no está ya importado
import axios from "axios";

export async function getCves() {
  try {
    const response = await api.get("/api/cves/get", {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error fetching cves");
  }
}

export async function getCveById(id: string) {
  try {
    const response = await api.get(`/api/cves/get/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error fetching Cve");
  }
}

export async function deleteCve(id: string) {
  try {
    const response = await api.delete(`/api/cves/delete/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error deleting Cve");
  }
}
const apiML = axios.create({
  baseURL: config.BACKEND_ML_URL,
  withCredentials: true,
});

export async function getPredictions(assets: string[]) {
  try {
    // Verifica que assets no esté vacío
    const response = await apiML.post(
      `/api/predictions/get`,
      { assets }, // Enviar como { assets: assets }
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": config.BACKEND_ML_URL,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          Authorization: config.token_ML,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching predictions"
    );
  }
}

export async function getPredictionsByAssetId(id: string) {
  try {
    const response = await apiML.get(`/api/predictions/get/${id}`, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": config.BACKEND_ML_URL,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        Authorization: config.token_ML,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    throw new Error(
      error.response?.data?.message || "Error fetching predictions"
    );
  }
}

export async function deletePrediction(id: string) {
  try {
    const response = await apiML.delete(`/api/predictions/delete/${id}`, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": config.BACKEND_ML_URL,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        Authorization: config.token_ML,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error deleting prediction"
    );
  }
}
