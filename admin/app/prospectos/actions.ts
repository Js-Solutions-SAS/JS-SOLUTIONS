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

const DB_DIR =
  process.env.PROSPECTS_DB_DIR ||
  (process.env.VERCEL ? "/tmp/js-solutions-prospects" : path.resolve(process.cwd(), "../.artifacts/prospects"));
const DB_FILE = path.join(DB_DIR, "prospects-db.json");
const OSM_OUTPUT_DIR = path.resolve(process.cwd(), "../prospecting/output");

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

async function fetchApiProspects(): Promise<Prospect[] | null> {
  const apiUrl = buildApiUrl("/api/v1/admin/prospects?limit=1000");
  if (!apiUrl) return null;

  const response = await getJsonWithTimeout(apiUrl, {
    correlationId: generateCorrelationId("prospects-list"),
    secretToken: resolveApiInternalToken(),
    timeoutMs: 20000,
  });

  if (!response.ok) return null;
  return extractDataArray(response.data).map(normalizeApiProspect);
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

    return response.ok;
  } catch {
    return false;
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

export async function getProspects(): Promise<Prospect[]> {
  const apiProspects = await fetchApiProspects();
  if (apiProspects) return apiProspects;

  const prospects = await ensureDbExists();
  if (prospects.length > 0) return prospects;

  const imported = await importLatestOsmProspects();
  if (!imported.success) return prospects;

  return ensureDbExists();
}

export async function searchOsmProspects(input: {
  city: string;
  vertical: string;
  query?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  count: number;
  total: number;
  message?: string;
}> {
  const apiUrl = buildApiUrl("/api/v1/admin/prospects/search-osm");
  if (!apiUrl) {
    return {
      success: false,
      count: 0,
      total: 0,
      message: "Configura API_BASE_URL y API_INTERNAL_TOKEN para buscar desde Overpass y guardar en la DB.",
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
    | { imported?: number; updated?: number; total?: number }
    | undefined;

  return {
    success: true,
    count: Number(data?.imported || 0),
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
