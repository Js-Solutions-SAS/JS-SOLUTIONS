"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDownUp,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSignature,
  Mail,
  UserCircle,
} from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";

import {
  generateContractAction,
  generateQuoteAction,
  requestTechnicalBriefAction,
} from "@/app/cotizaciones/actions";
import { QuoteIntakeForm } from "@/components/cotizaciones/quote-intake-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { parseAmount, statusTone } from "@/lib/quote-utils";
import type { Quote, QuotesFeedSource } from "@/lib/types";

interface QuotesTableProps {
  initialQuotes: Quote[];
  source: QuotesFeedSource;
  sourceMessage: string;
  createEnabled: boolean;
}

const PAGE_SIZE = 8;
const columnHelper = createColumnHelper<Quote>();

function sourceTone(source: QuotesFeedSource) {
  if (source === "live") return "success";
  if (source === "error") return "pending";
  return "neutral";
}

function sourceLabel(source: QuotesFeedSource) {
  if (source === "live") return "Fuente n8n activa";
  if (source === "error") return "Error de sincronizacion";
  return "Sin conexion n8n";
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function buildBriefSummary(quote: Quote): Array<{ label: string; value: string }> {
  const brief = quote.technicalBrief;

  if (!brief) {
    return [];
  }

  const objectives = normalizeList(brief.objectives);
  const integrations = normalizeList(brief.integrations);

  return [
    {
      label: "Objetivos",
      value: objectives.length > 0 ? objectives.join(", ") : "No definidos",
    },
    {
      label: "Urgencia",
      value: String(brief.urgency ?? "No definida"),
    },
    {
      label: "Stack actual",
      value: String(brief.currentStack ?? "No especificado"),
    },
    {
      label: "Activos de diseño",
      value: String(brief.designAssets ?? "No especificados"),
    },
    {
      label: "Integraciones",
      value: integrations.length > 0 ? integrations.join(", ") : "No definidas",
    },
    {
      label: "Notas adicionales",
      value: String(brief.additionalNotes ?? "Sin observaciones"),
    },
  ];
}

function getStatusLabel(quote: Quote): string {
  if (quote.contractUrl || quote.estado === "Contrato Enviado") {
    return "Contrato Enviado";
  }

  if (quote.estado === "Firmado") {
    return "Firmado";
  }

  if (quote.quoteStatus === "En revisión") {
    return "Cotización En Revisión";
  }

  return quote.estado;
}

export function QuotesTable({
  initialQuotes,
  source,
  sourceMessage,
  createEnabled,
}: QuotesTableProps) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("Todas");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runningBriefId, setRunningBriefId] = useState<string | null>(null);
  const [runningQuoteId, setRunningQuoteId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [quoteFeedback, setQuoteFeedback] = useState("");
  const [isActionPending, startActionTransition] = useTransition();

  const industries = useMemo(() => {
    const unique = new Set(quotes.map((quote) => quote.industria || "General"));
    return ["Todas", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [quotes]);

  const selectedQuote = useMemo(
    () => quotes.find((quote) => quote.id === selectedQuoteId) ?? null,
    [quotes, selectedQuoteId],
  );

  const withEmailCount = quotes.filter((quote) => Boolean(quote.email)).length;
  const withoutEmailCount = quotes.length - withEmailCount;
  const withBriefCount = quotes.filter((quote) => Boolean(quote.briefCompletedAt)).length;
  const withQuoteCount = quotes.filter((quote) => Boolean(quote.quotePdfUrl)).length;

  const handleCopyValue = async (
    value: string | undefined,
    successTitle: string,
    fallbackTitle: string,
  ) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(successTitle, {
        description: "El enlace quedó copiado en el portapapeles.",
      });
    } catch {
      toast.error(fallbackTitle, {
        description: value,
      });
    }
  };

  const handleOpenBrief = (quote: Quote) => {
    setSelectedQuoteId(quote.id);
    setQuoteFeedback(quote.quoteLastFeedback || "");
  };

  const handleGenerateContract = (quote: Quote) => {
    setRunningId(quote.id);

    startActionTransition(async () => {
      const result = await generateContractAction({
        leadId: quote.id,
        email: quote.email,
        estado: quote.estado,
      });

      if (result.ok) {
        setQuotes((prev) =>
          prev.map((row) =>
            row.id === quote.id
              ? {
                  ...row,
                  estado: "Contrato Enviado",
                  contractUrl: result.contractUrl || row.contractUrl,
                  contractGeneratedAt: new Date().toISOString(),
                }
              : row,
          ),
        );
        toast.success("Contrato generado", {
          description: result.message,
        });
      } else {
        toast.error("Error de conexion", {
          description: result.message,
        });
      }

      setRunningId(null);
    });
  };

  const handleRequestBrief = (quote: Quote) => {
    setRunningBriefId(quote.id);

    startActionTransition(async () => {
      const result = await requestTechnicalBriefAction({
        leadId: quote.id,
        email: quote.email,
      });

      if (result.ok) {
        setQuotes((prev) =>
          prev.map((row) =>
            row.id === quote.id
              ? {
                  ...row,
                  estado: "Brief Enviado",
                  briefUrl: result.briefUrl || row.briefUrl,
                  briefToken: result.token || row.briefToken,
                  clientDashboardUrl:
                    result.clientDashboardUrl || row.clientDashboardUrl,
                }
              : row,
          ),
        );
        toast.success("Brief solicitado", {
          description: result.message,
        });
      } else {
        toast.error("Error de conexion", {
          description: result.message,
        });
      }

      setRunningBriefId(null);
    });
  };

  const handleGenerateQuote = (quote: Quote) => {
    setRunningQuoteId(quote.id);

    startActionTransition(async () => {
      const result = await generateQuoteAction({
        leadId: quote.id,
        nombre: quote.nombre,
        empresa: quote.empresa,
        email: quote.email,
        servicio: quote.servicio,
        briefToken: quote.briefToken,
        technicalBrief: quote.technicalBrief,
        feedback: quoteFeedback,
      });

      if (result.ok) {
        setQuotes((prev) =>
          prev.map((row) =>
            row.id === quote.id
              ? {
                  ...row,
                  estado: "Cotización En Revisión",
                  quoteStatus: "En revisión",
                  quotePdfUrl: result.quotePdfUrl || row.quotePdfUrl,
                  quoteDocumentId:
                    result.quoteDocumentId || row.quoteDocumentId,
                  quoteGeneratedAt: new Date().toISOString(),
                  quoteLastFeedback: quoteFeedback || row.quoteLastFeedback,
                  clientDashboardUrl:
                    result.dashboardUrl || row.clientDashboardUrl,
                }
              : row,
          ),
        );
        if (selectedQuoteId === quote.id) {
          setSelectedQuoteId(null);
          setQuoteFeedback("");
        }
        toast.success("Cotización generada", {
          description: result.message,
        });
      } else {
        toast.error("No se pudo generar", {
          description: result.message,
        });
      }

      setRunningQuoteId(null);
    });
  };

  const columns = [
      columnHelper.accessor("nombre", {
        header: "Lead",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium text-white">
            <UserCircle className="h-4 w-4 text-brand-off-white/55" />
            {row.original.nombre}
          </div>
        ),
      }),
      columnHelper.accessor("empresa", {
        header: "Empresa",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-off-white/55" />
            {row.original.empresa}
          </div>
        ),
      }),
      columnHelper.display({
        id: "contacto",
        header: "Contacto",
        cell: ({ row }) =>
          row.original.email ? (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-off-white/55" />
              <span>{row.original.email}</span>
            </div>
          ) : (
            <Badge tone="pending">Sin email</Badge>
          ),
      }),
      columnHelper.display({
        id: "brief",
        header: "Brief",
        cell: ({ row }) => {
          const quote = row.original;
          const hasBriefDetails = Boolean(
            quote.technicalBrief || quote.technicalBriefRaw,
          );

          return (
            <div className="flex flex-wrap items-center gap-2">
              {quote.briefUrl ? (
                <>
                  <a
                    href={quote.briefUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:brightness-110"
                  >
                    Abrir
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopyValue(
                        quote.briefUrl,
                        "Enlace del brief copiado",
                        "No se pudo copiar",
                      )
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>
                </>
              ) : (
                <Badge tone="pending">Sin enlace</Badge>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenBrief(quote)}
                disabled={!hasBriefDetails}
              >
                {hasBriefDetails ? "Ver brief" : "Sin brief"}
              </Button>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "cotizacion",
        header: "Cotización",
        cell: ({ row }) =>
          row.original.quotePdfUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={row.original.quotePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:brightness-110"
              >
                Abrir PDF
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Badge
                tone={
                  row.original.quoteStatus === "Aprobado" ? "success" : "pending"
                }
              >
                {row.original.quoteStatus || "Sin cotización"}
              </Badge>
            </div>
          ) : (
            <Badge tone="pending">Sin cotización</Badge>
          ),
      }),
      columnHelper.display({
        id: "portal",
        header: "Portal",
        cell: ({ row }) =>
          row.original.clientDashboardUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={row.original.clientDashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:brightness-110"
              >
                Dashboard
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopyValue(
                    row.original.clientDashboardUrl,
                    "Enlace del dashboard copiado",
                    "No se pudo copiar",
                  )
                }
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </Button>
            </div>
          ) : (
            <Badge tone="neutral">Sin dashboard</Badge>
          ),
      }),
      columnHelper.accessor("industria", {
        header: "Industria",
        cell: ({ row }) => (
          <Badge tone="neutral">{row.original.industria || "General"}</Badge>
        ),
      }),
      columnHelper.accessor("servicio", {
        header: "Servicio",
      }),
      columnHelper.accessor("monto", {
        header: "Monto",
        sortingFn: (rowA, rowB, columnId) => {
          const amountA = parseAmount(String(rowA.getValue(columnId)));
          const amountB = parseAmount(String(rowB.getValue(columnId)));
          return amountA - amountB;
        },
        cell: ({ row }) => (
          <span className="font-semibold text-white">{row.original.monto}</span>
        ),
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        cell: ({ row }) => (
          <Badge tone={statusTone(getStatusLabel(row.original))}>
            {getStatusLabel(row.original)}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Accion</div>,
        cell: ({ row }) => {
          const quote = row.original;
          const isRunningContract = runningId === quote.id && isActionPending;
          const isRunningBrief = runningBriefId === quote.id && isActionPending;
          const isRunningQuote = runningQuoteId === quote.id && isActionPending;
          const canRequestBrief = Boolean(quote.email);
          const hasBriefDetails = Boolean(quote.technicalBrief);
          const isSigned = quote.estado === "Firmado";
          const isContractSent =
            quote.estado === "Contrato Enviado" || Boolean(quote.contractUrl);

          return (
            <div className="flex flex-wrap justify-end gap-2">
              {!quote.briefCompletedAt ? (
                <Button
                  onClick={() => handleRequestBrief(quote)}
                  disabled={
                    !canRequestBrief ||
                    isRunningBrief ||
                    isRunningContract ||
                    isRunningQuote ||
                    quote.estado === "Brief Enviado"
                  }
                  variant="outline"
                  size="sm"
                  className="bg-brand-charcoal hover:bg-white/10"
                >
                  {!canRequestBrief
                    ? "Falta email"
                    : isRunningBrief
                      ? "Enviando..."
                      : quote.estado === "Brief Enviado"
                        ? "Brief Pendiente"
                        : "Solicitar Brief"}
                </Button>
              ) : null}

              {hasBriefDetails ? (
                <Button
                  onClick={() => handleOpenBrief(quote)}
                  disabled={isRunningQuote || isRunningBrief || isRunningContract}
                  variant="outline"
                  size="sm"
                >
                  {quote.quotePdfUrl ? "Regenerar Cotización" : "Generar Cotización"}
                </Button>
              ) : null}

              <Button
                onClick={() => handleGenerateContract(quote)}
                disabled={
                  !isSigned || isContractSent || isRunningContract || isRunningBrief
                }
                variant={isContractSent ? "outline" : "default"}
                size="sm"
              >
                {isContractSent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Contrato enviado
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4" />
                    {isRunningContract ? "Procesando..." : "Generar Contrato"}
                  </>
                )}
              </Button>
            </div>
          );
        },
      }),
    ];

  const table = useReactTable({
    data: quotes,
    columns,
    state: {
      sorting,
      globalFilter: search,
      columnFilters:
        industry === "Todas" ? [] : [{ id: "industria", value: industry }],
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _columnId, value) => {
      const query = String(value).toLowerCase().trim();
      if (!query) return true;
      const blob =
        `${row.original.nombre} ${row.original.empresa} ${row.original.servicio} ${row.original.email || ""}`.toLowerCase();
      return blob.includes(query);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: PAGE_SIZE,
      },
    },
  });

  const briefSummary = selectedQuote ? buildBriefSummary(selectedQuote) : [];

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Estado de sincronizacion
                  </h2>
                  <p className="mt-1 text-sm text-brand-off-white/70">
                    {sourceMessage}
                  </p>
                </div>
                <Badge tone={sourceTone(source)}>{sourceLabel(source)}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Total visibles
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {quotes.length}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Con email
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {withEmailCount}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Brief completo
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {withBriefCount}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Sin email
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {withoutEmailCount}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Cotización lista
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {withQuoteCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <QuoteIntakeForm enabled={createEnabled} />
        </div>

        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 lg:flex">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar lead, empresa, servicio o email"
                  className="w-full lg:w-80"
                />

                <Select
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  className="w-full sm:w-56"
                >
                  {industries.map((option) => (
                    <option
                      key={option}
                      value={option}
                      className="bg-brand-charcoal text-white"
                    >
                      {option}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-off-white/60">
                <ArrowDownUp className="h-4 w-4 text-brand-off-white/70" />
                Haz click en los encabezados para ordenar
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const sortable = header.column.getCanSort();

                          return (
                            <th
                              key={header.id}
                              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-off-white/80"
                            >
                              {header.isPlaceholder ? null : sortable ? (
                                <button
                                  onClick={header.column.getToggleSortingHandler()}
                                  className="inline-flex items-center gap-1 hover:text-brand-gold"
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                  <ArrowUpDown className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={table.getAllLeafColumns().length}
                          className="px-4 py-10 text-center text-sm text-brand-off-white/65"
                        >
                          {sourceMessage}
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5">
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="px-4 py-3 text-brand-off-white/85"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-3 text-sm text-brand-off-white/75 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Mostrando {table.getRowModel().rows.length} de{" "}
                {table.getFilteredRowModel().rows.length} registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Anterior
                </Button>
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/60">
                  Pagina {table.getState().pagination.pageIndex + 1} /{" "}
                  {table.getPageCount() || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(selectedQuote)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuoteId(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Brief técnico del lead</DialogTitle>
            <DialogDescription>
              {selectedQuote
                ? `${selectedQuote.nombre} · ${selectedQuote.empresa}`
                : "Resumen operativo del brief y acciones de cotización."}
            </DialogDescription>
          </DialogHeader>

          {selectedQuote ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Email
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {selectedQuote.email || "Sin email"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Token
                  </p>
                  <p className="mt-2 break-all text-sm text-white">
                    {selectedQuote.briefToken || "Sin token"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Estado
                  </p>
                  <div className="mt-2">
                    <Badge tone={statusTone(getStatusLabel(selectedQuote))}>
                      {getStatusLabel(selectedQuote)}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Dashboard
                  </p>
                  {selectedQuote.clientDashboardUrl ? (
                    <a
                      href={selectedQuote.clientDashboardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-gold"
                    >
                      Abrir
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-brand-off-white/70">
                      Sin dashboard
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
                <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-sm font-semibold text-white">
                    Resumen del brief
                  </h3>

                  {briefSummary.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {briefSummary.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-off-white/55">
                            {item.label}
                          </p>
                          <p className="mt-2 text-sm text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-brand-off-white/70">
                      No hay un resumen estructurado disponible.
                    </p>
                  )}

                  {selectedQuote.technicalBriefRaw ? (
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                        JSON recibido
                      </p>
                      <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-brand-off-white/80">
                        {selectedQuote.technicalBriefRaw}
                      </pre>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-sm font-semibold text-white">
                    Cotización comercial
                  </h3>
                  <p className="text-sm text-brand-off-white/70">
                    Puedes generar o regenerar la cotización con base en el brief
                    y dejar observaciones para el workflow.
                  </p>

                  <label className="space-y-2 text-sm text-brand-off-white/80">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                      Observaciones para regenerar
                    </span>
                    <textarea
                      value={quoteFeedback}
                      onChange={(event) => setQuoteFeedback(event.target.value)}
                      rows={7}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-gold/60 focus:ring-2 focus:ring-brand-gold/15"
                      placeholder="Agrega feedback opcional para que el workflow refine la cotización."
                    />
                  </label>

                  {selectedQuote.quotePdfUrl ? (
                    <a
                      href={selectedQuote.quotePdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-gold"
                    >
                      Abrir cotización actual
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="text-sm text-brand-off-white/70">
                      Aún no se ha generado una cotización.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedQuoteId(null)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={() => selectedQuote && handleGenerateQuote(selectedQuote)}
              disabled={
                !selectedQuote?.technicalBrief ||
                !selectedQuote?.briefToken ||
                (runningQuoteId === selectedQuote.id && isActionPending)
              }
            >
              {selectedQuote && runningQuoteId === selectedQuote.id && isActionPending
                ? "Generando..."
                : "Generar Cotización"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
