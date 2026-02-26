import "server-only";

import type { DashboardMetrics, Quote, SOP } from "@/lib/types";
import { normalizeQuote, statusTone } from "@/lib/quote-utils";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const MOCK_QUOTES: Quote[] = [
  {
    id: "L-001",
    nombre: "Camilo Rodriguez",
    empresa: "TechGroup Latam",
    servicio: "Consultoria y Arquitectura",
    monto: "$4,500 USD",
    estado: "Pendiente",
    industria: "General",
  },
  {
    id: "L-002",
    nombre: "Laura Medina",
    empresa: "Retail Horizon",
    servicio: "Automatizacion de ventas e-commerce",
    monto: "$2,800 USD",
    estado: "En Proceso",
    industria: "Retail / E-commerce",
  },
  {
    id: "L-003",
    nombre: "Andres Pardo",
    empresa: "Secretaria de Movilidad",
    servicio: "Plataforma de atencion ciudadana",
    monto: "$7,200 USD",
    estado: "Firmado",
    industria: "Sector Publico",
  },
];

const MOCK_SOPS: SOP[] = [
  {
    id: "sop-1",
    title: "Onboarding de nuevo cliente",
    category: "Operaciones",
    description:
      "Checklist de alta de cliente, creacion de tablero y entrega de accesos.",
    resourceType: "Documento",
    url: "#",
  },
  {
    id: "sop-2",
    title: "Flujo de aprobacion de contrato",
    category: "Legal",
    description:
      "Secuencia de validacion, firma y activacion de automatizaciones en n8n.",
    resourceType: "Video",
    url: "#",
  },
];

export async function getQuotes(): Promise<Quote[]> {
  const webhookUrl = process.env.N8N_GET_QUOTES_URL;

  if (!webhookUrl) {
    return MOCK_QUOTES;
  }

  const response = await fetch(webhookUrl, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible obtener cotizaciones desde n8n.");
  }

  const raw = await response.json();
  const items = Array.isArray(raw) ? raw : raw.quotes || [];

  return items.map((item: Partial<Quote>, index: number) => normalizeQuote(item, index));
}

export async function getSops(): Promise<SOP[]> {
  const webhookUrl = process.env.N8N_SOPS_WEBHOOK_URL;

  if (!webhookUrl) {
    return MOCK_SOPS;
  }

  const response = await fetch(webhookUrl, {
    method: "GET",
    headers: {
      ...DEFAULT_HEADERS,
      Authorization: `Bearer ${process.env.N8N_SECRET_TOKEN || ""}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("No fue posible sincronizar los SOPs desde n8n.");
  }

  const raw = await response.json();
  return Array.isArray(raw) ? raw : raw.data || [];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [quotes, sops] = await Promise.all([getQuotes(), getSops()]);

  return {
    proyectosActivos: quotes.filter((quote) => statusTone(quote.estado) === "progress").length,
    cotizacionesPendientes: quotes.filter((quote) => statusTone(quote.estado) === "pending").length,
    contratosGenerados: quotes.filter((quote) => statusTone(quote.estado) === "success").length,
    totalSops: sops.length,
  };
}
