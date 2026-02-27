import { NextResponse } from "next/server";

import {
  getOperationalFinanceClientSummaries,
  getOperationalFinanceEntries,
  getOperationalFinanceMetrics,
} from "@/lib/admin-data";

export async function GET() {
  try {
    const entries = await getOperationalFinanceEntries();
    const metrics = getOperationalFinanceMetrics(entries);
    const summaries = getOperationalFinanceClientSummaries(entries);

    return NextResponse.json({ entries, metrics, summaries }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/finanzas ERROR", error);

    return NextResponse.json(
      { error: "No fue posible obtener finanzas operativas." },
      { status: 500 },
    );
  }
}
