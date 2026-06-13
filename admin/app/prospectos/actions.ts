"use server";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
}

const DB_DIR = path.resolve(process.cwd(), "../.artifacts/prospects");
const DB_FILE = path.join(DB_DIR, "prospects-db.json");

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
  return ensureDbExists();
}

export async function updateProspectStatus(placeId: string, status: string): Promise<boolean> {
  const prospects = await ensureDbExists();
  const index = prospects.findIndex((p) => p.placeId === placeId);
  if (index === -1) return false;

  prospects[index].status = status;
  await writeFile(DB_FILE, JSON.stringify(prospects, null, 2), "utf8");
  return true;
}

export async function updateProspectNotes(placeId: string, notes: string): Promise<boolean> {
  const prospects = await ensureDbExists();
  const index = prospects.findIndex((p) => p.placeId === placeId);
  if (index === -1) return false;

  prospects[index].notes = notes;
  await writeFile(DB_FILE, JSON.stringify(prospects, null, 2), "utf8");
  return true;
}

export async function searchAndImportProspects(
  vertical: string,
  city: string,
  query: string,
  limit: number = 20,
): Promise<{ success: boolean; count: number; message?: string }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      count: 0,
      message: "No se encuentra configurada la variable GOOGLE_PLACES_API_KEY en el servidor.",
    };
  }

  try {
    const textQuery = `${query} en ${city}`;
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
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
        ].join(","),
      },
      body: JSON.stringify({
        textQuery,
        pageSize: Math.min(20, Math.max(1, limit)),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        count: 0,
        message: `Google Places API respondió con error ${response.status}: ${errText}`,
      };
    }

    const payload = await response.json();
    const places = payload.places || [];

    const existingProspects = await ensureDbExists();
    let importedCount = 0;

    for (const place of places) {
      const placeId = place.id || "";
      if (existingProspects.some((p) => p.placeId === placeId)) {
        continue; // Deduplicate
      }

      const phone = place.internationalPhoneNumber || place.nationalPhoneNumber || "";
      const category = place.primaryTypeDisplayName?.text || place.types?.[0] || "";

      const newProspect: Prospect = {
        status: "nuevo",
        vertical,
        name: place.displayName?.text || "",
        category,
        address: place.formattedAddress || "",
        phone,
        website: place.websiteUri || "",
        rating: place.rating || "",
        mapsUrl: place.googleMapsUri || "",
        placeId,
        types: Array.isArray(place.types) ? place.types.join("|") : "",
        notes: "",
      };

      existingProspects.push(newProspect);
      importedCount++;
    }

    if (importedCount > 0) {
      await writeFile(DB_FILE, JSON.stringify(existingProspects, null, 2), "utf8");
    }

    return {
      success: true,
      count: importedCount,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
