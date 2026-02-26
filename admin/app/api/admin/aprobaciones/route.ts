import { NextResponse } from "next/server";

import {
  getApprovals,
  getApprovalMetrics,
  getApprovalStageCoverage,
} from "@/lib/admin-data";

export async function GET() {
  try {
    const items = await getApprovals();
    const metrics = getApprovalMetrics(items);
    const stageCoverage = getApprovalStageCoverage(items);

    return NextResponse.json({ items, metrics, stageCoverage }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/aprobaciones ERROR", error);

    return NextResponse.json(
      { error: "No fue posible obtener aprobaciones." },
      { status: 500 },
    );
  }
}
