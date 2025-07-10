/** @format */
"use server";
import { NextRequest, NextResponse } from "next/server";
import { queryDatabase, poolCVE } from "@/dal/data-access"; // Ajusta la ruta si no está en lib
import { getAllDataByCVEId } from "@/db/cveQueries";

function isValidCVE(id: string): boolean {
  return /^CVE-\d{4}-\d{1,}$/.test(id);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = await params?.id;
  //console.log("Received ID:", id);
  // Validar formato del ID
  if (!isValidCVE(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    // Usamos tu DAL para acceder a la DB de vulnerabilidades (CVE)
    const { text: query, values } = getAllDataByCVEId(id);
    const rows: any = await queryDatabase(query, values, poolCVE);

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: `No vulnerability found with ID ${id}` },
        { status: 404 }
      );
    }

    // Transform the data into adapted format (NOT HERE)

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error accessing database:", error);
    return NextResponse.json({ error: "Error in server" }, { status: 500 });
  }
}
