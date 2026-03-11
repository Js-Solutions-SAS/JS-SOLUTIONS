"use client";

import { useEffect, useMemo } from "react";
import {
  Building2,
  Copy,
  ExternalLink,
  Mail,
  UserCircle,
} from "lucide-react";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type Updater,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";

import {
  generateContractAction,
  generateQuoteAction,
  previewQuoteAction,
  requestTechnicalBriefAction,
} from "@/app/cotizaciones/actions";
import { BriefDialog } from "@/components/organisms/cotizaciones/brief-dialog";
import { QuoteActionsCell } from "@/components/organisms/cotizaciones/quote-actions-cell";
import { QuotesFilters } from "@/components/organisms/cotizaciones/quotes-filters";
import { QuotesGrid } from "@/components/organisms/cotizaciones/quotes-grid";
import { QuotesMetricsCards } from "@/components/organisms/cotizaciones/quotes-metrics-cards";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent } from "@/components/molecules/card";
import { parseAmount, statusTone } from "@/lib/quote-utils";
import type { Quote, QuotesFeedSource } from "@/lib/types";
import { useCotizacionesStore, type QuoteOperation } from "@/stores/cotizaciones-store";

import { buildBriefSummary, getStatusLabel } from "./quotes-table-helpers";

interface QuotesTableProps {
  initialQuotes: Quote[];
  source: QuotesFeedSource;
  sourceMessage: string;
  createEnabled: boolean;
}

const PAGE_SIZE = 8;
const columnHelper = createColumnHelper<Quote>();

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isOperationLoading(
  opsByQuoteId: ReturnType<typeof useCotizacionesStore.getState>["opsByQuoteId"],
  quoteId: string,
  operation: QuoteOperation,
) {
  return Boolean(opsByQuoteId[quoteId]?.[operation]?.loading);
}

