#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_OVERPASS_ENDPOINT =
  process.env.OVERPASS_ENDPOINT || "https://overpass-api.de/api/interpreter";
const DEFAULT_OUTPUT_DIR = process.env.PROSPECTING_OUTPUT_DIR || "prospecting/output";
const DEFAULT_CITIES = ["Bogota", "Medellin", "Cali"];
const DEFAULT_VERTICALS = [
  "odontologias",
  "oftalmologicas",
  "centros_estetica",
  "restaurantes_cafes",
  "inmobiliarias",
  "servicios_tecnicos",
  "gimnasios",
  "veterinarias",
  "abogados",
];

const CITIES = {
  Bogota: {
    label: "Bogota",
    bbox: [4.471, -74.223, 4.837, -73.992],
  },
  Medellin: {
    label: "Medellin",
    bbox: [6.157, -75.671, 6.356, -75.501],
  },
  Cali: {
    label: "Cali",
    bbox: [3.314, -76.614, 3.546, -76.443],
  },
  Pereira: {
    label: "Pereira",
    bbox: [4.741, -75.796, 4.879, -75.622],
  },
};

const VERTICALS = {
  odontologias: {
    label: "Odontologias",
    tags: [{ key: "amenity", value: "dentist" }],
    offer: "Sistema Comercial Web + WhatsApp + Agenda + Cotizacion",
    sourceLabel: "amenity=dentist",
    highIntent: true,
  },
  oftalmologicas: {
    label: "Oftalmologicas y opticas",
    tags: [
      { key: "healthcare", value: "ophthalmology" },
      { key: "healthcare", value: "optometrist" },
      { key: "shop", value: "optician" },
    ],
    offer: "Landing de Especialidad + WhatsApp + Agenda + Captacion Local",
    sourceLabel: "healthcare=ophthalmology|optometrist, shop=optician",
    highIntent: true,
  },
  centros_estetica: {
    label: "Centros de estetica",
    tags: [
      { key: "shop", value: "beauty" },
      { key: "shop", value: "cosmetics" },
      { key: "leisure", value: "spa" },
    ],
    offer: "Sistema Comercial Web + WhatsApp + Agenda + Seguimiento",
    sourceLabel: "shop=beauty|cosmetics, leisure=spa",
    highIntent: true,
  },
  restaurantes_cafes: {
    label: "Restaurantes y cafes",
    tags: [
      { key: "amenity", value: "restaurant" },
      { key: "amenity", value: "cafe" },
    ],
    offer: "Web de Conversion + WhatsApp + Reservas/Pedidos",
    sourceLabel: "amenity=restaurant|cafe",
    highIntent: false,
  },
  inmobiliarias: {
    label: "Inmobiliarias",
    tags: [{ key: "office", value: "estate_agent" }],
    offer: "Landing de Captacion + WhatsApp + CRM de Oportunidades",
    sourceLabel: "office=estate_agent",
    highIntent: true,
  },
  servicios_tecnicos: {
    label: "Servicios tecnicos",
    tags: [
      { key: "shop", value: "electronics" },
      { key: "shop", value: "computer" },
      { key: "craft", value: "electrician" },
      { key: "craft", value: "plumber" },
      { key: "office", value: "it" },
    ],
    nameHints: ["servicio tecnico", "reparacion", "mantenimiento"],
    offer: "Web Local + WhatsApp + Solicitudes y Seguimiento",
    sourceLabel: "shop/craft/office technical services",
    highIntent: true,
  },
  gimnasios: {
    label: "Gimnasios y centros fitness",
    tags: [
      { key: "leisure", value: "fitness_centre" },
      { key: "leisure", value: "sports_centre" },
    ],
    offer: "Landing de Captacion + WhatsApp + Planes/Membresias",
    sourceLabel: "leisure=fitness_centre|sports_centre",
    highIntent: true,
  },
  veterinarias: {
    label: "Veterinarias",
    tags: [{ key: "amenity", value: "veterinary" }],
    offer: "Web Local + WhatsApp + Agenda + Urgencias",
    sourceLabel: "amenity=veterinary",
    highIntent: true,
  },
  abogados: {
    label: "Abogados",
    tags: [{ key: "office", value: "lawyer" }],
    offer: "Landing Profesional + WhatsApp + Consulta Inicial",
    sourceLabel: "office=lawyer",
    highIntent: true,
  },
};

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const cities = splitArg(args.cities, DEFAULT_CITIES).filter((city) => CITIES[city]);
const verticalKeys = splitArg(args.verticals, DEFAULT_VERTICALS).filter((key) => VERTICALS[key]);
const limit = toLimit(args.limit, 100);
const outputDir = args.outputDir || DEFAULT_OUTPUT_DIR;
const endpoint = args.endpoint || DEFAULT_OVERPASS_ENDPOINT;
const outreachStatus = args.outreachStatus || "new";
const nextActionAt = args.nextActionAt || nextActionDate();
const enrichWebsites = Boolean(args.enrichWebsites);
const timeoutSeconds = toPositiveInt(args.timeout, 25);

