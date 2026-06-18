# JS Solutions Prospecting

Clientes de prospeccion para PyMES locales.

- `osm-leads.mjs`: fuente principal sin tarjeta, usando OpenStreetMap Overpass API.
- `maps-leads.mjs`: fuente opcional usando Google Maps Places API cuando exista billing activo.

No scrapean HTML de Google Search ni Google Maps.

## Variables

```bash
export GOOGLE_MAPS_API_KEY="..."
export PROSPECTING_OUTPUT_DIR="prospecting/output"
export OVERPASS_ENDPOINT="https://overpass-api.de/api/interpreter"
```

## Uso recomendado

### OpenStreetMap / Overpass (recomendado sin tarjeta)

```bash
node prospecting/osm-leads.mjs --dry-run --cities Cali,Medellin,Pereira --verticals odontologias,oftalmologicas --limit 0
```

Consulta real pequena:

```bash
node prospecting/osm-leads.mjs --cities Cali,Medellin,Pereira --verticals odontologias,oftalmologicas,centros_estetica,inmobiliarias,servicios_tecnicos,gimnasios,veterinarias,abogados --limit 0
```

Salida:

- `prospecting/output/osm-leads-YYYY-MM-DD.csv`
- `prospecting/output/osm-leads-YYYY-MM-DD.json`

### Google Places opcional

Solo usar si Google Cloud acepta billing.

```bash
node prospecting/maps-leads.mjs --cities Bogota,Medellin,Cali --verticals odontologias,centros_estetica,restaurantes_cafes,inmobiliarias,servicios_tecnicos --limit 25
```

- `prospecting/output/leads-YYYY-MM-DD.csv`
- `prospecting/output/leads-YYYY-MM-DD.json`

## Campos

OSM:

`osmId`, `osmType`, `businessName`, `category`, `address`, `phone`, `website`, `email`, `lat`, `lon`, `city`, `sourceQuery`, `leadScore`, `recommendedOffer`, `outreachStatus`, `nextActionAt`, `optOut`.

`--limit 0` o `--limit all` significa sin tope interno; el limite real sera lo que devuelva Overpass para las ciudades y verticales seleccionadas.

Google Places:

`placeId`, `businessName`, `category`, `address`, `phone`, `website`, `mapsUrl`, `rating`, `reviewCount`, `city`, `sourceQuery`, `leadScore`, `recommendedOffer`, `outreachStatus`, `nextActionAt`, `optOut`.

## Cumplimiento

- Usar Overpass con volumen moderado, limites bajos y cache/export local.
- Usar Places API con `FieldMask` para limitar costo y datos.
- No guardar datos privados.
- No usar scraping HTML de Google Search ni Maps.
- Respetar opt-out en contacto outbound.
- Si se muestra data de Maps en una interfaz, incluir atribucion requerida por Google.
