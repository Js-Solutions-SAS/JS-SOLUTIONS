import { NextResponse } from "next/server";

import {
  getExecutivePortfolioEntries,
  getExecutivePortfolioMetrics,
} from "@/lib/admin-data";

export async function GET() {
  try {
    const entries = await getExecutivePortfolioEntries();
    const metrics = getExecutivePortfolioMetrics(entries);

    return NextResponse.json({ entries, metrics }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/portafolio ERROR", error);

    return NextResponse.json(
      { error: "No fue posible obtener el portafolio ejecutivo." },
      { status: 500 },
    );
  }
}