export function QuotesTable({
  initialQuotes,
  source,
  sourceMessage,
  createEnabled,
}: QuotesTableProps) {
  const quotes = useCotizacionesStore((state) => state.quotes);
  const search = useCotizacionesStore((state) => state.search);
  const industry = useCotizacionesStore((state) => state.industry);
  const sorting = useCotizacionesStore((state) => state.sorting);
  const selectedQuoteId = useCotizacionesStore((state) => state.selectedQuoteId);
  const feedbackByQuoteId = useCotizacionesStore((state) => state.feedbackByQuoteId);
  const opsByQuoteId = useCotizacionesStore((state) => state.opsByQuoteId);
  const initializeFromQuotes = useCotizacionesStore((state) => state.initializeFromQuotes);
  const setSearch = useCotizacionesStore((state) => state.setSearch);
  const setIndustry = useCotizacionesStore((state) => state.setIndustry);
  const setSorting = useCotizacionesStore((state) => state.setSorting);
  const setSelectedQuoteId = useCotizacionesStore((state) => state.setSelectedQuoteId);
  const setQuoteFeedback = useCotizacionesStore((state) => state.setQuoteFeedback);
  const patchQuote = useCotizacionesStore((state) => state.patchQuote);
  const setOperationStatus = useCotizacionesStore((state) => state.setOperationStatus);

  useEffect(() => {
    initializeFromQuotes(initialQuotes);
  }, [initializeFromQuotes, initialQuotes]);

  const industries = useMemo(() => {
    const unique = new Set(quotes.map((quote) => quote.industria || "General"));
    return ["Todas", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [quotes]);

  const selectedQuote = useMemo(
    () => quotes.find((quote) => quote.id === selectedQuoteId) ?? null,
    [quotes, selectedQuoteId],
  );

  const quoteFeedback = selectedQuoteId ? feedbackByQuoteId[selectedQuoteId] || "" : "";

  const briefSummary = useMemo(
    () => (selectedQuote ? buildBriefSummary(selectedQuote) : []),
    [selectedQuote],
  );

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

    const currentFeedback = useCotizacionesStore.getState().feedbackByQuoteId[quote.id];
    if (!currentFeedback && quote.quoteLastFeedback) {
      setQuoteFeedback(quote.id, quote.quoteLastFeedback);
    }
  };

  const executeOperation = async (
    quoteId: string,
    operation: QuoteOperation,
    callback: () => Promise<void>,
  ) => {
    if (isOperationLoading(useCotizacionesStore.getState().opsByQuoteId, quoteId, operation)) {
      return;
    }

    setOperationStatus(quoteId, operation, { loading: true });

    try {
      await callback();
      setOperationStatus(quoteId, operation, { loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado";
      setOperationStatus(quoteId, operation, { loading: false, error: message });
      toast.error("Error de ejecución", {
        description: message,
      });
    }
  };

  const handleGenerateContract = async (quote: Quote) => {
    await executeOperation(quote.id, "generateContract", async () => {
      const result = await generateContractAction({
        leadId: quote.id,
        email: quote.email,
        estado: quote.estado,
      });

      if (result.ok) {
        patchQuote(quote.id, {
          estado: "Contrato Enviado",
          contractUrl: result.contractUrl || quote.contractUrl,
          contractGeneratedAt: new Date().toISOString(),
        });
        toast.success("Contrato generado", {
          description: result.message,
        });
        return;
      }

      toast.error("Error de conexion", {
        description: result.message,
      });
    });
  };

  const handleRequestBrief = async (quote: Quote) => {
    await executeOperation(quote.id, "requestBrief", async () => {
      const shouldForceResend = quote.estado === "Brief Enviado" || Boolean(quote.briefUrl);
      const result = await requestTechnicalBriefAction({
        leadId: quote.id,
        email: quote.email,
        forceResend: shouldForceResend,
        requestId: createRequestId(),
      });

      if (result.ok) {
        patchQuote(quote.id, {
          estado: "Brief Enviado",
          briefUrl: result.briefUrl || quote.briefUrl,
          briefToken: result.token || quote.briefToken,
          clientDashboardUrl: result.clientDashboardUrl || quote.clientDashboardUrl,
        });

        if (result.deliveryStatus === "skipped_idempotent") {
          toast.info("Solicitud ya procesada", {
            description: result.message,
          });
        } else {
          toast.success(shouldForceResend ? "Brief reenviado" : "Brief solicitado", {
            description: result.message,
          });
        }

        return;
      }

      toast.error("Error de conexion", {
        description: result.message,
      });
    });
  };

  const handleGenerateQuote = async (quote: Quote) => {
    await executeOperation(quote.id, "generateQuote", async () => {
      const feedback = useCotizacionesStore.getState().feedbackByQuoteId[quote.id] || "";
      const result = await generateQuoteAction({
        leadId: quote.id,
        nombre: quote.nombre,
        empresa: quote.empresa,
        email: quote.email,
        servicio: quote.servicio,
        briefToken: quote.briefToken,
        technicalBrief: quote.technicalBrief,
        feedback,
      });

      if (result.ok) {
        patchQuote(quote.id, {
          estado: "Cotización En Revisión",
          quoteStatus: "En revisión",
          quotePdfUrl: result.quotePdfUrl || quote.quotePdfUrl,
          quoteDocumentId: result.quoteDocumentId || quote.quoteDocumentId,
          quoteGeneratedAt: new Date().toISOString(),
          quoteLastFeedback: feedback || quote.quoteLastFeedback,
          clientDashboardUrl: result.dashboardUrl || quote.clientDashboardUrl,
        });

        if (selectedQuoteId === quote.id) {
          setSelectedQuoteId(null);
        }

        toast.success("Cotización generada", {
          description: result.message,
        });
        return;
      }

      toast.error("No se pudo generar", {
        description: result.message,
      });
    });
  };

  const handlePreviewQuote = async (quote: Quote) => {
    await executeOperation(quote.id, "previewQuote", async () => {
      const feedback = useCotizacionesStore.getState().feedbackByQuoteId[quote.id] || "";
      const result = await previewQuoteAction({
        leadId: quote.id,
        nombre: quote.nombre,
        empresa: quote.empresa,
        email: quote.email,
        servicio: quote.servicio,
        briefToken: quote.briefToken,
        technicalBrief: quote.technicalBrief,
        feedback,
      });

      if (result.ok) {
        const previewUrl = result.quotePdfUrl;

        if (previewUrl) {
          window.open(previewUrl, "_blank", "noopener,noreferrer");
          toast.success("Preview generado", {
            description: result.message,
          });
        } else {
          toast.success("Preview generado", {
            description: "n8n respondió sin URL de preview.",
          });
        }

        return;
      }

      toast.error("No se pudo previsualizar", {
        description: result.message,
      });
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
          const hasBriefDetails = Boolean(quote.technicalBrief || quote.technicalBriefRaw);

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
                      void handleCopyValue(
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
              <Badge tone={row.original.quoteStatus === "Aprobado" ? "success" : "pending"}>
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
                  void handleCopyValue(
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
        cell: ({ row }) => <Badge tone="neutral">{row.original.industria || "General"}</Badge>,
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
        cell: ({ row }) => <span className="font-semibold text-white">{row.original.monto}</span>,
      }),
      columnHelper.accessor("estado", {
        header: "Estado",
        cell: ({ row }) => (
          <Badge tone={statusTone(getStatusLabel(row.original))}>{getStatusLabel(row.original)}</Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Accion</div>,
        cell: ({ row }) => {
          const quote = row.original;
          const isRunningBrief = isOperationLoading(opsByQuoteId, quote.id, "requestBrief");
          const isRunningQuote =
            isOperationLoading(opsByQuoteId, quote.id, "generateQuote") ||
            isOperationLoading(opsByQuoteId, quote.id, "previewQuote");
          const isRunningContract = isOperationLoading(
            opsByQuoteId,
            quote.id,
            "generateContract",
          );

          return (
            <QuoteActionsCell
              quote={quote}
              isRunningBrief={isRunningBrief}
              isRunningQuote={isRunningQuote}
              isRunningContract={isRunningContract}
              onRequestBrief={() => {
                void handleRequestBrief(quote);
              }}
              onOpenBrief={() => handleOpenBrief(quote)}
              onGenerateContract={() => {
                void handleGenerateContract(quote);
              }}
            />
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
      columnFilters: industry === "Todas" ? [] : [{ id: "industria", value: industry }],
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      setSorting(typeof updater === "function" ? updater(sorting) : updater);
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      const nextValue = typeof updater === "function" ? updater(search) : updater;
      setSearch(String(nextValue || ""));
    },
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

  const isPreviewingSelected = selectedQuote
    ? isOperationLoading(opsByQuoteId, selectedQuote.id, "previewQuote")
    : false;
  const isGeneratingSelected = selectedQuote
    ? isOperationLoading(opsByQuoteId, selectedQuote.id, "generateQuote")
    : false;

  return (
    <>
      <div className="space-y-4">
        <QuotesMetricsCards
          quotes={quotes}
          source={source}
          sourceMessage={sourceMessage}
          createEnabled={createEnabled}
        />

        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <QuotesFilters
              search={search}
              industry={industry}
              industries={industries}
              onSearchChange={setSearch}
              onIndustryChange={setIndustry}
            />
            <QuotesGrid table={table} sourceMessage={sourceMessage} />
          </CardContent>
        </Card>
      </div>

      <BriefDialog
        selectedQuote={selectedQuote}
        open={Boolean(selectedQuote)}
        quoteFeedback={quoteFeedback}
        briefSummary={briefSummary}
        isPreviewing={isPreviewingSelected}
        isGeneratingQuote={isGeneratingSelected}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedQuoteId(null);
          }
        }}
        onClose={() => setSelectedQuoteId(null)}
        onQuoteFeedbackChange={(value) => {
          if (selectedQuote) {
            setQuoteFeedback(selectedQuote.id, value);
          }
        }}
        onPreview={() => {
          if (selectedQuote) {
            void handlePreviewQuote(selectedQuote);
          }
        }}
        onGenerateQuote={() => {
          if (selectedQuote) {
            void handleGenerateQuote(selectedQuote);
          }
        }}
      />
    </>
  );
}
