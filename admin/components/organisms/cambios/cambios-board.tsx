"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarRange, Coins, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";

import { reviewChangeRequestAction } from "@/app/cambios/actions";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/molecules/dialog";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import {
  costImpact,
  isChangeRequestActionable,
  isChangeRequestStatus,
  isChangeRequestType,
  scheduleImpactDays,
} from "@/lib/change-request-utils";
import type { ChangeRequest, ChangeRequestStatus, ChangeRequestType } from "@/lib/types";

interface CambiosBoardProps {
  initialItems: ChangeRequest[];
}

const REQUEST_TYPES: ChangeRequestType[] = [
  "Scope",
  "Technical",
  "Design",
  "Compliance",
];

const REQUEST_STATUSES: ChangeRequestStatus[] = [
  "Pending Review",
  "Approved",
  "Rejected",
  "In Progress",
  "Implemented",
];

function typeLabel(type: ChangeRequestType): string {
  if (type === "Scope") return "Alcance";
  if (type === "Technical") return "Técnico";
  if (type === "Design") return "Diseño";
  return "Cumplimiento";
}

function statusLabel(status: ChangeRequestStatus): string {
  if (status === "Pending Review") return "Pendiente de Revisión";
  if (status === "Approved") return "Aprobada";
  if (status === "Rejected") return "Rechazada";
  if (status === "In Progress") return "En Ejecución";
  return "Implementada";
}

function statusTone(status: ChangeRequestStatus): "pending" | "progress" | "success" | "neutral" {
  if (status === "Pending Review") return "pending";
  if (status === "In Progress") return "progress";
  if (status === "Approved" || status === "Implemented") return "success";
  return "neutral";
}

