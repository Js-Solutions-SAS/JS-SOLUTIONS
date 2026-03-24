import { describe, expect, it } from "vitest";

import { getRouteBudget, isBudgetBreached } from "@/lib/performance/budgets";

describe("landing performance budgets", () => {
  it("resuelve presupuesto para cotizador", () => {
    const budget = getRouteBudget("/cotizador");
    expect(budget.route).toBe("/cotizador");
  });

  it("no marca breach cuando CLS está dentro de presupuesto", () => {
    const result = isBudgetBreached("CLS", 0.05, "/");
    expect(result.breached).toBe(false);
  });
});
