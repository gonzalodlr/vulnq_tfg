/** @format */
"use server";
import { NextRequest, NextResponse } from "next/server";
import { queryDatabase, poolCVE } from "@/dal/data-access";
import { getAllDataByCVEId, getCVEByPrefix } from "@/db/cveQueries";
import { convertToArray, groupAndMergeData } from "@/components/mergeJSON";
import { adaptCVERecords } from "@/lib/adaptCve";

export async function GET(req: NextRequest, res: NextResponse) {
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get("prefix");

  if (!prefix) {
    return NextResponse.json(
      { error: "Missing prefix parameter" },
      { status: 400 }
    );
  }

  try {
    // Real-time prefix search: return up to 10 matches
    if (prefix && typeof prefix === "string") {
      // Get 10 first matches
      const { text: query, values } = getCVEByPrefix(prefix);
      const data: any = await queryDatabase(query, values, poolCVE);

      // Found all data related to the CVE ID
      const vulnerabilities = await Promise.all(
        data.map(async (vulnerability: { cve_id: string }) => {
          const { text: query, values } = getAllDataByCVEId(
            vulnerability.cve_id
          );
          const rows: any = await queryDatabase(query, values, poolCVE);
          const rowsArray = convertToArray(rows);
          // Group by cve_id
          const groupedByCVEId: any = groupAndMergeData(rowsArray);
          // Merge the data into a single object
          return adaptCVERecords(groupedByCVEId);
        })
      );
      return NextResponse.json(vulnerabilities, { status: 200 });
    }

    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