function typeTone(type: ChangeRequestType): "pending" | "progress" | "success" | "neutral" {
  if (type === "Compliance") return "pending";
  if (type === "Technical") return "progress";
  if (type === "Scope") return "neutral";
  return "success";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function impactClass(value: number): string {
  if (value > 0) return "text-rose-200";
  if (value < 0) return "text-emerald-200";
  return "text-brand-off-white/80";
}

export function CambiosBoard({ initialItems }: CambiosBoardProps) {
  const [items, setItems] = useState(initialItems);
  const [projectFilter, setProjectFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<ChangeRequest | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const projects = useMemo(() => {
    const values = new Set(items.map((item) => item.projectName));
    return ["Todos", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        const byProject = projectFilter === "Todos" || item.projectName === projectFilter;
        const byStatus =
          statusFilter === "Todos" ||
          (isChangeRequestStatus(statusFilter) && item.status === statusFilter);
        const byType =
          typeFilter === "Todos" ||
          (isChangeRequestType(typeFilter) && item.type === typeFilter);
        const query = search.toLowerCase().trim();
        const bySearch =
          !query ||
          `${item.projectName} ${item.clientName} ${item.title} ${item.owner}`
            .toLowerCase()
            .includes(query);

        return byProject && byStatus && byType && bySearch;
      })
      .sort((a, b) => {
        const impactA = costImpact(a) + Math.max(scheduleImpactDays(a), 0) * 100;
        const impactB = costImpact(b) + Math.max(scheduleImpactDays(b), 0) * 100;
        return impactB - impactA;
      });
  }, [items, projectFilter, search, statusFilter, typeFilter]);

  const metrics = useMemo(() => {
    const totalCostImpact = items.reduce((accumulator, item) => accumulator + costImpact(item), 0);
    const totalDelayDays = items.reduce(
      (accumulator, item) => accumulator + Math.max(scheduleImpactDays(item), 0),
      0,
    );

    return {
      total: items.length,
      pendingReview: items.filter((item) => item.status === "Pending Review").length,
      approved: items.filter((item) => item.status === "Approved").length,
      rejected: items.filter((item) => item.status === "Rejected").length,
      inDelivery: items.filter(
        (item) => item.status === "In Progress" || item.status === "Implemented",
      ).length,
      totalCostImpact,
      totalDelayDays,
    };
  }, [items]);

  const handleDecision = (
    request: ChangeRequest,
    decision: "approve" | "reject",
  ) => {
    setRunningId(request.id);

    startTransition(async () => {
      const result = await reviewChangeRequestAction({
        changeRequestId: request.id,
        projectId: request.projectId,
        decision,
      });

      if (!result.ok) {
        toast.error("Error de conexión", { description: result.message });
        setRunningId(null);
        return;
      }

      setItems((previous) =>
        previous.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status: decision === "approve" ? "Approved" : "Rejected",
              }
            : item,
        ),
      );

      toast.success(decision === "approve" ? "Cambio aprobado" : "Cambio rechazado", {
        description: result.message,
      });
      setRunningId(null);
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Solicitudes
              <GitCompareArrows className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Pendientes de Revisión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-100">{metrics.pendingReview}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-100">{metrics.approved}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Rechazadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-off-white">{metrics.rejected}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Impacto de Costo
              <Coins className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${impactClass(metrics.totalCostImpact)}`}>
              {metrics.totalCostImpact >= 0 ? "+" : ""}
              {formatCurrency(metrics.totalCostImpact)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Impacto en Fecha
              <CalendarRange className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${impactClass(metrics.totalDelayDays)}`}>
              {metrics.totalDelayDays >= 0 ? "+" : ""}
              {metrics.totalDelayDays} días
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-white">Control de Cambios</CardTitle>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar proyecto, cliente, owner o solicitud"
              className="xl:col-span-2"
            />

            <Select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
              {projects.map((option) => (
                <option key={option} value={option} className="bg-brand-charcoal text-white">
                  Proyecto: {option}
                </option>
              ))}
            </Select>

            <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="Todos" className="bg-brand-charcoal text-white">
                Tipo: Todos
              </option>
              {REQUEST_TYPES.map((option) => (
                <option key={option} value={option} className="bg-brand-charcoal text-white">
                  Tipo: {typeLabel(option)}
                </option>
              ))}
            </Select>

            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="Todos" className="bg-brand-charcoal text-white">
                Estado: Todos
              </option>
              {REQUEST_STATUSES.map((option) => (
                <option key={option} value={option} className="bg-brand-charcoal text-white">
                  Estado: {statusLabel(option)}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Proyecto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Cambio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Impacto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((item) => {
                  const deltaCost = costImpact(item);
                  const deltaDays = scheduleImpactDays(item);
                  const isRunning = runningId === item.id && isPending;
                  const isActionable = isChangeRequestActionable(item.status);

                  return (
                    <tr
                      key={item.id}
                      className="cursor-pointer hover:bg-white/5"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{item.projectName}</p>
                        <p className="text-xs text-brand-off-white/65">{item.clientName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-brand-off-white">{item.title}</p>
                        <p className="line-clamp-2 text-xs text-brand-off-white/65">{item.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={typeTone(item.type)}>{typeLabel(item.type)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className={impactClass(deltaCost)}>
                          Costo: {deltaCost >= 0 ? "+" : ""}
                          {formatCurrency(deltaCost)}
                        </p>
                        <p className={impactClass(deltaDays)}>
                          Fecha: {deltaDays >= 0 ? "+" : ""}
                          {deltaDays} días
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                            Ver
                          </Button>
                          {isActionable ? (
                            <>
                              <Button
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDecision(item, "approve");
                                }}
                                disabled={isRunning}
                              >
                                {isRunning ? "Procesando..." : "Aprobar"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDecision(item, "reject");
                                }}
                                disabled={isRunning}
                              >
                                Rechazar
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              Cerrada
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/70">
              No hay solicitudes de cambio para los filtros seleccionados.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de Solicitud de Cambio</DialogTitle>
                <DialogDescription>
                  Evalúa impacto en costo y fecha antes de aprobar o rechazar esta solicitud.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{selectedItem.title}</p>
                  <p className="mt-1 text-xs text-brand-off-white/70">
                    {selectedItem.projectName} · {selectedItem.clientName}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={typeTone(selectedItem.type)}>{typeLabel(selectedItem.type)}</Badge>
                    <Badge tone={statusTone(selectedItem.status)}>{statusLabel(selectedItem.status)}</Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Impacto de Costo</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">
                      Base: {formatCurrency(selectedItem.baselineCost)}
                    </p>
                    <p className="text-sm text-brand-off-white/90">
                      Propuesta: {formatCurrency(selectedItem.proposedCost)}
                    </p>
                    <p className={`mt-2 text-sm font-semibold ${impactClass(costImpact(selectedItem))}`}>
                      Delta: {costImpact(selectedItem) >= 0 ? "+" : ""}
                      {formatCurrency(costImpact(selectedItem))}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Impacto de Fecha</p>
                    <p className="mt-1 text-sm text-brand-off-white/90">
                      Fecha base: {formatDate(selectedItem.baselineDueDate)}
                    </p>
                    <p className="text-sm text-brand-off-white/90">
                      Fecha propuesta: {formatDate(selectedItem.proposedDueDate)}
                    </p>
                    <p className={`mt-2 text-sm font-semibold ${impactClass(scheduleImpactDays(selectedItem))}`}>
                      Delta: {scheduleImpactDays(selectedItem) >= 0 ? "+" : ""}
                      {scheduleImpactDays(selectedItem)} días
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Descripción</p>
                  <p className="mt-1 text-sm text-brand-off-white/90">{selectedItem.description}</p>
                  {selectedItem.justification && (
                    <>
                      <p className="mt-3 text-xs uppercase tracking-wide text-brand-off-white/50">Justificación</p>
                      <p className="mt-1 text-sm text-brand-off-white/90">{selectedItem.justification}</p>
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/85">
                  <p>
                    Responsable: <span className="font-semibold text-white">{selectedItem.owner}</span>
                  </p>
                  <p>Solicitado: {formatDate(selectedItem.requestedAt)}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
