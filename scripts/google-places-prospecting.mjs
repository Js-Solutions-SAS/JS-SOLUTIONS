#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.googleMapsUri",
  "places.types",
  "places.primaryTypeDisplayName",
  "nextPageToken",
].join(",");

function parseArgs(argv) {
  const args = {
    query: "",
    city: "",
    vertical: "",
    limit: 40,
    out: "",
    format: "csv",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === "--query") {
      args.query = next || "";
      index += 1;
    } else if (current === "--city") {
      args.city = next || "";
      index += 1;
    } else if (current === "--vertical") {
      args.vertical = next || "";
      index += 1;
    } else if (current === "--limit") {
      args.limit = Number.parseInt(next || "40", 10);
      index += 1;
    } else if (current === "--out") {
      args.out = next || "";
      index += 1;
    } else if (current === "--format") {
      args.format = next || "csv";
      index += 1;
    } else if (current === "--help" || current === "-h") {
      args.help = true;
    }
  }

  return args;
}

function usage() {
  return `
Usage:
  GOOGLE_PLACES_API_KEY=... node scripts/google-places-prospecting.mjs \\
    --vertical restaurantes --city "Cali, Colombia" --query "restaurantes" --limit 40

Options:
  --query       Search query, e.g. "restaurantes", "marmolerias", "tiendas de celulares"
  --city        City or zone context appended to the query
  --vertical    Internal vertical label stored in output rows
  --limit       Max rows to keep after dedupe. Default: 40
  --format      csv or json. Default: csv
  --out         Output path. Default: .artifacts/prospects/<vertical>-<city>-<date>.csv
`;
}

function normalizeSlug(value) {
  return String(value || "prospectos")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeDomain(value) {
  if (!value) return "";

  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

function csvEscape(value) {
  const raw = String(value ?? "");
  if (!/[",\n]/.test(raw)) return raw;
  return `"${raw.replace(/"/g, '""')}"`;
}

function toCsv(rows) {
  const headers = [
    "status",
    "vertical",
    "name",
    "category",
    "address",
    "phone",
    "website",
    "rating",
    "mapsUrl",
    "placeId",
    "types",
  ];

  const lines = rows.map((row) =>
    headers.map((header) => csvEscape(row[header])).join(","),
  );

  return `${headers.join(",")}\n${lines.join("\n")}\n`;
}

async function searchPlaces({ apiKey, textQuery, limit }) {
  const rows = [];
  let pageToken = "";

  while (rows.length < limit) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery,
        pageSize: Math.min(20, Math.max(1, limit - rows.length)),
        ...(pageToken ? { pageToken } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Google Places error ${response.status}: ${detail}`);
    }

    const payload = await response.json();
    rows.push(...(payload.places || []));

    pageToken = payload.nextPageToken || "";
    if (!pageToken) break;
  }

  return rows.slice(0, limit);
}

function mapPlace(place, vertical) {
  const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || "";
  const category =
    place.primaryTypeDisplayName?.text ||
    place.types?.[0] ||
    "";

  return {
    status: "nuevo",
    vertical,
    name: place.displayName?.text || "",
    category,
    address: place.formattedAddress || "",
    phone,
    website: place.websiteUri || "",
    rating: place.rating || "",
    mapsUrl: place.googleMapsUri || "",
    placeId: place.id || "",
    types: Array.isArray(place.types) ? place.types.join("|") : "",
    _dedupeKey: [
      place.id || "",
      normalizeDomain(place.websiteUri),
      normalizePhone(phone),
    ]
      .filter(Boolean)
      .join("::"),
  };
}

function dedupeRows(rows) {
  const seen = new Set();
  const deduped = [];

  for (const row of rows) {
    const key = row._dedupeKey || `${row.name}::${row.address}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const { _dedupeKey, ...publicRow } = row;
    deduped.push(publicRow);
  }

  return deduped;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage());
    return;
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is required.");
  }

  if (!args.query || !args.city || !args.vertical) {
    throw new Error("--query, --city and --vertical are required.\n" + usage());
  }

  const textQuery = `${args.query} en ${args.city}`;
  const rawPlaces = await searchPlaces({
    apiKey,
    textQuery,
    limit: args.limit,
  });
  const rows = dedupeRows(rawPlaces.map((place) => mapPlace(place, args.vertical)));

  const date = new Date().toISOString().slice(0, 10);
  const defaultOut = path.join(
    ".artifacts",
    "prospects",
    `${normalizeSlug(args.vertical)}-${normalizeSlug(args.city)}-${date}.${args.format}`,
  );
  const outPath = path.resolve(args.out || defaultOut);

  await mkdir(path.dirname(outPath), { recursive: true });

  if (args.format === "json") {
    await writeFile(outPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  } else {
    await writeFile(outPath, toCsv(rows), "utf8");
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        query: textQuery,
        count: rows.length,
        outPath,
      },
      null,
      2,
    ) + "\n",
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
