/** @format */

//import { Client } from "pg";
//import FuzzySet from "fuzzyset.js";
import { IAsset } from "@/types/IAsset";
import api from "@/axios/axiosInstance";

/* const db = new Client({
  user: "tu_usuario",
  host: "localhost",
  database: "tu_db",
  password: "tu_pass",
  port: 5432,
});
await db.connect();

// Lista de software conocidos para fuzzy matching
const softwareConocidos = [
  "MySQL",
  "Apache HTTP Server",
  "OpenSSL",
  "PostgreSQL",
  "Nginx",
];
const fuzzy = FuzzySet(softwareConocidos);

function normalizarNombre(nombre: string): string | null {
  const result = fuzzy.get(nombre);
  if (result && result[0][0] > 0.8) {
    return result[0][1];
  }
  return null;
}

export async function registrarSoftware(software: ISoftware) {
  const nombreNormalizado = normalizarNombre(software.software_name);
  if (!nombreNormalizado) {
    console.warn(`Software desconocido: ${software.software_name}`);
    return;
  }

  // Guardar el software normalizado
  const insertQuery = `
    INSERT INTO software (id_software, id_asset, software_name, version, manufacturer, os_host)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
    RETURNING id_software
  `;
  const values = [
    software.id_asset,
    nombreNormalizado,
    software.version,
    software.vendor,
    software.os_host,
  ];
  const result = await db.query(insertQuery, values);
  const idSoftware = result.rows[0].id_software;

  // Buscar vulnerabilidades
  const vulnQuery = `
    SELECT v.*
    FROM software_vulnerable sv
    JOIN vulnerabilidades v ON sv.cve_id = v.cve_id
    WHERE sv.software_name = $1
      AND sv.manufacturer = $2
      AND $3::text BETWEEN sv.version_min AND sv.version_max
  `;
  const vulnValues = [
    nombreNormalizado,
    software.vendor,
    software.version,
  ];
  const vulns = await db.query(vulnQuery, vulnValues);

  console.log(
    `Vulnerabilidades encontradas para el software ${nombreNormalizado} v${software.version}:`
  );
  console.table(vulns.rows);
} */

export async function postAsset(asset: IAsset) {
  try {
    const response = await api.post("/api/assets/create", asset, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error creating asset");
  }
}

// // Helper to get the value of the "token" cookie
// const getTokenFromCookie = (): string | undefined => {
//   return document.cookie
//     .split(";")
//     .map((c) => c.trim())
//     .find((c) => c.startsWith("token="))
//     ?.split("=")[1];
// };

export async function getAssets() {
  try {
    const response = await api.get("/api/assets/get", {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error fetching assets");
  }
}

export async function getAssetById(id: string) {
  try {
    const response = await api.get(`/api/assets/get/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error fetching asset");
  }
}

export async function deleteAsset(id: string) {
  try {
    const response = await api.delete(`/api/assets/delete/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Error deleting asset");
  }
}
