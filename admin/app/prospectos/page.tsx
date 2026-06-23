"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, MapPin, Save, FileText, CheckCircle2, MessageSquare, AlertTriangle, RefreshCw } from "lucide-react";
import { getProspects, importLatestOsmProspects, updateProspectStatus, updateProspectNotes, type Prospect } from "./actions";

const VERTICALS = [
  { value: "odontologias", label: "Odontologías" },
  { value: "oftalmologicas", label: "Oftalmológicas" },
  { value: "centros_estetica", label: "Centros de estética" },
  { value: "inmobiliarias", label: "Inmobiliarias" },
  { value: "servicios_tecnicos", label: "Servicios técnicos" },
  { value: "gimnasios", label: "Gimnasios" },
  { value: "veterinarias", label: "Veterinarias" },
  { value: "abogados", label: "Abogados" },
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
  const [importLoading, setImportLoading] = useState(false);

  // Filters State
  const [filterVertical, setFilterVertical] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity, setFilterCity] = useState("all");

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

  const handleImport = async () => {
    setImportLoading(true);
    try {
      const res = await importLatestOsmProspects();
      if (res.success) {
        showNotice("success", `Base OSM sincronizada. ${res.count} nuevos, ${res.total} prospectos en total.`);
        await loadProspects();
      } else {
        showNotice("error", res.message || "No se pudo importar la base OSM.");
      }
    } catch {
      showNotice("error", "Error inesperado al importar la base OSM.");
    } finally {
      setImportLoading(false);
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
    const matchesCity = filterCity === "all" || p.city === filterCity;
    return matchesVert && matchesStat && matchesCity;
  });

  const getWhatsAppLink = (p: Prospect) => {
    const offer = p.recommendedOffer || "landing profesional con WhatsApp y seguimiento comercial";
    const text = `Hola, vi ${p.name} en un directorio publico local. En JS Solutions estamos ayudando a negocios de ${p.category || p.vertical} a convertir mas contactos de WhatsApp con ${offer}. Te puedo compartir una revision rapida de tu presencia digital y un ejemplo aplicable a tu negocio?`;
    const cleanPhone = p.phone.replace(/[^\d]/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const availableCities = Array.from(
    new Set(prospects.map((p) => p.city).filter((city): city is string => Boolean(city)))
  ).sort((a, b) => a.localeCompare(b));

  const contactedCount = prospects.filter((p) => p.status === "contactado").length;
  const noWebsiteCount = prospects.filter((p) => !p.website).length;
  const whatsappReadyCount = prospects.filter((p) => p.phone).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
          <Search className="h-8 w-8 text-brand-gold" />
          Prospección de Clientes (OSM)
        </h1>
        <p className="mt-1 text-sm text-brand-off-white/70">
          Usa la base generada desde OpenStreetMap/Overpass, identifica negocios con oportunidad digital y contáctalos por WhatsApp.
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
        {/* Import Panel */}
        <section className="rounded-2xl border border-white/10 bg-brand-charcoal/45 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-gold" />
            Base Mapeada
          </h2>
          <div className="grid gap-3 text-sm text-brand-off-white/70">
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <div className="text-2xl font-black text-white">{prospects.length}</div>
              <div>prospectos cargados desde OSM</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <div className="text-2xl font-black text-white">{whatsappReadyCount}</div>
              <div>con teléfono para WhatsApp</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <div className="text-2xl font-black text-white">{noWebsiteCount}</div>
              <div>sin sitio web registrado</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <div className="text-2xl font-black text-white">{contactedCount}</div>
              <div>marcados como contactados</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={importLoading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient px-4 text-center text-sm font-black uppercase tracking-wide text-black transition-transform duration-200 hover:scale-[1.01] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${importLoading ? "animate-spin" : ""}`} />
            {importLoading ? "Sincronizando..." : "Importar JSON OSM"}
          </button>

          <p className="text-xs leading-relaxed text-brand-off-white/55">
            La web carga el seed versionado y, en local, toma el archivo más reciente de prospecting/output/osm-leads-*.json. No requiere API key ni tarjeta de Google Maps.
          </p>
        </section>

        {/* Results Panel */}
        <section className="rounded-2xl border border-white/10 bg-brand-charcoal/20 p-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-gold" />
              Base de Prospectos ({filteredProspects.length})
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value="all">Todas las ciudades</option>
                {availableCities.map((city) => (
                  <option key={city} value={city} className="bg-brand-charcoal">
                    {city}
                  </option>
                ))}
              </select>

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
              No se encontraron prospectos con estos filtros. Importa el JSON OSM o cambia los filtros.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-brand-off-white">
                <thead>
                  <tr className="border-b border-white/10 pb-3 text-xs uppercase tracking-widest text-brand-off-white/50">
                    <th className="py-3 pr-4">Negocio / Mapa</th>
                    <th className="py-3 px-4">Ciudad</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Sitio Web</th>
                    <th className="py-3 px-4">Score</th>
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
                          <div className="mt-1 text-xs text-brand-off-white/40">{p.category}</div>
                        </td>
                        <td className="py-4 px-4">{p.city || "Sin ciudad"}</td>
                        <td className="py-4 px-4">
                          <div className="font-mono">{p.phone || "Sin teléfono"}</div>
                          {p.email && <div className="mt-1 text-xs text-brand-off-white/50">{p.email}</div>}
                        </td>
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
                          <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-2 py-0.5 text-xs font-bold text-brand-gold">
                            {p.leadScore ?? "-"}
                          </span>
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
