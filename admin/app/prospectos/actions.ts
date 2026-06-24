"use server";

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildApiUrl,
  generateCorrelationId,
  getJsonWithTimeout,
  postJsonWithTimeout,
  resolveApiInternalToken,
} from "@/lib/network";
import osmSeed from "../../data/prospects/osm-leads-seed.json";

export interface Prospect {
  status: string;
  vertical: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  rating: number | string;
  mapsUrl: string;
  placeId: string;
  types: string;
  notes?: string;
  city?: string;
  email?: string;
  leadScore?: number;
  recommendedOffer?: string;
  source?: "osm" | "google" | "manual";
  osmId?: string;
  osmType?: string;
  lat?: number;
  lon?: number;
  sourceQuery?: string;
}

export interface ProspectFilters {
  city?: string;
  vertical?: string;
  status?: string;
  contact?: string;
  website?: string;
  q?: string;
  limit?: number;
}

export interface ProspectOption {
  value: string;
  label: string;
}

export interface ProspectOptions {
  cities: ProspectOption[];
  verticals: ProspectOption[];
  statuses: ProspectOption[];
  contacts: ProspectOption[];
  websites: ProspectOption[];
}

const DB_DIR =
  process.env.PROSPECTS_DB_DIR ||
  (process.env.VERCEL ? "/tmp/js-solutions-prospects" : path.resolve(process.cwd(), "../.artifacts/prospects"));
const DB_FILE = path.join(DB_DIR, "prospects-db.json");
const OSM_OUTPUT_DIR = path.resolve(process.cwd(), "../prospecting/output");

const DEFAULT_OPTIONS: ProspectOptions = {
  cities: [
    { value: "Bogota", label: "Bogota" },
    { value: "Medellin", label: "Medellin" },
    { value: "Cali", label: "Cali" },
    { value: "Pereira", label: "Pereira" },
    { value: "Bucaramanga", label: "Bucaramanga" },
  ],
  verticals: [
    { value: "odontologias", label: "Odontologías" },
    { value: "oftalmologicas", label: "Oftalmológicas" },
    { value: "centros_estetica", label: "Centros de estética" },
    { value: "restaurantes_cafes", label: "Restaurantes y cafés" },
    { value: "inmobiliarias", label: "Inmobiliarias" },
    { value: "servicios_tecnicos", label: "Servicios técnicos" },
    { value: "gimnasios", label: "Gimnasios" },
    { value: "veterinarias", label: "Veterinarias" },
    { value: "abogados", label: "Abogados" },
  ],
  statuses: [
    { value: "nuevo", label: "Nuevo" },
    { value: "contactado", label: "Contactado" },
    { value: "interesado", label: "Interesado" },
    { value: "descartado", label: "Descartado" },
  ],
  contacts: [
    { value: "all", label: "Todos los canales" },
    { value: "whatsapp", label: "Con WhatsApp" },
    { value: "email", label: "Con email" },
    { value: "both", label: "WhatsApp + email" },
    { value: "none", label: "Sin contacto" },
  ],
  websites: [
    { value: "all", label: "Todas las webs" },
    { value: "no_website", label: "Sin web" },
    { value: "has_website", label: "Con web" },
  ],
};

interface OsmLead {
  osmId: string;
  osmType: string;
  businessName: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  lat: number;
  lon: number;
  city: string;
  sourceQuery: string;
  leadScore: number;
  recommendedOffer: string;
  outreachStatus: string;
  nextActionAt: string;
  optOut: boolean;
}

interface ApiProspect {
  id: string;
  source: "osm" | "google" | "manual";
  osmId: string | null;
  osmType: string | null;
  businessName: string;
  category: string | null;
  vertical: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  lat: number | null;
  lon: number | null;
  city: string;
  mapsUrl: string | null;
  sourceQuery: string | null;
  leadScore: number;
  recommendedOffer: string | null;
  status: string;
  notes: string | null;
}

