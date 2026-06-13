import { describe, expect, it } from "vitest";

import {
  localBusinessVerticalList,
  localBusinessVerticals,
  webPackages,
} from "@/data/local-business-content";

describe("local business content", () => {
  it("defines the first launch verticals with stable routes", () => {
    expect(localBusinessVerticalList.map((vertical) => vertical.route)).toEqual([
      "/webs/restaurantes",
      "/webs/veterinarias-oftalmologia",
      "/webs/tiendas-celulares",
      "/webs/marmolerias",
    ]);
  });

  it("keeps each vertical ready for SEO and WhatsApp conversion", () => {
    for (const vertical of localBusinessVerticalList) {
      expect(vertical.seoTitle.length).toBeGreaterThan(30);
      expect(vertical.seoDescription.length).toBeGreaterThan(80);
      expect(vertical.whatsappMessage).toContain("JS Solutions");
      expect(vertical.visibleOutcomes.length).toBeGreaterThanOrEqual(3);
      expect(vertical.flowSteps.length).toBe(3);
    }

    expect(localBusinessVerticals.restaurantes.primaryCtaLabel).toContain(
      "restaurante",
    );
  });

  it("defines visible package ranges for cold traffic", () => {
    expect(webPackages).toHaveLength(3);
    expect(webPackages.map((tier) => tier.id)).toEqual([
      "web-simple",
      "web-whatsapp",
      "web-automatizacion",
    ]);
    expect(webPackages.every((tier) => tier.range.includes("COP"))).toBe(true);
  });
});
