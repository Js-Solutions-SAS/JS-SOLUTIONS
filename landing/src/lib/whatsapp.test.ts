import { describe, expect, it } from "vitest";

import {
  createWhatsAppHref,
  getDefaultWhatsAppLabel,
  getDefaultWhatsAppMessage,
  getSectorKeyFromPath,
} from "@/lib/whatsapp";

describe("whatsapp helpers", () => {
  it("creates an encoded WhatsApp URL", () => {
    expect(createWhatsAppHref("Hola mundo")).toBe(
      "https://wa.me/573186110790?text=Hola%20mundo",
    );
  });

  it("resolves the sector key from known paths", () => {
    expect(getSectorKeyFromPath("/pymes")).toBe("pymes");
    expect(getSectorKeyFromPath("/sector-publico/")).toBe("sector_publico");
    expect(getSectorKeyFromPath("/")).toBeNull();
  });

  it("returns contextual default copy", () => {
    expect(getDefaultWhatsAppMessage("/pymes")).toContain("sistema comercial");
    expect(getDefaultWhatsAppMessage("/sector-publico")).toContain(
      "atencion ciudadana",
    );
    expect(getDefaultWhatsAppMessage("/webs/restaurantes")).toContain(
      "restaurante",
    );
    expect(getDefaultWhatsAppLabel("/webs/marmolerias")).toBe(
      "WhatsApp Marmolerias",
    );
    expect(getDefaultWhatsAppLabel("/")).toBe("WhatsApp General");
  });
});
