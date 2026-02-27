"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CircleDollarSign,
  HandCoins,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  budgetVariance,
  executionPct,
  isFinanceBillingStatus,
  isFinanceClientType,
  isOverBudget,
} from "@/lib/finance-utils";
import type {
  FinanceBillingStatus,
  FinanceClientType,
  OperationalFinanceClientSummary,
  OperationalFinanceEntry,
  OperationalFinanceMetrics,
} from "@/lib/types";

interface FinanzasBoardProps {
  entries: OperationalFinanceEntry[];
  metrics: OperationalFinanceMetrics;
  summaries: OperationalFinanceClientSummary[];
}

const CLIENT_TYPES: FinanceClientType[] = [
  "Public Sector",
  "Retail / E-commerce",
  "Luxury",
  "Media Production",
  "Technology",
];

const BILLING_STATUSES: FinanceBillingStatus[] = [
  "Pending Billing",
  "Partially Invoiced",
  "Fully Invoiced",
];

function clientTypeLabel(type: FinanceClientType): string {
  if (type === "Public Sector") return "Sector Público";
  if (type === "Retail / E-commerce") return "Retail / E-commerce";
  if (type === "Luxury") return "Lujo";
  if (type === "Media Production") return "Producción de Medios";
  return "Tecnología";
}

function billingStatusLabel(status: FinanceBillingStatus): string {
  if (status === "Pending Billing") return "Pendiente de Facturar";
  if (status === "Partially Invoiced") return "Parcialmente Facturado";
  return "Facturado";
}

function billingStatusTone(status: FinanceBillingStatus): "pending" | "progress" | "success" {
  if (status === "Pending Billing") return "pending";
  if (status === "Partially Invoiced") return "progress";
  return "success";
}

function formatCurrency(value: number, currency: OperationalFinanceEntry["currency"] = "USD"): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function varianceClass(value: number): string {
  if (value < 0) return "text-rose-200";
  if (value > 0) return "text-emerald-200";
  return "text-brand-off-white/80";
}