function normalizeApiProspect(item: ApiProspect): Prospect {
  const osmType = item.osmType || "unknown";
  const osmId = item.osmId || item.id;

  return {
    status: item.status || "nuevo",
    vertical: item.vertical,
    name: item.businessName,
    category: item.category || item.vertical,
    address: item.address || "",
    phone: item.phone || "",
    website: item.website || "",
    rating: "",
    mapsUrl: item.mapsUrl || "",
    placeId: item.id || `osm:${osmType}:${osmId}`,
    types: item.sourceQuery || "",
    notes: item.notes || "",
    city: item.city,
    email: item.email || "",
    leadScore: item.leadScore,
    recommendedOffer: item.recommendedOffer || "",
    source: item.source,
    osmId: item.osmId || "",
    osmType: item.osmType || "",
    lat: item.lat || undefined,
    lon: item.lon || undefined,
    sourceQuery: item.sourceQuery || "",
  };
}

function extractDataArray(payload: Record<string, unknown>): ApiProspect[] {
  const data = payload.data;
  if (Array.isArray(data)) return data as ApiProspect[];
  return [];
}

function appendFilter(params: URLSearchParams, key: keyof ProspectFilters, value: unknown): void {
  if (value == null) return;
  const normalized = String(value).trim();
  if (!normalized || normalized === "all") return;
  params.set(key, normalized);
}

function buildProspectsPath(filters: ProspectFilters = {}): string {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit || 1000));
  appendFilter(params, "city", filters.city);
  appendFilter(params, "vertical", filters.vertical);
  appendFilter(params, "status", filters.status);
  appendFilter(params, "contact", filters.contact);
  appendFilter(params, "website", filters.website);
  appendFilter(params, "q", filters.q);
  return `/api/v1/admin/prospects?${params.toString()}`;
}

async function fetchApiProspects(filters: ProspectFilters = {}): Promise<Prospect[] | null> {
  const apiUrl = buildApiUrl(buildProspectsPath(filters));
  if (!apiUrl) return null;

  const response = await getJsonWithTimeout(apiUrl, {
    correlationId: generateCorrelationId("prospects-list"),
    secretToken: resolveApiInternalToken(),
    timeoutMs: 20000,
  });

  if (!response.ok) {
    throw new Error(
      response.errorMessage || "No fue posible cargar prospectos desde la API.",
    );
  }

  return extractDataArray(response.data).map(normalizeApiProspect);
}

function normalizeOptionArray(value: unknown): ProspectOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const option = {
        value: String(record.value || "").trim(),
        label: String(record.label || record.value || "").trim(),
      };
      return option.value && option.label ? option : null;
    })
    .filter((item): item is ProspectOption => Boolean(item));
}

async function fetchApiProspectOptions(): Promise<ProspectOptions | null> {
  const apiUrl = buildApiUrl("/api/v1/admin/prospects/options");
  if (!apiUrl) return null;

  const response = await getJsonWithTimeout(apiUrl, {
    correlationId: generateCorrelationId("prospects-options"),
    secretToken: resolveApiInternalToken(),
    timeoutMs: 15000,
  });

  if (!response.ok) {
    throw new Error(
      response.errorMessage || "No fue posible cargar opciones desde la API.",
    );
  }

  if (!response.data.data || typeof response.data.data !== "object") {
    throw new Error("La API devolvió opciones de prospectos con formato inválido.");
  }

  const data = response.data.data as Record<string, unknown>;
  return {
    cities: normalizeOptionArray(data.cities),
    verticals: normalizeOptionArray(data.verticals),
    statuses: normalizeOptionArray(data.statuses),
    contacts: normalizeOptionArray(data.contacts),
    websites: normalizeOptionArray(data.websites),
  };
}

async function patchApiProspect(
  placeId: string,
  body: Record<string, unknown>,
): Promise<boolean> {
  const apiUrl = buildApiUrl(`/api/v1/admin/prospects/${placeId}`);
  if (!apiUrl) return false;

  try {
    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Correlation-Id": generateCorrelationId("prospects-update"),
        ...(resolveApiInternalToken()
          ? { Authorization: `Bearer ${resolveApiInternalToken()}` }
          : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`No fue posible actualizar el prospecto. Estado ${response.status}.`);
    }

    return true;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("No fue posible actualizar el prospecto.");
  }
}

