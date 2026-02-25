import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Parseamos el body enviado desde nuestro Front-End
    const body = await request.json();
    const { identifier } = body; // Puede ser email o código único

    if (!identifier) {
      return NextResponse.json(
        { error: "Se requiere un email o código de acceso válido." },
        { status: 400 },
      );
    }

    // Petición POST al webhook de n8n.
    // Ocultamos la URL y el Token en el servidor (BFF Pattern).
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Token opcional para validar que la petición viene de nuestro Next.js
        Authorization: `Bearer ${process.env.N8N_SECRET_TOKEN || ""}`,
      },
      body: JSON.stringify({ identifier }),
      // Importante: No cachear para asegurar que el cliente vea el estado en tiempo real
      cache: "no-store",
    });

    if (!n8nResponse.ok) {
      // Manejo de errores si n8n falla o el flujo devuelve error (Ej. Cliente no encontrado)
      throw new Error(`Error en el servicio de n8n: ${n8nResponse.status}`);
    }

    // Esperamos un JSON desde n8n estructurado con los datos del proyecto y sus tareas
    const data = await n8nResponse.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("[API_PROJECT_STATUS_ERROR]:", error);
    return NextResponse.json(
      {
        error: "Hubo un problema procesando la solicitud. Intente nuevamente.",
      },
      { status: 500 },
    );
  }
}
