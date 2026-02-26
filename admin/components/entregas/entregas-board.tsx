"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  daysUntil,
  isMilestoneDone,
  milestoneRiskLevel,
} from "@/lib/milestone-utils";
import type { DeliveryMetrics, Milestone } from "@/lib/types";

interface EntregasBoardProps {
  milestones: Milestone[];
  metrics: DeliveryMetrics;
}

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function getDayKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function statusBadgeTone(status: string): "pending" | "progress" | "success" | "neutral" {
  const value = status.toLowerCase();

  if (value.includes("complet")) return "success";
  if (value.includes("progreso") || value.includes("curso")) return "progress";
  if (value.includes("pend") || value.includes("qa") || value.includes("revision")) return "pending";
  return "neutral";
}

export function EntregasBoard({ milestones, metrics }: EntregasBoardProps) {
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [industry, setIndustry] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const industries = useMemo(() => {
    const values = new Set(milestones.map((milestone) => milestone.industry || "General"));
    return ["Todas", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [milestones]);

  const statuses = useMemo(() => {
    const values = new Set(milestones.map((milestone) => milestone.status || "Pendiente"));
    return ["Todos", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [milestones]);

  const filtered = useMemo(() => {
    return milestones.filter((milestone) => {
      const byIndustry = industry === "Todas" || milestone.industry === industry;
      const byStatus = status === "Todos" || milestone.status === status;
      return byIndustry && byStatus;
    });
  }, [industry, milestones, status]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, Milestone[]>();

    for (const milestone of filtered) {
      const key = getDayKey(new Date(milestone.dueDate));
      const list = map.get(key) || [];
      list.push(milestone);
      map.set(key, list);
    }

    return map;
  }, [filtered]);

  const monthData = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay.getDay();

    const cells: Array<{ key: string; day: number | null; date: Date | null }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ key: `offset-${i}`, day: null, date: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({ key: `day-${day}`, day, date });
    }

    return {
      monthLabel: new Intl.DateTimeFormat("es-CO", {
        month: "long",
        year: "numeric",
      }).format(firstDay),
      cells,
    };
  }, [monthCursor]);

  const selectedDateMilestones = useMemo(() => {
    if (!selectedDate) return [];
    return groupedByDate.get(selectedDate) || [];
  }, [groupedByDate, selectedDate]);

  const riskMilestones = useMemo(() => {
    return filtered
      .filter((milestone) => {
        const risk = milestoneRiskLevel(milestone);
        return !isMilestoneDone(milestone) && (risk === "high" || risk === "medium");
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [filtered]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Entregables Activos
              <CalendarDays className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Vencidos
              <AlertTriangle className="h-4 w-4 text-rose-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-200">{metrics.overdue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Proximos 7 Dias
              <Clock3 className="h-4 w-4 text-amber-200" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-100">{metrics.dueIn7Days}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Bloqueados
              <ShieldAlert className="h-4 w-4 text-orange-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-200">{metrics.blocked}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-white">Calendario de Entregas</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setMonthCursor(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-40 text-center text-sm font-semibold capitalize text-brand-off-white/80">
                  {monthData.monthLabel}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setMonthCursor(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                {industries.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Industria: {option}
                  </option>
                ))}
              </Select>

              <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                {statuses.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Estado: {option}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-brand-off-white/45">
              {WEEK_DAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthData.cells.map((cell) => {
                if (!cell.date || !cell.day) {
                  return <div key={cell.key} className="h-24 rounded-lg border border-transparent" />;
                }

                const key = getDayKey(cell.date);
                const hits = groupedByDate.get(key) || [];
                const isSelected = selectedDate === key;
                const hasHighRisk = hits.some(
                  (milestone) => milestoneRiskLevel(milestone) === "high",
                );

                return (
                  <button
                    key={cell.key}
                    onClick={() => setSelectedDate(key)}
                    className={`h-24 rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? "border-brand-gold bg-brand-gold/10"
                        : "border-white/10 bg-white/5 hover:border-brand-gold/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{cell.day}</span>
                      {hits.length > 0 && (
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            hasHighRisk ? "bg-rose-300" : "bg-brand-gold"
                          }`}
                        />
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-[11px] text-brand-off-white/70">
                      {hits.length > 0
                        ? `${hits.length} entrega(s)`
                        : "Sin entregas"}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/45">
                  {formatDate(selectedDate)}
                </p>

                <div className="mt-3 space-y-2">
                  {selectedDateMilestones.length === 0 ? (
                    <p className="text-sm text-brand-off-white/65">No hay hitos para esta fecha.</p>
                  ) : (
                    selectedDateMilestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{milestone.title}</p>
                          <Badge tone={statusBadgeTone(milestone.status)}>{milestone.status}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-brand-off-white/65">
                          {milestone.projectName} · {milestone.owner}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Hitos En Riesgo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskMilestones.length === 0 && (
              <p className="text-sm text-brand-off-white/70">Sin alertas críticas con los filtros actuales.</p>
            )}

            {riskMilestones.map((milestone) => {
              const remainingDays = daysUntil(milestone.dueDate);
              const risk = milestoneRiskLevel(milestone);

              return (
                <div
                  key={milestone.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{milestone.title}</p>
                      <p className="text-xs text-brand-off-white/65">{milestone.projectName}</p>
                    </div>
                    <Badge tone={risk === "high" ? "pending" : "progress"}>
                      {risk === "high" ? "Critico" : "Atencion"}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs text-brand-off-white/65">
                    Owner: {milestone.owner} · Fecha: {formatDate(milestone.dueDate)}
                  </p>

                  <p className="mt-2 text-xs text-brand-off-white/80">
                    {remainingDays < 0
                      ? `Vencido hace ${Math.abs(remainingDays)} dia(s)`
                      : `Vence en ${remainingDays} dia(s)`}
                  </p>

                  {milestone.externalUrl && milestone.externalUrl !== "#" && (
                    <a
                      href={milestone.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex text-xs font-semibold text-brand-gold hover:underline"
                    >
                      Abrir detalle del flujo
                    </a>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
