/** @format */
"use server";
import { NextRequest, NextResponse } from "next/server";
import { queryDatabase, poolCVE } from "@/dal/data-access";
import { getAllDataByCVEId } from "@/db/cveQueries";
import { convertToArray, groupAndMergeData } from "@/components/mergeJSON";
import { adaptCVERecords } from "@/lib/adaptCve";
import { getRandomCVE } from "@/db/cveQueries";

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    // Get 10 random cves
    const { text: query, values } = getRandomCVE();
    const data: any = await queryDatabase(query, values, poolCVE);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No vulnerabilities found." });
    }

    // Found all data related to the CVE ID
    const vulnerabilities = await Promise.all(
      data.map(async (vulnerability: { cve_id: string }) => {
        const { text: query, values } = getAllDataByCVEId(vulnerability.cve_id);
        const rows: any = await queryDatabase(query, values, poolCVE);

        // Convert to array
        const rowsArray = convertToArray(rows);
        // Group by cve_id
        const groupedByCVEId: any = groupAndMergeData(rowsArray);
        // Merge the data into a single object
        return adaptCVERecords(groupedByCVEId); // Assuming you want the first row for each CVE ID
      })
    );

    return NextResponse.json(vulnerabilities);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
