/** @format */
"use server";
import { NextRequest, NextResponse } from "next/server";
import { queryDatabase, poolCVE } from "@/dal/data-access";
import { getProduct } from "@/db/cveQueries";

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
      const { text: query, values } = getProduct(prefix);
      const data: any = await queryDatabase(query, values, poolCVE);
      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: `No products found with prefix ${prefix}` },
          { status: 404 }
        );
      }
      const productNames = data.map((item: any) => ({
        product_name: item.product_name,
      }));
      console.log("Product names fetched:", productNames);
      return NextResponse.json(productNames, { status: 200 });
    }

    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
