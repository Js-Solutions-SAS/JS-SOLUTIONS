"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";
import {
  getProspectOptions,
  getProspects,
  importLatestOsmProspects,
  searchOsmProspects,
  updateProspectNotes,
  updateProspectStatus,
  type Prospect,
  type ProspectFilters,
  type ProspectOption,
  type ProspectOptions,
} from "./actions";

const STATUSES = [
  { value: "nuevo", label: "Nuevo", tone: "border-sky-400/25 bg-sky-400/10 text-sky-200" },
  { value: "contactado", label: "Contactado", tone: "border-amber-300/25 bg-amber-300/10 text-amber-100" },
  { value: "interesado", label: "Interesado", tone: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" },
  { value: "descartado", label: "Descartado", tone: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300" },
];

function getStatusTone(value: string) {
  return STATUSES.find((status) => status.value === value)?.tone || STATUSES[0].tone;
}

function getOptionLabel(options: ProspectOption[], value: string) {
  return options.find((option) => option.value === value)?.label || value;
}

export default function ProspectosPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectOptions, setProspectOptions] = useState<ProspectOptions>({
    cities: [],
    verticals: [],
    statuses: STATUSES.map(({ value, label }) => ({ value, label })),
    contacts: [],
    websites: [],
  });
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCity, setSearchCity] = useState("Cali");
  const [searchVertical, setSearchVertical] = useState("odontologias");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit, setSearchLimit] = useState(150);

  // Filters State
  const [filterVertical, setFilterVertical] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterContact, setFilterContact] = useState("all");
  const [filterWebsite, setFilterWebsite] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");

  // Notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editable notes state (keyed by placeId)
  const [notesState, setNotesState] = useState<Record<string, string>>({});

  const showNotice = useCallback((type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const statusOptions = prospectOptions.statuses.length
    ? prospectOptions.statuses
    : STATUSES.map(({ value, label }) => ({ value, label }));
  const contactOptions = prospectOptions.contacts.length
    ? prospectOptions.contacts
    : [{ value: "all", label: "Todos los canales" }];
  const websiteOptions = prospectOptions.websites.length
    ? prospectOptions.websites
    : [{ value: "all", label: "Todas las webs" }];
  const cityOptions = prospectOptions.cities;
  const verticalOptions = prospectOptions.verticals;

  const activeFilters = useMemo<ProspectFilters>(
    () => ({
      city: filterCity,
      vertical: filterVertical,
      status: filterStatus,
      contact: filterContact,
      website: filterWebsite,
      q: filterSearch,
      limit: 1000,
    }),
    [filterCity, filterContact, filterSearch, filterStatus, filterVertical, filterWebsite],
  );

  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProspects(activeFilters);
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
  }, [activeFilters, showNotice]);

  useEffect(() => {
    getProspectOptions()
      .then(setProspectOptions)
      .catch(() => {
        showNotice("error", "No se pudieron cargar las opciones de prospección.");
      });
  }, [showNotice]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadProspects();
    }, filterSearch.trim() ? 350 : 0);

    return () => window.clearTimeout(timeout);
  }, [filterSearch, loadProspects]);

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

  const handleOsmSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchLoading(true);
    try {
      const res = await searchOsmProspects({
        city: searchCity,
        vertical: searchVertical,
        query: searchQuery.trim() || undefined,
        limit: searchLimit,
      });

      if (res.success) {
        showNotice(
          "success",
          `Overpass sincronizado. ${res.searched || 0} encontrados, ${res.count} nuevos, ${res.updated || 0} actualizados, ${res.total} en DB.`,
        );
        await loadProspects();
      } else {
        showNotice("error", res.message || "No se pudo consultar Overpass.");
      }
    } catch {
      showNotice("error", "Error inesperado al consultar Overpass.");
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

  const filteredProspects = prospects;

  const getWhatsAppLink = (p: Prospect) => {
    const offer = p.recommendedOffer || "landing profesional con WhatsApp y seguimiento comercial";
    const text = `Hola, vi ${p.name} en un directorio publico local. En JS Solutions estamos ayudando a negocios de ${p.category || p.vertical} a convertir mas contactos de WhatsApp con ${offer}. Te puedo compartir una revision rapida de tu presencia digital y un ejemplo aplicable a tu negocio?`;
    const cleanPhone = p.phone.replace(/[^\d]/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const noWebsiteCount = prospects.filter((p) => !p.website).length;
  const hasWebsiteCount = prospects.filter((p) => p.website).length;
  const whatsappReadyCount = prospects.filter((p) => p.phone).length;
  const emailReadyCount = prospects.filter((p) => p.email).length;
  const multiChannelCount = prospects.filter((p) => p.phone && p.email).length;
  const avgScore = prospects.length
    ? Math.round(prospects.reduce((sum, p) => sum + Number(p.leadScore || 0), 0) / prospects.length)
    : 0;
  const metricCards = [
    { label: "Prospectos", value: prospects.length, detail: "cargados en la base", icon: Database },
    { label: "Sin web", value: noWebsiteCount, detail: "oferta: landing + WhatsApp", icon: Globe2 },
    { label: "Con web", value: hasWebsiteCount, detail: "oferta: auditoría y mejora", icon: ExternalLink },
    { label: "WhatsApp", value: whatsappReadyCount, detail: "contacto directo disponible", icon: MessageSquare },
    { label: "Email", value: emailReadyCount, detail: "campaña de correo posible", icon: Mail },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.13),rgba(18,18,18,0.72)_42%,rgba(10,10,10,0.92))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
              <Database className="h-3.5 w-3.5" />
              Prospección OSM
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Clientes potenciales listos para contactar
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-off-white/68">
              Busca negocios en OpenStreetMap, guarda nuevos registros en la DB y opera el contacto comercial desde WhatsApp con estado y notas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <div className="text-xs text-brand-off-white/52">Score promedio</div>
              <div className="mt-1 text-2xl font-black text-white">{avgScore}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
              <div className="text-xs text-brand-off-white/52">Multicanal</div>
              <div className="mt-1 text-2xl font-black text-white">{multiChannelCount}</div>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div
          role="status"
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            notification.type === "success"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/25 bg-rose-400/10 text-rose-100"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span>{notification.text}</span>
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-brand-charcoal/80 p-4 shadow-[0_12px_44px_rgba(0,0,0,0.24)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Search className="h-4.5 w-4.5 text-brand-gold" />
              Buscar y guardar prospectos
            </h2>
            <p className="mt-1 text-xs text-brand-off-white/55">
              La búsqueda web persiste en el API. El JSON local queda como respaldo operativo.
            </p>
          </div>
          <button
            type="button"
            onClick={handleImport}
            disabled={importLoading}
            className="hidden min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-brand-off-white/75 transition hover:border-brand-gold/35 hover:text-white disabled:opacity-50 sm:inline-flex"
          >
            <RefreshCw className={`h-4 w-4 ${importLoading ? "animate-spin" : ""}`} />
            {importLoading ? "Importando" : "Importar JSON"}
          </button>
        </div>

        <form onSubmit={handleOsmSearch} className="grid gap-3 lg:grid-cols-[1fr_1.2fr_1.2fr_0.7fr_auto] lg:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-off-white/70">Ciudad</label>
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="min-h-11 rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
              placeholder="Cali, Medellin, Pereira"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-off-white/70">Nicho sugerido</label>
            <select
              value={searchVertical}
              onChange={(e) => setSearchVertical(e.target.value)}
              className="min-h-11 rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
            >
              {verticalOptions.length === 0 ? (
                <option value={searchVertical} className="bg-brand-charcoal">
                  Cargando nichos
                </option>
              ) : (
                verticalOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-brand-charcoal">
                    {option.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-off-white/70">Búsqueda libre</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-11 rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-brand-off-white/35 focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
              placeholder="ortodoncia, spa, optica"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-off-white/70">Límite</label>
            <input
              type="number"
              value={searchLimit}
              onChange={(e) => setSearchLimit(Number(e.target.value))}
              className="min-h-11 rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
              min={1}
              max={500}
            />
          </div>

          <button
            type="submit"
            disabled={searchLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gold-gradient px-5 text-sm font-black uppercase text-black transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-brand-gold/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            {searchLoading ? "Buscando" : "Buscar"}
          </button>
        </form>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-off-white/45">{metric.label}</p>
                  <p className="mt-2 text-3xl font-black text-white">{metric.value}</p>
                </div>
                <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/10 p-2 text-brand-gold">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-sm text-brand-off-white/55">{metric.detail}</p>
            </div>
          );
        })}
      </div>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-rose-300/15 bg-rose-300/10 p-4">
          <div className="text-sm font-bold text-white">Sin web: {noWebsiteCount}</div>
          <p className="mt-1 text-xs leading-5 text-brand-off-white/58">
            Oferta principal: landing profesional, WhatsApp visible, formulario/cotizador y seguimiento básico.
          </p>
        </div>
        <div className="rounded-xl border border-brand-gold/15 bg-brand-gold/10 p-4">
          <div className="text-sm font-bold text-white">Con web: {hasWebsiteCount}</div>
          <p className="mt-1 text-xs leading-5 text-brand-off-white/58">
            Oferta principal: auditoría rápida, mejora de conversión, SEO local, velocidad, WhatsApp y automatización.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/10 p-4">
          <div className="text-sm font-bold text-white">Canales: {whatsappReadyCount} WhatsApp / {emailReadyCount} email</div>
          <p className="mt-1 text-xs leading-5 text-brand-off-white/58">
            WhatsApp sirve para contacto directo; email sirve para enviar diagnóstico, video corto o propuesta inicial.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-brand-charcoal/72 p-4 shadow-[0_12px_44px_rgba(0,0,0,0.22)]">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <FileText className="h-5 w-5 text-brand-gold" />
              Base de prospectos
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-brand-off-white/65">
                {filteredProspects.length}
              </span>
            </h2>
            <p className="mt-1 text-xs text-brand-off-white/52">
              Prioriza leads con teléfono, sin web y score alto. Actualiza estado y notas sin salir del listado.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[980px] xl:grid-cols-6">
            <input
              type="search"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="min-h-10 rounded-lg border border-white/10 bg-black/35 px-3 text-xs text-white outline-none placeholder:text-brand-off-white/35 focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
              placeholder="Buscar nombre, zona, email"
            />

            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="min-h-10 rounded-lg border border-white/10 bg-black/35 px-3 text-xs text-white outline-none focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
            >
              <option value="all">Todas las ciudades</option>
              {cityOptions.map((city) => (
                <option key={city.value} value={city.value} className="bg-brand-charcoal">
                  {city.label}
                </option>
              ))}
            </select>

            <select
              value={filterVertical}
              onChange={(e) => setFilterVertical(e.target.value)}
              className="min-h-10 rounded-lg border border-white/10 bg-black/35 px-3 text-xs text-white outline-none focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
            >
              <option value="all">Todos los rubros</option>
              {verticalOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-brand-charcoal">
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="min-h-10 rounded-lg border border-white/10 bg-black/35 px-3 text-xs text-white outline-none focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
            >
              <option value="all">Todos los estados</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value} className="bg-brand-charcoal">
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={filterContact}
              onChange={(e) => setFilterContact(e.target.value)}
              className="min-h-10 rounded-lg border border-white/10 bg-black/35 px-3 text-xs text-white outline-none focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
            >
              {contactOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-brand-charcoal">
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filterWebsite}
              onChange={(e) => setFilterWebsite(e.target.value)}
              className="min-h-10 rounded-lg border border-white/10 bg-black/35 px-3 text-xs text-white outline-none focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
            >
              {websiteOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-brand-charcoal">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-xl border border-white/8 bg-white/[0.035]" />
            ))}
          </div>
        ) : filteredProspects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/12 bg-black/20 px-5 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-gold/20 bg-brand-gold/10 text-brand-gold">
              <Search className="h-5 w-5" />
            </div>
            <p className="font-semibold text-white">No hay prospectos con estos filtros</p>
            <p className="mt-1 text-sm text-brand-off-white/55">Ajusta ciudad, rubro o estado para ampliar la búsqueda.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProspects.map((p) => (
              <article
                key={p.placeId}
                className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-brand-gold/25 hover:bg-white/[0.035]"
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(260px,1.5fr)_minmax(260px,1fr)_160px_220px] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={p.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 text-base font-bold leading-tight text-white underline-offset-4 hover:text-brand-gold hover:underline"
                      >
                        {p.name}
                      </a>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusTone(p.status)}`}>
                        {getOptionLabel(statusOptions, p.status)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-off-white/55">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-brand-gold/80" />
                        {p.city || "Sin ciudad"}
                      </span>
                      <span>{getOptionLabel(verticalOptions, p.vertical)}</span>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-5 text-brand-off-white/62">
                      {p.address || "Dirección no disponible"}
                    </p>
                    {p.recommendedOffer && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-brand-off-white/45">{p.recommendedOffer}</p>
                    )}
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2 text-brand-off-white/78">
                      <Phone className="h-4 w-4 shrink-0 text-brand-gold/80" />
                      <span className="min-w-0 truncate font-mono">{p.phone || "Sin teléfono"}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 text-brand-off-white/58">
                      <Mail className="h-4 w-4 shrink-0 text-brand-gold/65" />
                      <span className="min-w-0 truncate">{p.email || "Sin email"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {p.website ? (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-brand-gold/20 bg-brand-gold/10 px-2.5 text-xs font-semibold text-brand-gold hover:border-brand-gold/45"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Web
                        </a>
                      ) : (
                        <span className="inline-flex min-h-8 items-center rounded-lg border border-rose-300/20 bg-rose-300/10 px-2.5 text-xs font-semibold text-rose-200">
                          Sin web
                        </span>
                      )}
                      <span className="inline-flex min-h-8 items-center rounded-lg border border-brand-gold/20 bg-brand-gold/10 px-2.5 text-xs font-bold text-brand-gold">
                        Score {p.leadScore ?? "-"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-off-white/45">
                      Estado
                    </label>
                    <select
                      value={p.status}
                      onChange={(e) => handleStatusChange(p.placeId, e.target.value)}
                      className="min-h-10 w-full rounded-lg border border-white/10 bg-black/45 px-3 text-sm text-white outline-none focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value} className="bg-brand-charcoal">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={notesState[p.placeId] || ""}
                        onChange={(e) =>
                          setNotesState((prev) => ({ ...prev, [p.placeId]: e.target.value }))
                        }
                        onBlur={() => handleSaveNotes(p.placeId)}
                        className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-brand-off-white/35 focus:border-brand-gold/60 focus:ring-4 focus:ring-brand-gold/10"
                        placeholder="Nota rápida"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(p.placeId)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-brand-off-white/70 transition hover:border-brand-gold/35 hover:text-white focus:outline-none focus:ring-4 focus:ring-brand-gold/10"
                        title="Guardar notas"
                        aria-label={`Guardar notas de ${p.name}`}
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>

                    {p.phone ? (
                      <a
                        href={getWhatsAppLink(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 text-sm font-bold text-emerald-200 transition hover:border-emerald-300/40 hover:bg-emerald-400/15"
                      >
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/8 bg-white/[0.025] px-3 text-sm font-semibold text-brand-off-white/35"
                      >
                        Sin WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
