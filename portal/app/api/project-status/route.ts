import { NextResponse } from "next/server";

import { ProjectStatusError, fetchProjectStatus } from "@/lib/project-status";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const clientToken = typeof body?.clientToken === "string" ? body.clientToken : "";

    const projectData = await fetchProjectStatus(clientToken);

    return NextResponse.json(projectData, { status: 200 });
  } catch (error) {
    if (error instanceof ProjectStatusError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("Error en Route Handler /api/project-status:", error);
    return NextResponse.json(
      { error: "Error interno del servidor.", code: "internal_error" },
      { status: 500 },
    );
  }
}
