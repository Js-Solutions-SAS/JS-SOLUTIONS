export type FrontendMetricName = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";

export interface RouteBudget {
  route: string;
  lcpMs: number;
  inpMs: number;
  cls: number;
  fcpMs: number;
  ttfbMs: number;
}

const routeBudgets: RouteBudget[] = [
  {
    route: "/",
    lcpMs: 1800,
    inpMs: 180,
    cls: 0.08,
    fcpMs: 1200,
    ttfbMs: 800,
  },
  {
    route: "/cotizador",
    lcpMs: 2200,
    inpMs: 220,
    cls: 0.1,
    fcpMs: 1500,
    ttfbMs: 900,
  },
];

const defaultBudget: RouteBudget = {
  route: "*",
  lcpMs: 2400,
  inpMs: 250,
  cls: 0.1,
  fcpMs: 1600,
  ttfbMs: 1000,
};

export function getRouteBudget(pathname: string): RouteBudget {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  const matched = [...routeBudgets]
    .sort((left, right) => right.route.length - left.route.length)
    .find((entry) => normalized === entry.route || normalized.startsWith(`${entry.route}/`));

  return matched || defaultBudget;
}

export function getBudgetLimitForMetric(
  budget: RouteBudget,
  metric: FrontendMetricName,
): number {
  if (metric === "LCP") return budget.lcpMs;
  if (metric === "INP") return budget.inpMs;
  if (metric === "CLS") return budget.cls;
  if (metric === "FCP") return budget.fcpMs;
  return budget.ttfbMs;
}

export function isBudgetBreached(
  metric: FrontendMetricName,
  value: number,
  pathname: string,
): { breached: boolean; budget: RouteBudget; limit: number } {
  const budget = getRouteBudget(pathname);
  const limit = getBudgetLimitForMetric(budget, metric);

  return {
    breached: value > limit,
    budget,
    limit,
  };
}

export function listRouteBudgets(): RouteBudget[] {
  return [...routeBudgets];
}
