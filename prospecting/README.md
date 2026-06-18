# JS Solutions Prospecting

Cliente de prospeccion para PyMES locales usando **Google Maps Places API (New)**. No scrapea HTML de Google Search.

## Variables

```bash
export GOOGLE_MAPS_API_KEY="..."
export PROSPECTING_OUTPUT_DIR="prospecting/output"
```

## Uso recomendado

Dry run sin llamadas API:

```bash
node prospecting/maps-leads.mjs --dry-run --cities Bogota --verticals odontologias --limit 25
```

Consulta real:

```bash
node prospecting/maps-leads.mjs --cities Bogota,Medellin,Cali --verticals odontologias,centros_estetica,restaurantes_cafes,inmobiliarias,servicios_tecnicos --limit 25
```

Salida:

- `prospecting/output/leads-YYYY-MM-DD.csv`
- `prospecting/output/leads-YYYY-MM-DD.json`

## Campos

`placeId`, `businessName`, `category`, `address`, `phone`, `website`, `mapsUrl`, `rating`, `reviewCount`, `city`, `sourceQuery`, `leadScore`, `recommendedOffer`, `outreachStatus`, `nextActionAt`, `optOut`.

## Cumplimiento

- Usar Places API con `FieldMask` para limitar costo y datos.
- No guardar datos privados.
- No usar scraping HTML de Google Search ni Maps.
- Respetar opt-out en contacto outbound.
- Si se muestra data de Maps en una interfaz, incluir atribucion requerida por Google.
