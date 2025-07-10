/** @format */

import { config } from "@/config/config";
import ScanResults from "@/components/auditResults";
import { cookies } from "next/headers";

export async function getReportResults(id: string): Promise<any | null> {
  const cookieStore = cookies();
  const sessionToken = (await cookieStore).get("session_token")?.value;

  const res = await fetch(`${config.BACKEND_URL}/api/reports/get/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: `session_token=${sessionToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // If backend sends 404, treat as not found
    return null;
  }

  // Check if the response is JSON
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const text = await res.text();
    console.error("Non-JSON response:", text.slice(0, 200));
    return null;
  }

  const report = await res.json();
  return report ? report : null;
}
export default async function ReportPage(context: { params: { id: string } }) {
  const { params } = context;
  const id = params.id;

  if (!id) {
    return <div>No report ID provided.</div>;
  }

  const results = await getReportResults(id);
  const jsonResults = results.data.results;

  if (!results) {
    return <div>Report {id} not found.</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <ScanResults results={jsonResults} />
    </div>
  );
}
