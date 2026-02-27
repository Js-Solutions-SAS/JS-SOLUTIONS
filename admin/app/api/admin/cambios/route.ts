import { NextResponse } from "next/server";

import { getChangeRequests, getChangeRequestMetrics } from "@/lib/admin-data";

export async function GET() {
  try {
    const items = await getChangeRequests();
    const metrics = getChangeRequestMetrics(items);

    return NextResponse.json({ items, metrics }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/cambios ERROR", error);

    return NextResponse.json(
      { error: "No fue posible obtener solicitudes de cambio." },
      { status: 500 },
    );
  }
}
