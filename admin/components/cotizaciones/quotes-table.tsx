"use client";

import { useMemo, useState, useTransition } from "react";
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
  FileSignature,
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { parseAmount, statusTone } from "@/lib/quote-utils";
import type { Quote } from "@/lib/types";

interface QuotesTableProps {
  initialQuotes: Quote[];
}

const PAGE_SIZE = 8;
const columnHelper = createColumnHelper<Quote>();

export function QuotesTable({ initialQuotes }: QuotesTableProps) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("Todas");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runningBriefId, setRunningBriefId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const industries = useMemo(() => {
    const unique = new Set(quotes.map((quote) => quote.industria || "General"));
    return ["Todas", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [quotes]);

  const handleGenerateContract = (quote: Quote) => {
    setRunningId(quote.id);

    startTransition(async () => {
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
        toast.error("Error de conexión", {
          description: result.message,
        });
      }

      setRunningId(null);
    });
  };

  const handleRequestBrief = (quote: Quote) => {
    setRunningBriefId(quote.id);

    startTransition(async () => {
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
        toast.success("Brief Solicitado", {
          description: result.message,
        });
      } else {
        toast.error("Error de conexión", {
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
          const isRunningContract = runningId === quote.id && isPending;
          const isRunningBrief = runningBriefId === quote.id && isPending;

          return (
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => handleRequestBrief(quote)}
                disabled={
                  isDone ||
                  isRunningBrief ||
                  isRunningContract ||
                  quote.estado === "Brief Enviado"
                }
                variant="outline"
                size="sm"
                className="bg-brand-charcoal hover:bg-white/10"
              >
                {isRunningBrief
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
    [isPending, runningId, runningBriefId],
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
        `${row.original.nombre} ${row.original.empresa} ${row.original.servicio}`.toLowerCase();
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
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 lg:flex">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar lead, empresa o servicio"
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
                {table.getRowModel().rows.map((row) => (
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
                ))}
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
  );
}