if (cities.length === 0) {
  fail(`No valid cities. Use one of: ${Object.keys(CITIES).join(", ")}`);
}

if (verticalKeys.length === 0) {
  fail(`No valid verticals. Use one of: ${Object.keys(VERTICALS).join(", ")}`);
}

if (args.dryRun) {
  printDryRun({ cities, verticalKeys, limit, endpoint, outputDir, timeoutSeconds });
  process.exit(0);
}

const leads = await collectLeads({
  cities,
  verticalKeys,
  limit,
  endpoint,
  outreachStatus,
  nextActionAt,
  enrichWebsites,
  timeoutSeconds,
});

await writeOutputs(leads, outputDir);

console.log(`Collected ${leads.length} unique OSM leads.`);
console.log(`Output dir: ${path.resolve(outputDir)}`);

async function collectLeads({
  cities,
  verticalKeys,
  limit,
  endpoint,
  outreachStatus,
  nextActionAt,
  enrichWebsites,
  timeoutSeconds,
}) {
  const seen = new Map();

  for (const cityName of cities) {
    for (const verticalKey of verticalKeys) {
      if (isLimitReached(seen.size, limit)) break;

      const city = CITIES[cityName];
      const vertical = VERTICALS[verticalKey];
      const query = buildOverpassQuery(city.bbox, vertical, timeoutSeconds);
      const sourceQuery = `${vertical.sourceLabel} in ${city.label}`;
      const elements = await runOverpass(endpoint, query);

      for (const element of elements) {
        if (isLimitReached(seen.size, limit)) break;
        const lead = normalizeLead({
          element,
          city: city.label,
          vertical,
          sourceQuery,
          outreachStatus,
          nextActionAt,
        });
        if (!lead.businessName) continue;
        if (!matchesVerticalHints(lead, vertical)) continue;

        if (enrichWebsites && lead.website) {
          Object.assign(lead, await enrichFromWebsite(lead.website));
          lead.leadScore = scoreLead(lead, vertical);
        }

        seen.set(`${lead.osmType}/${lead.osmId}`, lead);
      }
    }
  }

  return [...seen.values()].sort((a, b) => b.leadScore - a.leadScore);
}

function buildOverpassQuery(bbox, vertical, timeoutSeconds) {
  const bboxPart = bbox.join(",");
  const clauses = vertical.tags
    .flatMap(({ key, value }) => [
      `node["${key}"="${value}"](${bboxPart});`,
      `way["${key}"="${value}"](${bboxPart});`,
      `relation["${key}"="${value}"](${bboxPart});`,
    ])
    .join("\n");

  return `[out:json][timeout:${timeoutSeconds}];\n(\n${clauses}\n);\nout center tags;`;
}

