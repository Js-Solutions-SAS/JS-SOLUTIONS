"use server";

import { revalidatePath } from "next/cache";

interface GenerateContractInput {
  leadId: string;
  email?: string;
}

export async function generateContractAction(input: GenerateContractInput) {
  if (!input.leadId && !input.email) {
    return {
      ok: false,
      message: "Debes enviar leadId o email para generar contrato.",
    };
  }

  const webhookUrl = process.env.N8N_GENERATE_CONTRACT_URL;

  if (!webhookUrl) {
    revalidatePath("/cotizaciones");
    return {
      ok: true,
      message: "Contrato generado en modo simulado (sin webhook configurado).",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`n8n respondio con estado ${response.status}`);
    }

    revalidatePath("/cotizaciones");

    return {
      ok: true,
      message: "Contrato generado y enviado correctamente.",
    };
  } catch (error) {
    console.error("generateContractAction", error);
    return {
      ok: false,
      message: "No fue posible generar el contrato. Revisa la conexion con n8n.",
    };
  }
}
