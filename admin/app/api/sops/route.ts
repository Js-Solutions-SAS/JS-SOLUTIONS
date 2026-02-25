import { NextResponse } from "next/server";

export async function GET() {
  try {
    const webhookUrl = process.env.N8N_SOPS_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error(
        "[API_ADMIN_SOPS] N8N_SOPS_WEBHOOK_URL no está configurada.",
      );
      return NextResponse.json(
        { error: "Error de configuración del servidor en Módulo SOPs." },
        { status: 500 },
      );
    }

    // Petición al webhook de n8n para obtener las operaciones SOP
    const n8nResponse = await fetch(webhookUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Opcional: añade headers de autorización si la ruta de n8n lo requiere
        Authorization: `Bearer ${process.env.N8N_SECRET_TOKEN || ""}`,
      },
      // Recomendamos no cachear para que el administrador siempre vea
      // los últimos SOPs añadidos en el Google Sheet al recargar
      cache: "no-store",
    });

    if (!n8nResponse.ok) {
      console.error(
        `[API_ADMIN_SOPS] Error de n8n: ${n8nResponse.status} ${n8nResponse.statusText}`,
      );
      return NextResponse.json(
        {
          error:
            "No se pudieron recuperar los Procedimientos Operativos (SOPs).",
        },
        { status: n8nResponse.status === 404 ? 404 : 502 },
      );
    }

    const sopsData = await n8nResponse.json();

    return NextResponse.json(sopsData, { status: 200 });
  } catch (error) {
    console.error("[API_ADMIN_SOPS] Excepción interna:", error);
    return NextResponse.json(
      { error: "Error interno del servidor conectando con Operaciones." },
      { status: 500 },
    );
  }
}
