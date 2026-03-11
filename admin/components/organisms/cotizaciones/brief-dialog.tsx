import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/molecules/dialog";
import { statusTone } from "@/lib/quote-utils";
import type { Quote } from "@/lib/types";

import { getStatusLabel } from "./quotes-table-helpers";

interface BriefDialogProps {
  selectedQuote: Quote | null;
  open: boolean;
  quoteFeedback: string;
  briefSummary: Array<{ label: string; value: string }>;
  isPreviewing: boolean;
  isGeneratingQuote: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onQuoteFeedbackChange: (value: string) => void;
  onPreview: () => void;
  onGenerateQuote: () => void;
}

export function BriefDialog({
  selectedQuote,
  open,
  quoteFeedback,
  briefSummary,
  isPreviewing,
  isGeneratingQuote,
  onOpenChange,
  onClose,
  onQuoteFeedbackChange,
  onPreview,
  onGenerateQuote,
}: BriefDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  <p className="mt-2 text-sm text-brand-off-white/70">Sin dashboard</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-semibold text-white">Resumen del brief</h3>

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
                <h3 className="text-sm font-semibold text-white">Cotización comercial</h3>
                <p className="text-sm text-brand-off-white/70">
                  Puedes generar o regenerar la cotización con base en el brief y dejar
                  observaciones para el workflow.
                </p>

                <label className="space-y-2 text-sm text-brand-off-white/80">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-brand-off-white/55">
                    Observaciones para regenerar
                  </span>
                  <textarea
                    value={quoteFeedback}
                    onChange={(event) => onQuoteFeedbackChange(event.target.value)}
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
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onPreview}
            disabled={!selectedQuote?.technicalBrief || !selectedQuote?.briefToken || isPreviewing}
          >
            {isPreviewing ? "Previsualizando..." : "Previsualizar"}
          </Button>
          <Button
            type="button"
            onClick={onGenerateQuote}
            disabled={
              !selectedQuote?.technicalBrief || !selectedQuote?.briefToken || isGeneratingQuote
            }
          >
            {isGeneratingQuote ? "Generando..." : "Generar Cotización"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