function slugifyVertical(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeStatus(status: string): string {
  if (status === "new") return "nuevo";
  return status || "nuevo";
}

function getOsmUrl(lead: OsmLead): string {
  if (lead.osmType && lead.osmId) {
    return `https://www.openstreetmap.org/${lead.osmType}/${lead.osmId}`;
  }

  if (lead.lat && lead.lon) {
    return `https://www.openstreetmap.org/?mlat=${lead.lat}&mlon=${lead.lon}#map=18/${lead.lat}/${lead.lon}`;
  }

  return "";
}

function normalizeOsmLead(lead: OsmLead): Prospect {
  const osmType = lead.osmType || "unknown";
  const osmId = lead.osmId || `${lead.businessName}-${lead.address}`;

  return {
    status: normalizeStatus(lead.outreachStatus),
    vertical: slugifyVertical(lead.category),
    name: lead.businessName,
    category: lead.category,
    address: lead.address,
    phone: lead.phone,
    website: lead.website,
    rating: "",
    mapsUrl: getOsmUrl(lead),
    placeId: `osm:${osmType}:${osmId}`,
    types: lead.sourceQuery,
    notes: "",
    city: lead.city,
    email: lead.email,
    leadScore: lead.leadScore,
    recommendedOffer: lead.recommendedOffer,
    source: "osm",
    osmId: lead.osmId,
    osmType: lead.osmType,
    lat: lead.lat,
    lon: lead.lon,
    sourceQuery: lead.sourceQuery,
  };
}

async function readLatestOsmOutput(): Promise<{ leads: OsmLead[]; source: string } | null> {
  try {
    const files = (await readdir(OSM_OUTPUT_DIR))
      .filter((file) => /^osm-leads-\d{4}-\d{2}-\d{2}\.json$/.test(file))
      .sort()
      .reverse();

    if (files.length === 0) return null;

    const source = path.join(OSM_OUTPUT_DIR, files[0]);
    const content = await readFile(source, "utf8");
    return { leads: JSON.parse(content) as OsmLead[], source };
  } catch {
    return null;
  }
}

async function getOsmLeads(): Promise<{ leads: OsmLead[]; source: string }> {
  const latestOutput = await readLatestOsmOutput();
  if (latestOutput) return latestOutput;

  return {
    leads: osmSeed as OsmLead[],
    source: "admin/data/prospects/osm-leads-seed.json",
  };
}

async function ensureDbExists(): Promise<Prospect[]> {
  try {
    await mkdir(DB_DIR, { recursive: true });
    const content = await readFile(DB_FILE, "utf8");
    return JSON.parse(content) as Prospect[];
  } catch {
    // Write empty db if not found
    const empty: Prospect[] = [];
    await writeFile(DB_FILE, JSON.stringify(empty, null, 2), "utf8");
    return empty;
  }
}

function matchesLocalFilters(prospect: Prospect, filters: ProspectFilters = {}): boolean {
  const hasPhone = Boolean(prospect.phone);
  const hasEmail = Boolean(prospect.email);
  const hasWebsite = Boolean(prospect.website);
  const query = String(filters.q || "").trim().toLowerCase();
  const haystack = [
    prospect.name,
    prospect.category,
    prospect.vertical,
    prospect.address,
    prospect.phone,
    prospect.email,
    prospect.website,
    prospect.sourceQuery,
  ]
    .join(" ")
    .toLowerCase();

  return (
    (!filters.city || filters.city === "all" || prospect.city === filters.city) &&
    (!filters.vertical || filters.vertical === "all" || prospect.vertical === filters.vertical) &&
    (!filters.status || filters.status === "all" || prospect.status === filters.status) &&
    (!filters.contact ||
      filters.contact === "all" ||
      (filters.contact === "whatsapp" && hasPhone) ||
      (filters.contact === "email" && hasEmail) ||
      (filters.contact === "both" && hasPhone && hasEmail) ||
      (filters.contact === "none" && !hasPhone && !hasEmail)) &&
    (!filters.website ||
      filters.website === "all" ||
      (filters.website === "no_website" && !hasWebsite) ||
      (filters.website === "has_website" && hasWebsite)) &&
    (!query || haystack.includes(query))
  );
}

function filterLocalProspects(prospects: Prospect[], filters: ProspectFilters = {}): Prospect[] {
  const limit = Math.min(Math.max(filters.limit || 1000, 1), 1000);
  return prospects.filter((prospect) => matchesLocalFilters(prospect, filters)).slice(0, limit);
}

export async function getProspects(filters: ProspectFilters = {}): Promise<Prospect[]> {
  const apiProspects = await fetchApiProspects(filters);
  if (apiProspects) return apiProspects;

  const prospects = await ensureDbExists();
  if (prospects.length > 0) return filterLocalProspects(prospects, filters);

  const imported = await importLatestOsmProspects();
  if (!imported.success) return filterLocalProspects(prospects, filters);

  return filterLocalProspects(await ensureDbExists(), filters);
}

export async function getProspectOptions(): Promise<ProspectOptions> {
  const apiOptions = await fetchApiProspectOptions();
  if (apiOptions) {
    return {
      cities: apiOptions.cities.length ? apiOptions.cities : DEFAULT_OPTIONS.cities,
      verticals: apiOptions.verticals.length ? apiOptions.verticals : DEFAULT_OPTIONS.verticals,
      statuses: apiOptions.statuses.length ? apiOptions.statuses : DEFAULT_OPTIONS.statuses,
      contacts: apiOptions.contacts.length ? apiOptions.contacts : DEFAULT_OPTIONS.contacts,
      websites: apiOptions.websites.length ? apiOptions.websites : DEFAULT_OPTIONS.websites,
    };
  }

  return DEFAULT_OPTIONS;
}

export async function searchOsmProspects(input: {
  city: string;
  vertical: string;
  query?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  count: number;
  updated?: number;
  searched?: number;
  total: number;
  message?: string;
}> {
  const apiUrl = buildApiUrl("/api/v1/admin/prospects/search-osm");
  if (!apiUrl) {
    return {
      success: false,
      count: 0,
      total: 0,
      message:
        "Configura API_BASE_URL/API_INTERNAL_TOKEN o levanta la API local en http://localhost:3003 para buscar y guardar prospectos reales.",
    };
  }

  if (!resolveApiInternalToken()) {
    return {
      success: false,
      count: 0,
      total: 0,
      message:
        "Configura API_INTERNAL_TOKEN con el mismo token del backend para buscar y guardar prospectos reales.",
    };
  }

  const response = await postJsonWithTimeout(apiUrl, {
    correlationId: generateCorrelationId("prospects-osm"),
    secretToken: resolveApiInternalToken(),
    timeoutMs: 60000,
    body: {
      city: input.city,
      vertical: input.vertical,
      query: input.query,
      limit: input.limit || 100,
    },
  });

  if (!response.ok) {
    return {
      success: false,
      count: 0,
      total: 0,
      message: response.errorMessage || "No fue posible buscar prospectos en Overpass.",
    };
  }

  const data = response.data.data as
    | { searched?: number; imported?: number; updated?: number; total?: number }
    | undefined;

  return {
    success: true,
    count: Number(data?.imported || 0),
    updated: Number(data?.updated || 0),
    searched: Number(data?.searched || 0),
    total: Number(data?.total || 0),
  };
}

export async function importLatestOsmProspects(): Promise<{
  success: boolean;
  count: number;
  total: number;
  sourceFile?: string;
  message?: string;
}> {
  try {
    const { leads, source } = await getOsmLeads();
    const existingProspects = await ensureDbExists();
    const existingIds = new Set(existingProspects.map((p) => p.placeId));
    let importedCount = 0;

    for (const lead of leads) {
      if (lead.optOut) continue;

      const prospect = normalizeOsmLead(lead);
      if (existingIds.has(prospect.placeId)) continue;

      existingProspects.push(prospect);
      existingIds.add(prospect.placeId);
      importedCount++;
    }

    if (importedCount > 0) {
      await writeFile(DB_FILE, JSON.stringify(existingProspects, null, 2), "utf8");
    }

    return {
      success: true,
      count: importedCount,
      total: existingProspects.length,
      sourceFile: source,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      total: 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateProspectStatus(placeId: string, status: string): Promise<boolean> {
  if (await patchApiProspect(placeId, { status })) return true;

  const prospects = await ensureDbExists();
  const index = prospects.findIndex((p) => p.placeId === placeId);
  if (index === -1) return false;

  prospects[index].status = status;
  await writeFile(DB_FILE, JSON.stringify(prospects, null, 2), "utf8");
  return true;
}

export async function updateProspectNotes(placeId: string, notes: string): Promise<boolean> {
  if (await patchApiProspect(placeId, { notes })) return true;

  const prospects = await ensureDbExists();
  const index = prospects.findIndex((p) => p.placeId === placeId);
  if (index === -1) return false;

  prospects[index].notes = notes;
  await writeFile(DB_FILE, JSON.stringify(prospects, null, 2), "utf8");
  return true;
}
