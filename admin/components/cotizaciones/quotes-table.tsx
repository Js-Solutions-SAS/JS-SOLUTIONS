"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";
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
import { toast } from "sonner";

import {
  generateContractAction,
  requestTechnicalBriefAction,
} from "@/app/cotizaciones/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuoteIntakeForm } from "@/components/cotizaciones/quote-intake-form";
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
  const [isActionPending, startActionTransition] = useTransition();

  const industries = useMemo(() => {
    const unique = new Set(quotes.map((quote) => quote.industria || "General"));
    return ["Todas", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [quotes]);

  const withEmailCount = quotes.filter((quote) => Boolean(quote.email)).length;
  const withoutEmailCount = quotes.length - withEmailCount;
  const withBriefCount = quotes.filter((quote) => Boolean(quote.briefUrl)).length;

  const handleCopyBriefLink = async (quote: Quote) => {
    if (!quote.briefUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(quote.briefUrl);
      toast.success("Enlace copiado", {
        description: "El brief URL quedó copiado en el portapapeles.",
      });
    } catch {
      toast.error("No se pudo copiar", {
        description: quote.briefUrl,
      });
    }
  };

  const handleGenerateContract = (quote: Quote) => {
    setRunningId(quote.id);

    startActionTransition(async () => {
      const result = await generateContractAction({
        leadId: quote.id,
        email: quote.email,
      });

      if (result.ok) {
        setQuotes((prev) =>
          prev.map((row) =>
            row.id === quote.id ? { ...row, estado: "Firmado" } : row,
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
            row.id === quote.id ? { ...row, estado: "Brief Enviado" } : row,
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

  const columns = useMemo(
    () => [
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
        cell: ({ row }) =>
          row.original.briefUrl ? (
            <div className="flex items-center gap-2">
              <a
                href={row.original.briefUrl}
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
                onClick={() => handleCopyBriefLink(row.original)}
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </Button>
            </div>
          ) : (
            <Badge tone="pending">Sin enlace</Badge>
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
          <Badge tone={statusTone(row.original.estado)}>
            {row.original.estado}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Accion</div>,
        cell: ({ row }) => {
          const quote = row.original;
          const tone = statusTone(quote.estado);
          const isDone = tone === "success";
          const isRunningContract = runningId === quote.id && isActionPending;
          const isRunningBrief = runningBriefId === quote.id && isActionPending;
          const canRequestBrief = Boolean(quote.email);

          return (
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => handleRequestBrief(quote)}
                disabled={
                  !canRequestBrief ||
                  isDone ||
                  isRunningBrief ||
                  isRunningContract ||
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
              <Button
                onClick={() => handleGenerateContract(quote)}
                disabled={isDone || isRunningContract || isRunningBrief}
                variant={isDone ? "outline" : "default"}
                size="sm"
              >
                {isDone ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Firmado
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4" />
                    {isRunningContract ? "Procesando..." : "Aprobar y Generar"}
                  </>
                )}
              </Button>
            </div>
          );
        },
      }),
    ],
    [isActionPending, runningBriefId, runningId],
  );

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

  return (
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
                  Con brief
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
  );
}
