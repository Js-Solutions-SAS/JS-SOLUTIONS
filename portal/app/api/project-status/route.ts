import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientToken } = body;

    // Validación básica del token
    if (!clientToken || typeof clientToken !== "string") {
      return NextResponse.json(
        { error: "Token de acceso requerido e inválido." },
        { status: 400 }, // Bad Request
      );
    }

    if (!process.env.N8N_WEBHOOK_URL) {
      console.error("N8N_WEBHOOK_URL no está configurada.");
      return NextResponse.json(
        { error: "Error de configuración del servidor." },
        { status: 500 },
      );
    }

    // Petición al webhook de n8n
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.N8N_SECRET_TOKEN || ""}`,
      },
      body: JSON.stringify({ clientToken }),
      cache: "no-store",
    });

    if (!n8nResponse.ok) {
      if (n8nResponse.status === 404) {
        return NextResponse.json(
          { error: "Token caducado o proyecto no encontrado." },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Error al contactar con el sistema central (n8n)." },
        { status: 502 }, // Bad Gateway
      );
    }

    const projectData = await n8nResponse.json();

    // Verificación de la estructura devuelta por n8n
    if (!projectData || !projectData.projectName) {
      return NextResponse.json(
        { error: "Token no válido o datos del proyecto incompletos." },
        { status: 401 }, // Unauthorized
      );
    }

    return NextResponse.json(projectData, { status: 200 });
  } catch (error) {
    console.error("Error en Route Handler /api/project-status:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}

/*
 * --- GUÍA DE CONFIGURACIÓN N8N PARA MAGIC LINKS ---
 *
 * 1. Webhook Trigger: Recibirá una petición POST con este JSON:
 *    { "clientToken": "TOKEN_UNICO_DEL_CLIENTE" }
 *
 * 2. Lookup Google Sheets:
 *    - Configura un nodo para leer tu documento.
 *    - Hoja: 'CRM Clientes' o 'Proyectos'.
 *    - Columna de Búsqueda (Lookup Column): 'Token' o 'MagicLinkID'.
 *    - Valor de Búsqueda (Lookup Value): `{{ $json.body.clientToken }}`
 *
 * 3. Respuesta del Webhook:
 *    - Si el nodo de Sheets NO encuentra datos (Item vacío), debes
 *      hacer que el 'Respond to Webhook' nodo retorne Status Code 404.
 *    - Si SÍ encuentra la fila, continúa operando para traer las Tareas.
 *    - Al final, el último nodo de Código debe retornar el JSON formateado:
 *      {
 *         "projectName": "...",
 *         "serviceType": "...",
 *         "currentPhase": "...",
 *         "progressPercentage": 50,
 *         "driveFolderUrl": "...",
 *         "tasks": [ ... ]
 *      }
 */
