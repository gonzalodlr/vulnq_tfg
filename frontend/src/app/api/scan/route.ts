/**
 * /api/scan – Express router (TypeScript)
 *
 * Supports three modes:
 *   – mode=single  & software=<slug>  → scan one piece of software
 *   – mode=all                           → scan every software item registered to the current tenant/user
 *   – mode=asset  & assetId=<id>        → scan all software installed on a specific asset
 *
 * Every successful request returns an array of objects:
 *  {
 *    software: string;   // canonical software name (e.g. "nginx")
 *    title:    string;   // vulnerability title (e.g. "Buffer overflow in …")
 *    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
 *    cve:      string;   // CVE identifier (e.g. "CVE-2024-1234")
 *  }
 *
 * NOTE: The actual scanning logic is stubbed out here – plug in your own
 * integration (e.g. call to an internal micro‑service, OSSIndex, NVD API,
 * or local CVE database).
 *
 * @format
 */

import { poolCVE, queryDatabase } from "@/dal/data-access";
import { auditByProductVersion } from "@/db/cveQueries";
import { NextRequest, NextResponse } from "next/server";
import { ISoftware } from "@/types/ISoftware";
import { cookies } from "next/headers";
import { config } from "@/config/config";

/** ------------------------------------------------------------------
 * Route handler
 * ----------------------------------------------------------------*/
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "";

    let results: any[] = [];

    switch (mode) {
      case "single": {
        const software = searchParams.get("software");
        const data = await req.json();
        if (!software) {
          return NextResponse.json(
            { error: "Parameter 'software' is required when mode=single" },
            { status: 400 }
          );
        }
        results = await scanSingleSoftware(software, data);
        break;
      }

      case "all": {
        results = await scanAllSoftware();
        break;
      }

      case "asset": {
        const assetId = searchParams.get("assetId");
        if (!assetId) {
          return NextResponse.json(
            { error: "Parameter 'assetId' is required when mode=asset" },
            { status: 400 }
          );
        }
        results = await scanByAsset(assetId);
        break;
      }

      default:
        return NextResponse.json(
          { error: "Unknown or missing 'mode' query parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("/api/scan error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** ------------------------------------------------------------------
 * Stubbed scanning functions
 * ----------------------------------------------------------------*/
async function scanSingleSoftware(
  software: string,
  softwareObject: any
): Promise<any[]> {
  // TODO: Replace with call to actual scanner service / DB

  if (!softwareObject || software !== softwareObject.id_software) {
    throw new Error(
      `Software with ID ${software} not found in session storage`
    );
  }
  const asset = await fetchAssetById(softwareObject.id_asset);
  // Usamos tu DAL para acceder a la DB de vulnerabilidades (CVE)
  const { text: query, values } = auditByProductVersion(
    softwareObject.software_name,
    softwareObject.version
  );
  const rows: any = await queryDatabase(query, values, poolCVE);
  // Add asset info to each row
  return rows.map((row: any) => ({
    ...row,
    asset,
  }));
}

async function scanAllSoftware(): Promise<any[]> {
  // Fetch all software for the current tenant/user
  const softwareList: ISoftware[] = await fetchSoftwareByAsset();
  if (!softwareList || softwareList.length === 0) {
    throw new Error("No software found for the current tenant/user");
  }

  // Use Promise.all to await all scans in parallel
  const allResults = await Promise.all(
    softwareList
      .filter((software) => software.software_name && software.version)
      .map(async (software) => {
        const asset = await fetchAssetById(software.id_asset);
        const { text: query, values } = auditByProductVersion(
          software.software_name,
          software.version
        );
        const rows: any = await queryDatabase(query, values, poolCVE);
        // Map each row to ScanResult type
        return rows.map((row: any) => ({
          ...row,
          asset,
        }));
      })
  );

  // Flatten the array of arrays and return
  return allResults.flat();
}

async function scanByAsset(assetId: string): Promise<any[]> {
  const softwareList: ISoftware[] = await fetchSoftwareByAsset();
  if (!softwareList || softwareList.length === 0) {
    throw new Error(`No software found for asset ID ${assetId}`);
  }
  const softAsset = softwareList.filter((s) => s.id_asset === assetId);
  const asset = await fetchAssetById(assetId);

  // Use Promise.all to await all scans in parallel
  const allResults = await Promise.all(
    softAsset
      .filter((software) => software.software_name && software.version)
      .map(async (software) => {
        const { text: query, values } = auditByProductVersion(
          software.software_name,
          software.version
        );
        const rows: any = await queryDatabase(query, values, poolCVE);
        // Map each row to ScanResult type
        return rows.map((row: any) => ({
          ...row,
          asset,
        }));
      })
  );
  console.log("allResults", allResults);

  const uniqueCVEs: any[] = [];
  const seen = new Set<string>();

  for (const resultArr of allResults) {
    for (const item of resultArr) {
      if (item.cve_id && !seen.has(item.cve_id)) {
        uniqueCVEs.push(item);
        seen.add(item.cve_id);
      }
    }
  }
  return uniqueCVEs;
}

/** ------------------------------------------------------------------
 * Helper functions to fetch software and asset data
 * ----------------------------------------------------------------*/

async function fetchSoftwareByAsset(): Promise<ISoftware[]> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const res = await fetch(`${config.BACKEND_URL}/api/softwares/get`, {
    headers: {
      Cookie: `session_token=${sessionToken}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error fetching softwares");
  return await res.json();
}

async function fetchAssetById(assetId: string) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  const res = await fetch(`${config.BACKEND_URL}/api/assets/get/${assetId}`, {
    headers: {
      Cookie: `session_token=${sessionToken}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error fetching asset");
  return res.json();
}
