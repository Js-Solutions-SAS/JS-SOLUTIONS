export const WHATSAPP_BASE_URL = "https://wa.me/573186110790";

import { getLocalBusinessVerticalByRoute } from "@/data/local-business-content";

export type SectorKey = "pymes" | "sector_publico";

const DEFAULT_MESSAGE =
  "Hola JS Solutions, quiero conocer la mejor ruta para automatizar mi operacion.";

const SECTOR_MESSAGES: Record<SectorKey, string> = {
  pymes:
    "Hola JS Solutions, quiero ver como funcionaria un sistema comercial por WhatsApp para mi empresa.",
  sector_publico:
    "Hola JS Solutions, quiero conocer el sistema de atencion ciudadana asistida para mi entidad.",
};

export function createWhatsAppHref(message: string): string {
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}

export function getSectorKeyFromPath(pathname: string): SectorKey | null {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/pymes") {
    return "pymes";
  }

  if (normalizedPath === "/sector-publico") {
    return "sector_publico";
  }

  return null;
}

export function getDefaultWhatsAppMessage(pathname: string): string {
  const vertical = getLocalBusinessVerticalByRoute(pathname);
  if (vertical) return vertical.whatsappMessage;

  const sectorKey = getSectorKeyFromPath(pathname);
  return sectorKey ? SECTOR_MESSAGES[sectorKey] : DEFAULT_MESSAGE;
}

export function getDefaultWhatsAppLabel(pathname: string): string {
  const vertical = getLocalBusinessVerticalByRoute(pathname);
  if (vertical) return `WhatsApp ${vertical.navLabel}`;

  const sectorKey = getSectorKeyFromPath(pathname);

  if (sectorKey === "pymes") {
    return "WhatsApp PyMES";
  }

  if (sectorKey === "sector_publico") {
    return "WhatsApp Sector Publico";
  }

  return "WhatsApp General";
}
