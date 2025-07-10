/** @format */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { config } from "@/config/config";
import { ScanResultsProps } from "@/types/ScanResultsProps";

// HELPERS FUNCTIONS
async function saveReportToDatabase(report: ScanResultsProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  //console.log("Session Token:", sessionToken);
  const res = await fetch(`${config.BACKEND_URL}/api/reports/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session_token=${sessionToken}`,
    },
    cache: "no-store",
    body: JSON.stringify({ report: report }),
  });
  if (res.status === 409) {
    return NextResponse.json(
      { message: "Report already exists for this client" },
      { status: 200 }
    );
  }
  if (!res.ok) {
    const error = await res.text();
    console.error("Unexpected error saving report:", error);
    throw new Error("Error saving report to database");
  }
  return NextResponse.json(report, { status: 201 });
}

async function prediction() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  //console.log("Session Token:", sessionToken);
  const res = await fetch(`${config.BACKEND_ML_URL}/api/predict/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session_token=${sessionToken}`,
      Authorization: `Bearer ${config.token_ML}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error making predictions for assets");
  return NextResponse.json(res, { status: 201 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Save report to database
    const result = await saveReportToDatabase(body as ScanResultsProps);
    const result2 = await prediction();

    return NextResponse.json(
      { message: "Report saved", result, result2 },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in save-report route:", error);
    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 400 }
    );
  }
}
