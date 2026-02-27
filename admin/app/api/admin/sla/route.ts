import { NextResponse } from "next/server";

import {
  getTicketSLAClientSummaries,
  getTicketSLAEntries,
  getTicketSLAMetrics,
} from "@/lib/admin-data";

export async function GET() {
  try {
    const entries = await getTicketSLAEntries();
    const metrics = getTicketSLAMetrics(entries);
    const summaries = getTicketSLAClientSummaries(entries);

    return NextResponse.json({ entries, metrics, summaries }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/sla ERROR", error);

    return NextResponse.json(
      { error: "No fue posible obtener los SLA de tickets." },
      { status: 500 },
    );
  }
}
