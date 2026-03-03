import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const webhookUrl = process.env.N8N_GET_QUOTES_URL;

    // Fallback/Mock Mode en caso de que no haya URLs en el ambiente para evitar crashear el UI.
    if (!webhookUrl) {
      console.warn("N8N_GET_QUOTES_URL isn't set, providing mock data.");
      return NextResponse.json([
        {
          id: "L-001",
          nombre: "Camilo Rodríguez",
          empresa: "TechGroup Latam",
          servicio: "Consultoría y Arquitectura",
          monto: "$4.500.000 COP",
          estado: "Pendiente",
        },
        {
          id: "L-002",
          nombre: "Laura Medina",
          empresa: "Constructora Horizon",
          servicio: "Automatización de Ventas (n8n)",
          monto: "$2.800.000 COP",
          estado: "Cotización Revisada",
        },
      ]);
    }

    const response = await fetch(webhookUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store", // Evitamos la caché para traer siempre las cotizaciones actualizadas
    });

    if (!response.ok) {
      throw new Error(`Error en el webhook de n8n: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET admin/cotizaciones ERROR:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener las cotizaciones" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, email } = body;

    if (!leadId && !email) {
      return NextResponse.json(
        {
          error:
            "Es necesario el ID o Email del prospecto para generar tu contrato",
        },
        { status: 400 },
      );
    }

    const webhookUrl = process.env.N8N_GENERATE_CONTRACT_URL;
    if (!webhookUrl) {
      console.warn(
        "N8N_GENERATE_CONTRACT_URL no está configurado. Retornando éxito simulado.",
      );
      return NextResponse.json({
        success: true,
        message: "Contrato simulado.",
      });
    }

    // Enviamos el trigger a n8n
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Error interno enviando peticion a n8n: ${response.status}`,
      );
    }

    const result = await response.json().catch(() => ({}));
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("POST admin/cotizaciones ERROR:", error);
    return NextResponse.json(
      { error: "El contrato no pudo ser generado" },
      { status: 500 },
    );
  }
}
