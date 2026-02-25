"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Building2,
  UserCircle,
  Briefcase,
  FileSignature,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface Quote {
  id: string;
  nombre: string;
  empresa: string;
  servicio: string;
  monto: string;
  estado: string;
  email?: string;
}

export default function CotizacionesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const res = await fetch("/api/admin/cotizaciones");
      if (res.ok) {
        const data = await res.json();
        // Soportamos tanto array directo como envoltorio de n8n
        setQuotes(Array.isArray(data) ? data : data.quotes || []);
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateContract = async (quote: Quote) => {
    setGeneratingId(quote.id);
    try {
      const res = await fetch("/api/admin/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: quote.id, email: quote.email || "" }),
      });

      if (res.ok) {
        // Actualización optimista de la UI
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === quote.id ? { ...q, estado: "Contrato Enviado" } : q,
          ),
        );
      } else {
        alert(
          "Ocurrió un error al generar el contrato. Asegúrate de que el webhook de n8n y su configuración en el .env.local sean correctos.",
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión al generar el contrato.");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand-gold" />
            Cotizaciones y Contratos
          </h1>
          <p className="text-neutral-500 mt-1 md:text-lg">
            Gestiona los leads entrantes y automatiza la generación de sus
            contratos.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-gold mb-4" />
            <p className="text-sm font-medium">
              Obteniendo cotizaciones pendientes de n8n...
            </p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-neutral-400">
            <Briefcase className="w-12 h-12 mb-4 text-neutral-300" />
            <p className="text-lg font-medium text-neutral-900">
              No hay cotizaciones
            </p>
            <p className="text-sm">
              Actualmente no hay leads esperando contratos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="text-xs uppercase bg-neutral-50 border-b border-neutral-200 text-neutral-900">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Lead
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Empresa
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Servicio Cuestionado
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Presupuesto Est.
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 font-semibold text-right"
                  >
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {quotes.map((quote) => {
                  const isSent = quote.estado
                    ?.toLowerCase()
                    .includes("enviado");
                  return (
                    <tr
                      key={quote.id}
                      className="hover:bg-neutral-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-neutral-400" />
                        {quote.nombre}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-neutral-400" />
                          {quote.empresa}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {quote.servicio}
                      </td>
                      <td className="px-6 py-4 text-neutral-900 font-semibold">
                        {quote.monto}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isSent
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {quote.estado || "Pendiente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleGenerateContract(quote)}
                          disabled={generatingId === quote.id || isSent}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-charcoal hover:bg-neutral-800 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          {generatingId === quote.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              Generando...
                            </>
                          ) : isSent ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Contrato Enviado
                            </>
                          ) : (
                            <>
                              <FileSignature className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
                              Generar Contrato
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
