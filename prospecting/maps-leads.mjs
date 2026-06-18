#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";

const DEFAULT_CITIES = ["Bogota", "Medellin", "Cali"];
const DEFAULT_VERTICALS = [
  "odontologias",
  "centros_estetica",
  "restaurantes_cafes",
  "inmobiliarias",
  "servicios_tecnicos",
];

const VERTICALS = {
  odontologias: {
    label: "Odontologias",
    queries: ["odontologia", "clinica dental", "ortodoncia"],
    offer: "Sistema Comercial Web + WhatsApp + Agenda + Cotizacion",
    category: "health",
  },
  centros_estetica: {
    label: "Centros de estetica",
    queries: ["centro de estetica", "spa facial", "clinica estetica"],
    offer: "Sistema Comercial Web + WhatsApp + Agenda + Seguimiento",
    category: "beauty",
  },
  restaurantes_cafes: {
    label: "Restaurantes y cafes",
    queries: ["restaurante", "cafe", "comida a domicilio"],
    offer: "Web de Conversion + WhatsApp + Reservas/Pedidos",
    category: "food",
  },
  inmobiliarias: {
    label: "Inmobiliarias",
    queries: ["inmobiliaria", "venta de apartamentos", "arriendo de apartamentos"],
    offer: "Landing de Captacion + WhatsApp + CRM de Oportunidades",
    category: "real_estate",
  },
  servicios_tecnicos: {
    label: "Servicios tecnicos",
    queries: ["servicio tecnico", "reparacion electrodomesticos", "mantenimiento"],
    offer: "Web Local + WhatsApp + Solicitudes y Seguimiento",
    category: "services",
  },
};

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const outputDir = args.outputDir || process.env.PROSPECTING_OUTPUT_DIR || "prospecting/output";
const cities = splitArg(args.cities, DEFAULT_CITIES);
const verticalKeys = splitArg(args.verticals, DEFAULT_VERTICALS).filter((key) => VERTICALS[key]);
const limit = toPositiveInt(args.limit, 25);
const outreachStatus = args.outreachStatus || "new";
const nextActionAt = args.nextActionAt || nextActionDate();
const delayMs = toPositiveInt(args.delayMs, 250);

if (verticalKeys.length === 0) {
  fail(`No valid verticals. Use one of: ${Object.keys(VERTICALS).join(", ")}`);
}

if (args.dryRun) {
  printDryRun({ cities, verticalKeys, limit, outputDir, outreachStatus, nextActionAt });
  process.exit(0);
}

if (!apiKey) {
  fail("GOOGLE_MAPS_API_KEY is required unless --dry-run is used.");
}

const leads = await collectLeads({
  apiKey,
  cities,
  verticalKeys,
  limit,
  outreachStatus,
  nextActionAt,
  delayMs,
});

await writeOutputs(leads, outputDir);

console.log(`Collected ${leads.length} unique leads.`);
console.log(`Output dir: ${path.resolve(outputDir)}`);

async function collectLeads({ apiKey, cities, verticalKeys, limit, outreachStatus, nextActionAt, delayMs }) {
  const seen = new Map();

  for (const city of cities) {
    for (const verticalKey of verticalKeys) {
      const vertical = VERTICALS[verticalKey];

      for (const queryTerm of vertical.queries) {
        if (seen.size >= limit) break;

        const sourceQuery = `${queryTerm} en ${city}, Colombia`;
        const places = await searchText(apiKey, sourceQuery, limit - seen.size);

        for (const place of places) {
          if (seen.size >= limit) break;
          const placeId = place.id;
          if (!placeId || seen.has(placeId)) continue;

          await sleep(delayMs);
          const details = await placeDetails(apiKey, placeId);
          const lead = normalizeLead({
            place: { ...place, ...details },
            city,
            sourceQuery,
            vertical,
            outreachStatus,
            nextActionAt,
          });

          seen.set(placeId, lead);
        }
      }
    }
  }

  return [...seen.values()].sort((a, b) => b.leadScore - a.leadScore);
}

