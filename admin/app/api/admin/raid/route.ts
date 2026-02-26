import { NextResponse } from "next/server";

import {
  getRaidItems,
  getRaidMetrics,
  getRaidProjectSummaries,
} from "@/lib/admin-data";

export async function GET() {
  try {
    const items = await getRaidItems();
    const metrics = getRaidMetrics(items);
    const summaries = getRaidProjectSummaries(items);

    return NextResponse.json({ items, metrics, summaries }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/raid ERROR", error);

    return NextResponse.json(
      { error: "No fue posible obtener el RAID log." },
      { status: 500 },
    );
  }
}
