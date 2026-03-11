import { CheckCircle2, FileSignature } from "lucide-react";

import { Button } from "@/components/atoms/button";
import type { Quote } from "@/lib/types";

interface QuoteActionsCellProps {
  quote: Quote;
  isRunningBrief: boolean;
  isRunningQuote: boolean;
  isRunningContract: boolean;
  onRequestBrief: () => void;
  onOpenBrief: () => void;
  onGenerateContract: () => void;
}

export function QuoteActionsCell({
  quote,
  isRunningBrief,
  isRunningQuote,
  isRunningContract,
  onRequestBrief,
  onOpenBrief,
  onGenerateContract,
}: QuoteActionsCellProps) {
  const canRequestBrief = Boolean(quote.email);
  const hasBriefDetails = Boolean(quote.technicalBrief);
  const isSigned = quote.estado === "Firmado";
  const isContractSent =
    quote.estado === "Contrato Enviado" || Boolean(quote.contractUrl);
  const canResendBrief = quote.estado === "Brief Enviado" || Boolean(quote.briefUrl);

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {!quote.briefCompletedAt ? (
        <Button
          onClick={onRequestBrief}
          disabled={
            !canRequestBrief || isRunningBrief || isRunningContract || isRunningQuote
          }
          variant="outline"
          size="sm"
          className="bg-brand-charcoal hover:bg-white/10"
        >
          {!canRequestBrief
            ? "Falta email"
            : isRunningBrief
              ? "Enviando..."
              : canResendBrief
                ? "Reenviar Brief"
                : "Solicitar Brief"}
        </Button>
      ) : null}

      {hasBriefDetails ? (
        <Button
          onClick={onOpenBrief}
          disabled={isRunningQuote || isRunningBrief || isRunningContract}
          variant="outline"
          size="sm"
        >
          {quote.quotePdfUrl ? "Regenerar Cotización" : "Generar Cotización"}
        </Button>
      ) : null}

      <Button
        onClick={onGenerateContract}
        disabled={!isSigned || isContractSent || isRunningContract || isRunningBrief}
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
}
