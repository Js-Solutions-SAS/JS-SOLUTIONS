import { NextResponse } from "next/server";

import { getDeliveryMetrics, getMilestones } from "@/lib/admin-data";

export async function GET() {
  try {
    const milestones = await getMilestones();
    const metrics = getDeliveryMetrics(milestones);

    return NextResponse.json({ milestones, metrics }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/entregas ERROR", error);

    return NextResponse.json(
      { error: "No fue posible obtener entregas desde n8n." },
      { status: 500 },
    );
  }
}
