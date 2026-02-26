import { NextResponse } from "next/server";

import { getCapacityMetrics, getTeamCapacity } from "@/lib/admin-data";

export async function GET() {
  try {
    const entries = await getTeamCapacity();
    const metrics = getCapacityMetrics(entries);

    return NextResponse.json({ entries, metrics }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/capacidad ERROR", error);

    return NextResponse.json(
      { error: "No fue posible obtener capacidad del equipo." },
      { status: 500 },
    );
  }
}
