"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, MapPin, Save, FileText, CheckCircle2, MessageSquare, AlertTriangle } from "lucide-react";
import { getProspects, updateProspectStatus, updateProspectNotes, searchAndImportProspects, type Prospect } from "./actions";

const VERTICALS = [
  { value: "restaurantes", label: "Restaurantes" },
  { value: "veterinarias", label: "Veterinarias" },
  { value: "oftalmologia", label: "Oftalmología" },
  { value: "tiendas-celulares", label: "Tiendas de Celulares" },
  { value: "marmolerias", label: "Marmolerías" },
];

const STATUSES = [
  { value: "nuevo", label: "Nuevo", tone: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { value: "contactado", label: "Contactado", tone: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { value: "interesado", label: "Interesado", tone: "bg-green-500/10 text-green-400 border-green-500/20" },
  { value: "descartado", label: "Descartado", tone: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
];

export default function ProspectosPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form State
  const [vertical, setVertical] = useState("restaurantes");
  const [city, setCity] = useState("Bogotá, Colombia");
  const [query, setQuery] = useState("restaurantes");
  const [limit, setLimit] = useState(20);

  // Filters State
  const [filterVertical, setFilterVertical] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editable notes state (keyed by placeId)
  const [notesState, setNotesState] = useState<Record<string, string>>({});

  const showNotice = useCallback((type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProspects();
      setProspects(data);
      // Initialize notes state
      const notesMap: Record<string, string> = {};
      data.forEach((p) => {
        notesMap[p.placeId] = p.notes || "";
      });
      setNotesState(notesMap);
    } catch {
      showNotice("error", "No se pudieron cargar los prospectos.");
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    try {
      const res = await searchAndImportProspects(vertical, city, query, limit);
      if (res.success) {
        showNotice("success", `Escaneo finalizado. Se importaron ${res.count} nuevos prospectos.`);
        loadProspects();
      } else {
        showNotice("error", res.message || "Error al buscar prospectos.");
      }
    } catch {
      showNotice("error", "Error inesperado al conectar con el buscador.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStatusChange = async (placeId: string, newStatus: string) => {
    try {
      const ok = await updateProspectStatus(placeId, newStatus);
      if (ok) {
        setProspects((prev) =>
          prev.map((p) => (p.placeId === placeId ? { ...p, status: newStatus } : p))
        );
        showNotice("success", "Estado actualizado correctamente.");
      }
    } catch {
      showNotice("error", "No se pudo actualizar el estado.");
    }
  };

  const handleSaveNotes = async (placeId: string) => {
    const notesValue = notesState[placeId] || "";
    try {
      const ok = await updateProspectNotes(placeId, notesValue);
      if (ok) {
        showNotice("success", "Notas guardadas correctamente.");
      }
    } catch {
      showNotice("error", "No se pudieron guardar las notas.");
    }
  };

  const filteredProspects = prospects.filter((p) => {
    const matchesVert = filterVertical === "all" || p.vertical === filterVertical;
    const matchesStat = filterStatus === "all" || p.status === filterStatus;
    return matchesVert && matchesStat;
  });

  const getWhatsAppLink = (p: Prospect) => {
    const text = `Hola, vi tu negocio ${p.name} en Google Maps. Notamos que no tienes página web y estamos ofreciendo el diseño de landings comerciales de alta conversión para ${p.vertical} por tiempo limitado con 40% de descuento. ¿Te interesaría ver un ejemplo?`;
    const cleanPhone = p.phone.replace(/[^\d]/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <Search className="h-8 w-8 text-brand-gold" />
          Prospección de Clientes (Google Maps)
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Escanea negocios locales directamente desde Google Places API, identifica quiénes no tienen web y contáctalos por WhatsApp con ofertas personalizadas.
        </p>
      </div>

      {notification && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${
            notification.type === "success"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_2.2fr]">
        {/* Search Panel */}
        <section className="rounded-2xl border border-white/10 bg-brand-charcoal/45 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-gold" />
            Escanear Zona
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-off-white/70">Rubro / Vertical</label>
              <select
                value={vertical}
                onChange={(e) => {
                  setVertical(e.target.value);
                  setQuery(e.target.value);
                }}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none"
              >
                {VERTICALS.map((v) => (
                  <option key={v.value} value={v.value} className="bg-brand-charcoal">
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-off-white/70">Ciudad / Zona</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none"
                placeholder="Ej. Cali, Colombia"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-off-white/70">Término de Búsqueda</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none"
                placeholder="Ej. restaurantes"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-brand-off-white/70">Límite de Prospectos</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-brand-gold focus:outline-none"
                min={1}
                max={60}
              />
            </div>

            <button
              type="submit"
              disabled={searchLoading}
              className="w-full inline-flex min-h-11 items-center justify-center rounded-xl bg-gold-gradient px-4 text-center text-sm font-black uppercase tracking-wide text-black transition-transform duration-200 hover:scale-[1.01] disabled:opacity-50"
            >
              {searchLoading ? "Escaneando Maps..." : "Iniciar Escaneo"}
            </button>
          </form>
        </section>

        {/* Results Panel */}
        <section className="rounded-2xl border border-white/10 bg-brand-charcoal/20 p-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-gold" />
              Base de Prospectos ({filteredProspects.length})
            </h2>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={filterVertical}
                onChange={(e) => setFilterVertical(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value="all">Todos los rubros</option>
                {VERTICALS.map((v) => (
                  <option key={v.value} value={v.value} className="bg-brand-charcoal">
                    {v.label}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value="all">Todos los estados</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-brand-charcoal">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-brand-off-white/50">Cargando base de datos...</div>
          ) : filteredProspects.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-xl text-brand-off-white/50">
              No se encontraron prospectos en la base. Inicia una búsqueda a la izquierda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-brand-off-white">
                <thead>
                  <tr className="border-b border-white/10 pb-3 text-xs uppercase tracking-widest text-brand-off-white/50">
                    <th className="py-3 pr-4">Nombre / Maps</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4">Sitio Web</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 pl-4">Notas & Outreach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProspects.map((p) => {
                    return (
                      <tr key={p.placeId} className="group hover:bg-white/[0.01]">
                        <td className="py-4 pr-4">
                          <a
                            href={p.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-white hover:text-brand-gold hover:underline"
                          >
                            {p.name}
                          </a>
                          <div className="text-xs text-brand-off-white/50 mt-1">{p.address}</div>
                        </td>
                        <td className="py-4 px-4 font-mono">{p.phone || "Sin teléfono"}</td>
                        <td className="py-4 px-4">
                          {p.website ? (
                            <a
                              href={p.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-gold hover:underline"
                            >
                              Visitar Web
                            </a>
                          ) : (
                            <span className="text-xs font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                              Ideal: Sin Web
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.placeId, e.target.value)}
                            className="rounded border border-white/10 bg-black/60 px-2 py-1 text-xs text-white focus:outline-none"
                          >
                            {STATUSES.map((s) => (
                              <option key={s.value} value={s.value} className="bg-brand-charcoal">
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 pl-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={notesState[p.placeId] || ""}
                              onChange={(e) =>
                                setNotesState((prev) => ({ ...prev, [p.placeId]: e.target.value }))
                              }
                              onBlur={() => handleSaveNotes(p.placeId)}
                              className="w-full rounded border border-white/5 bg-black/40 px-2 py-1 text-xs text-white focus:border-brand-gold focus:outline-none"
                              placeholder="Escribe notas..."
                            />
                            <button
                              onClick={() => handleSaveNotes(p.placeId)}
                              className="p-1.5 rounded bg-white/5 text-brand-off-white/60 hover:text-white hover:bg-white/10"
                              title="Guardar notas"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {p.phone && (
                            <a
                              href={getWhatsAppLink(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-[#25d366] hover:underline bg-[#25d366]/5 px-2.5 py-1.5 rounded-lg border border-[#25d366]/10"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Outreach WhatsApp
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
