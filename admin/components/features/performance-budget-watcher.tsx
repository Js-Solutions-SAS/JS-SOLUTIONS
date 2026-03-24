"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type Metric,
} from "web-vitals";

import {
  isBudgetBreached,
  type FrontendMetricName,
} from "@/lib/performance/budgets";

interface AlertPayload {
  app: "admin";
  route: string;
  metric: FrontendMetricName;
  value: number;
  limit: number;
  rating: string;
  id: string;
  timestamp: string;
}

function parseMetricName(name: string): FrontendMetricName | null {
  if (name === "LCP" || name === "INP" || name === "CLS" || name === "FCP" || name === "TTFB") {
    return name;
  }

  return null;
}

export function PerformanceBudgetWatcher() {
  const pathname = usePathname();
  const routeRef = useRef(pathname);
  const emittedRef = useRef(new Set<string>());

  useEffect(() => {
    routeRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const reportMetric = (metric: Metric) => {
      const metricName = parseMetricName(metric.name);
      if (!metricName) return;

      const currentPath = routeRef.current || "/";
      const { breached, limit } = isBudgetBreached(metricName, metric.value, currentPath);

      if (!breached) {
        return;
      }

      const fingerprint = `${currentPath}:${metricName}:${metric.id}`;
      if (emittedRef.current.has(fingerprint)) {
        return;
      }

      emittedRef.current.add(fingerprint);

      const payload: AlertPayload = {
        app: "admin",
        route: currentPath,
        metric: metricName,
        value: metric.value,
        limit,
        rating: metric.rating,
        id: metric.id,
        timestamp: new Date().toISOString(),
      };

      fetch("/api/admin/performance-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // No bloquear UX por telemetría.
      });
    };

    onCLS(reportMetric, { reportAllChanges: false });
    onINP(reportMetric);
    onLCP(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
  }, []);

  return null;
}