async function runOverpass(endpoint, query) {
  const body = new URLSearchParams({ data: query });
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "JS-Solutions-Prospecting/1.0 (contact: sales@jssolutions.com.co)",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Overpass ${response.status}: ${text.slice(0, 500)}`);
  }

  const payload = await response.json();
  return payload.elements || [];
}

function normalizeLead({ element, city, vertical, sourceQuery, outreachStatus, nextActionAt }) {
  const tags = element.tags || {};
  const website = cleanUrl(tags.website || tags["contact:website"] || tags.url || "");
  const phone = tags.phone || tags["contact:phone"] || tags.mobile || tags["contact:mobile"] || "";
  const email = tags.email || tags["contact:email"] || "";
  const lat = element.lat ?? element.center?.lat ?? "";
  const lon = element.lon ?? element.center?.lon ?? "";

  const lead = {
    osmId: String(element.id || ""),
    osmType: element.type || "",
    businessName: tags.name || tags.brand || tags.operator || "",
    category: vertical.label,
    address: formatAddress(tags),
    phone,
    website,
    email,
    lat,
    lon,
    city,
    sourceQuery,
    leadScore: 0,
    recommendedOffer: vertical.offer,
    outreachStatus,
    nextActionAt,
    optOut: false,
  };

  lead.leadScore = scoreLead(lead, vertical);
  return lead;
}

function scoreLead(lead, vertical) {
  let score = 25;
  if (lead.phone) score += 25;
  if (!lead.website && lead.phone) score += 25;
  if (lead.website && weakWebsiteSignal(lead.website)) score += 15;
  if (lead.email) score += 10;
  if (vertical.highIntent) score += 10;
  if (!lead.phone && !lead.website && !lead.email) score -= 10;
  return Math.max(0, Math.min(score, 100));
}

function matchesVerticalHints(lead, vertical) {
  if (!vertical.nameHints?.length) return true;
  const haystack = `${lead.businessName} ${lead.address}`.toLowerCase();
  return vertical.nameHints.some((hint) => haystack.includes(hint));
}

async function enrichFromWebsite(website) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(website, {
      signal: controller.signal,
      headers: {
        "User-Agent": "JS-Solutions-Prospecting/1.0",
      },
    });
    clearTimeout(timer);
    if (!response.ok) return {};
    const html = await response.text();
    return {
      email: firstMatch(html, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i),
      phone: firstMatch(html, /(?:\+?57[\s.-]?)?(?:3\d{2}|60\d|[1-8])[\s.-]?\d{3}[\s.-]?\d{4}/),
      whatsapp: firstMatch(html, /https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s"'<>]+/i),
    };
  } catch {
    return {};
  }
}

function firstMatch(value, pattern) {
  const match = value.match(pattern);
  return match?.[0] || "";
}

function formatAddress(tags) {
  const parts = [
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:neighbourhood"],
    tags["addr:suburb"],
    tags["addr:city"],
  ].filter(Boolean);
  return parts.join(" ").trim();
}

function cleanUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function weakWebsiteSignal(website) {
  const value = website.toLowerCase();
  return [
    "facebook.com",
    "instagram.com",
    "linktr.ee",
    "wixsite.com",
    "wix.com",
    "weebly.com",
    "site123",
    "blogspot.",
    "wordpress.com",
  ].some((signal) => value.includes(signal));
}

async function writeOutputs(leads, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  await fs.writeFile(
    path.join(outputDir, `osm-leads-${stamp}.json`),
    `${JSON.stringify(leads, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(path.join(outputDir, `osm-leads-${stamp}.csv`), toCsv(leads), "utf8");
}

function toCsv(rows) {
  const headers = [
    "osmId",
    "osmType",
    "businessName",
    "category",
    "address",
    "phone",
    "website",
    "email",
    "lat",
    "lon",
    "city",
    "sourceQuery",
    "leadScore",
    "recommendedOffer",
    "outreachStatus",
    "nextActionAt",
    "optOut",
  ];

  return `${[headers.join(","), ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(","))].join("\n")}\n`;
}

function csvCell(value) {
  const raw = value == null ? "" : String(value);
  return `"${raw.replaceAll('"', '""')}"`;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const [key, inlineValue] = arg.slice(2).split("=");
    const normalizedKey = key.replaceAll("-", "");
    if (inlineValue !== undefined) {
      parsed[normalizedKey] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[normalizedKey] = true;
    } else {
      parsed[normalizedKey] = next;
      index += 1;
    }
  }

  return {
    cities: parsed.cities || parsed.city,
    verticals: parsed.verticals || parsed.vertical,
    limit: parsed.limit,
    outputDir: parsed.outputdir,
    endpoint: parsed.endpoint,
    outreachStatus: parsed.outreachstatus,
    nextActionAt: parsed.nextactionat,
    timeout: parsed.timeout,
    enrichWebsites: Boolean(parsed.enrichwebsites),
    dryRun: Boolean(parsed.dryrun),
    help: Boolean(parsed.help || parsed.h),
  };
}

function splitArg(value, fallback) {
  if (!value) return fallback;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toLimit(value, fallback) {
  if (value === "0" || value === 0 || value === "all") return Number.POSITIVE_INFINITY;
  return toPositiveInt(value, fallback);
}

function isLimitReached(count, limit) {
  return Number.isFinite(limit) && count >= limit;
}

function nextActionDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function printDryRun({ cities, verticalKeys, limit, endpoint, outputDir, timeoutSeconds }) {
  console.log("Dry run: no API calls will be made.");
  console.log(`Cities: ${cities.join(", ")}`);
  console.log(`Verticals: ${verticalKeys.join(", ")}`);
  console.log(`Limit: ${limit}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Timeout: ${timeoutSeconds}s`);
  console.log(`Output dir: ${path.resolve(outputDir)}`);
  console.log("Overpass selectors:");
  for (const city of cities) {
    for (const verticalKey of verticalKeys) {
      const vertical = VERTICALS[verticalKey];
      console.log(`- ${city}: ${vertical.sourceLabel}`);
    }
  }
}

function printHelp() {
  console.log(`Usage:
  node prospecting/osm-leads.mjs [options]

Options:
  --cities Bogota,Medellin,Cali
  --verticals odontologias,oftalmologicas,centros_estetica,restaurantes_cafes,inmobiliarias,servicios_tecnicos,gimnasios,veterinarias,abogados
  --limit 0
  --endpoint https://overpass-api.de/api/interpreter
  --output-dir prospecting/output
  --outreach-status new
  --next-action-at 2026-06-19
  --timeout 25
  --enrich-websites
  --dry-run
  --help
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