async function searchText(apiKey, textQuery, remaining) {
  const pageSize = Math.max(1, Math.min(20, remaining));
  const body = {
    textQuery,
    languageCode: "es",
    regionCode: "CO",
    pageSize,
  };

  const data = await placesRequest(apiKey, TEXT_SEARCH_URL, body, [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.primaryType",
    "places.rating",
    "places.userRatingCount",
    "places.googleMapsUri",
  ]);

  return data.places || [];
}

async function placeDetails(apiKey, placeId) {
  const url = `${PLACE_DETAILS_URL}/${encodeURIComponent(placeId)}`;
  return placesRequest(apiKey, url, undefined, [
    "id",
    "displayName",
    "formattedAddress",
    "primaryType",
    "rating",
    "userRatingCount",
    "googleMapsUri",
    "websiteUri",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "businessStatus",
  ]);
}

async function placesRequest(apiKey, url, body, fieldMask) {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask.join(","),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Places API ${response.status}: ${text}`);
  }

  return response.json();
}

function normalizeLead({ place, city, sourceQuery, vertical, outreachStatus, nextActionAt }) {
  const website = place.websiteUri || "";
  const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || "";
  const rating = Number(place.rating || 0);
  const reviewCount = Number(place.userRatingCount || 0);
  const businessName = place.displayName?.text || "";
  const category = vertical.label;

  return {
    placeId: place.id || "",
    businessName,
    category,
    address: place.formattedAddress || "",
    phone,
    website,
    mapsUrl: place.googleMapsUri || "",
    rating,
    reviewCount,
    city,
    sourceQuery,
    leadScore: scoreLead({ website, rating, reviewCount, phone, vertical }),
    recommendedOffer: vertical.offer,
    outreachStatus,
    nextActionAt,
    optOut: false,
  };
}

function scoreLead({ website, rating, reviewCount, phone, vertical }) {
  let score = 30;

  if (!website) score += 30;
  if (website && weakWebsiteSignal(website)) score += 15;
  if (rating >= 4.2 && reviewCount >= 20) score += 15;
  if (reviewCount >= 75) score += 10;
  if (phone) score += 5;
  if (["health", "beauty", "real_estate", "services"].includes(vertical.category)) score += 10;

  return Math.min(score, 100);
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
  const jsonPath = path.join(outputDir, `leads-${stamp}.json`);
  const csvPath = path.join(outputDir, `leads-${stamp}.csv`);

  await fs.writeFile(jsonPath, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
  await fs.writeFile(csvPath, toCsv(leads), "utf8");
}

function toCsv(rows) {
  const headers = [
    "placeId",
    "businessName",
    "category",
    "address",
    "phone",
    "website",
    "mapsUrl",
    "rating",
    "reviewCount",
    "city",
    "sourceQuery",
    "leadScore",
    "recommendedOffer",
    "outreachStatus",
    "nextActionAt",
    "optOut",
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
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
    outreachStatus: parsed.outreachstatus,
    nextActionAt: parsed.nextactionat,
    delayMs: parsed.delayms,
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

function nextActionDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function printDryRun({ cities, verticalKeys, limit, outputDir, outreachStatus, nextActionAt }) {
  const queries = [];
  for (const city of cities) {
    for (const verticalKey of verticalKeys) {
      for (const query of VERTICALS[verticalKey].queries) {
        queries.push(`${query} en ${city}, Colombia`);
      }
    }
  }

  console.log("Dry run: no API calls will be made.");
  console.log(`Cities: ${cities.join(", ")}`);
  console.log(`Verticals: ${verticalKeys.join(", ")}`);
  console.log(`Limit: ${limit}`);
  console.log(`Outreach status: ${outreachStatus}`);
  console.log(`Next action at: ${nextActionAt}`);
  console.log(`Output dir: ${path.resolve(outputDir)}`);
  console.log("Queries:");
  for (const query of queries.slice(0, limit)) {
    console.log(`- ${query}`);
  }
}

function printHelp() {
  console.log(`Usage:
  node prospecting/maps-leads.mjs [options]

Options:
  --cities Bogota,Medellin
  --verticals odontologias,centros_estetica,restaurantes_cafes,inmobiliarias,servicios_tecnicos
  --limit 25
  --output-dir prospecting/output
  --outreach-status new
  --next-action-at 2026-06-19
  --delay-ms 250
  --dry-run
  --help
`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
