import { describe, expect, it } from "vitest";

import { getRouteBudget, isBudgetBreached } from "@/lib/performance/budgets";

describe("admin performance budgets", () => {
  it("resuelve presupuesto por ruta exacta", () => {
    const budget = getRouteBudget("/cotizaciones");
    expect(budget.route).toBe("/cotizaciones");
  });

  it("marca breach cuando LCP supera límite", () => {
    const result = isBudgetBreached("LCP", 99999, "/cotizaciones");
    expect(result.breached).toBe(true);
  });
});
