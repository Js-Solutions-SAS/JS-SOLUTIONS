import { NextResponse } from "next/server";

export async function GET() {
  const webhookUrl = process.env.N8N_SOPS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("Missing N8N_SOPS_WEBHOOK_URL environment variable");
    return NextResponse.json(
      { error: "La URL del webhook no está configurada." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Cache settings could be "no-store", "force-cache" or next: { revalidate: X }
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Error en el webhook: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error al obtener los SOPs:", error);
    return NextResponse.json(
      { error: "Hubo un problema al procesar la solicitud." },
      { status: 500 },
    );
  }
}