export function FinanzasBoard({ entries, metrics, summaries }: FinanzasBoardProps) {
  const [clientTypeFilter, setClientTypeFilter] = useState("Todos");
  const [billingFilter, setBillingFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<OperationalFinanceEntry | null>(null);

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        const byClientType =
          clientTypeFilter === "Todos" ||
          (isFinanceClientType(clientTypeFilter) && entry.clientType === clientTypeFilter);
        const byBilling =
          billingFilter === "Todos" ||
          (isFinanceBillingStatus(billingFilter) && entry.billingStatus === billingFilter);
        const query = search.toLowerCase().trim();
        const bySearch =
          !query ||
          `${entry.projectName} ${entry.clientName} ${entry.projectId} ${entry.owner} ${entry.industry}`
            .toLowerCase()
            .includes(query);

        return byClientType && byBilling && bySearch;
      })
      .sort((a, b) => {
        if (Number(isOverBudget(b)) !== Number(isOverBudget(a))) {
          return Number(isOverBudget(b)) - Number(isOverBudget(a));
        }

        if (b.pendingBillingAmount !== a.pendingBillingAmount) {
          return b.pendingBillingAmount - a.pendingBillingAmount;
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [billingFilter, clientTypeFilter, entries, search]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Proyectos
              <Wallet className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.projects}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Presupuesto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{formatCurrency(metrics.totalBudget)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-off-white/75">Ejecutado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-100">{formatCurrency(metrics.totalExecuted)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Pendiente de Facturar
              <ReceiptText className="h-4 w-4 text-orange-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-200">{formatCurrency(metrics.totalPendingBilling)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Facturado
              <HandCoins className="h-4 w-4 text-emerald-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-100">{formatCurrency(metrics.totalInvoiced)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Ejecución Promedio
              <Calculator className="h-4 w-4 text-brand-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{metrics.avgExecutionPct}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm text-brand-off-white/75">
              Sobrepresupuesto
              <AlertTriangle className="h-4 w-4 text-rose-300" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-200">{metrics.overBudget}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr,2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Distribución por Tipo de Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaries.map((summary) => {
              const execution = summary.totalBudget
                ? Math.round((summary.totalExecuted / summary.totalBudget) * 100)
                : 0;

              return (
                <div key={summary.clientType} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{clientTypeLabel(summary.clientType)}</p>
                    <Badge tone={execution > 100 ? "pending" : execution >= 80 ? "progress" : "success"}>
                      {execution}% ejecución
                    </Badge>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-brand-off-white/75">
                    <p>Proyectos: {summary.projects}</p>
                    <p>Pendiente facturar: {formatCurrency(summary.totalPendingBilling)}</p>
                    <p>Presupuesto: {formatCurrency(summary.totalBudget)}</p>
                    <p>Ejecutado: {formatCurrency(summary.totalExecuted)}</p>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gold-gradient" style={{ width: `${Math.min(execution, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-white">Finanzas Operativas por Proyecto</CardTitle>

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar proyecto, cliente, owner o industria"
                className="md:col-span-2"
              />

              <Select value={clientTypeFilter} onChange={(event) => setClientTypeFilter(event.target.value)}>
                <option value="Todos" className="bg-brand-charcoal text-white">
                  Tipo de Cliente: Todos
                </option>
                {CLIENT_TYPES.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Tipo de Cliente: {clientTypeLabel(option)}
                  </option>
                ))}
              </Select>

              <Select value={billingFilter} onChange={(event) => setBillingFilter(event.target.value)}>
                <option value="Todos" className="bg-brand-charcoal text-white">
                  Facturación: Todos
                </option>
                {BILLING_STATUSES.map((option) => (
                  <option key={option} value={option} className="bg-brand-charcoal text-white">
                    Facturación: {billingStatusLabel(option)}
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Presupuesto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Ejecutado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Pendiente Facturar</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Actualización</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-brand-off-white/80">Acción</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {filtered.map((entry) => {
                    const variance = budgetVariance(entry);

                    return (
                      <tr
                        key={entry.id}
                        className="cursor-pointer hover:bg-white/5"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{entry.projectName}</p>
                          <p className="text-xs text-brand-off-white/65">{entry.projectId} · {entry.owner}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-brand-off-white/90">{entry.clientName}</p>
                          <p className="text-xs text-brand-off-white/65">{clientTypeLabel(entry.clientType)}</p>
                        </td>
                        <td className="px-4 py-3 text-brand-off-white/90">{formatCurrency(entry.budgetAmount, entry.currency)}</td>
                        <td className="px-4 py-3">
                          <p className="text-brand-off-white/90">{formatCurrency(entry.executedAmount, entry.currency)}</p>
                          <p className={`text-xs ${varianceClass(variance)}`}>
                            Saldo: {variance >= 0 ? "+" : ""}{formatCurrency(variance, entry.currency)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-brand-off-white/90">
                          {formatCurrency(entry.pendingBillingAmount, entry.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            <Badge tone={billingStatusTone(entry.billingStatus)}>
                              {billingStatusLabel(entry.billingStatus)}
                            </Badge>
                            <Badge tone={executionPct(entry) > 100 ? "pending" : executionPct(entry) >= 80 ? "progress" : "success"}>
                              {executionPct(entry)}% ejecución
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-brand-off-white/80">{formatDate(entry.updatedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelectedEntry(entry)}>
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/70">
                No hay registros financieros para los filtros seleccionados.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={Boolean(selectedEntry)} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent>
          {selectedEntry && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle Financiero del Proyecto</DialogTitle>
                <DialogDescription>
                  Revisa el estado de presupuesto, ejecución y facturación antes de cerrar avances con cliente.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{selectedEntry.projectName}</p>
                  <p className="mt-1 text-xs text-brand-off-white/70">
                    {selectedEntry.projectId} · {selectedEntry.clientName} · {selectedEntry.owner}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone={billingStatusTone(selectedEntry.billingStatus)}>
                      {billingStatusLabel(selectedEntry.billingStatus)}
                    </Badge>
                    <Badge tone={executionPct(selectedEntry) > 100 ? "pending" : executionPct(selectedEntry) >= 80 ? "progress" : "success"}>
                      {executionPct(selectedEntry)}% ejecución
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Presupuesto</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {formatCurrency(selectedEntry.budgetAmount, selectedEntry.currency)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Ejecutado</p>
                    <p className="mt-1 text-xl font-semibold text-amber-100">
                      {formatCurrency(selectedEntry.executedAmount, selectedEntry.currency)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Pendiente de Facturar</p>
                    <p className="mt-1 text-xl font-semibold text-orange-200">
                      {formatCurrency(selectedEntry.pendingBillingAmount, selectedEntry.currency)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-brand-off-white/50">Facturado</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-100">
                      {formatCurrency(selectedEntry.invoicedAmount, selectedEntry.currency)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-brand-off-white/85">
                  <p>
                    <span className="font-semibold text-white">Presupuesto</span>: monto total aprobado para el proyecto.
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-white">Ejecutado</span>: gasto real acumulado según avance operativo.
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-white">Pendiente de facturar</span>: valor listo para facturación
                    que aún no se ha emitido.
                  </p>
                  <p className="mt-3 text-xs text-brand-off-white/70">Última actualización: {formatDate(selectedEntry.updatedAt)}</p>
                </div>

                {selectedEntry.externalUrl && (
                  <div className="text-right">
                    <a
                      href={selectedEntry.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-gold hover:underline"
                    >
                      <CircleDollarSign className="h-4 w-4" />
                      Abrir detalle financiero
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
