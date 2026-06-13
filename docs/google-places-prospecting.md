# Prospeccion con Google Places API

Este flujo sirve para mapear negocios locales por rubro y zona sin hacer scraping.
Usa Places API Text Search (New), que segun la documentacion oficial de Google usa
`POST https://places.googleapis.com/v1/places:searchText` con `textQuery` y
`X-Goog-FieldMask` para controlar los campos devueltos.

## Variables

```bash
export GOOGLE_PLACES_API_KEY="tu_api_key"
```

La llave debe tener Places API habilitada en Google Cloud.

## Ejemplos

```bash
node scripts/google-places-prospecting.mjs \
  --vertical restaurantes \
  --city "Cali, Colombia" \
  --query "restaurantes" \
  --limit 40
```

```bash
node scripts/google-places-prospecting.mjs \
  --vertical marmolerias \
  --city "Palmira, Colombia" \
  --query "marmolerias mesones cocina" \
  --format json \
  --limit 30
```

Por defecto escribe en:

```text
.artifacts/prospects/<vertical>-<ciudad>-<fecha>.csv
```

## Columnas

- `status`: inicia en `nuevo`.
- `vertical`: rubro interno usado para segmentar.
- `name`: nombre del negocio.
- `category`: categoria principal cuando Google la entrega.
- `address`: direccion formateada.
- `phone`: telefono si existe.
- `website`: sitio web si existe.
- `rating`: calificacion publica.
- `mapsUrl`: URL de Google Maps.
- `placeId`: identificador de Google Places.
- `types`: tipos devueltos por Places.

## Estados comerciales

El archivo no envia mensajes automaticamente. El contacto debe ser manual o asistido.

- `nuevo`
- `contactado`
- `interesado`
- `descartado`

## Dedupe

El script deduplica por:

1. `placeId`
2. dominio del website
3. telefono normalizado

Si Google no entrega esos campos, usa nombre + direccion como fallback.

## Siguiente paso

Cuando el flujo ya produzca oportunidades utiles, mover estos registros a una
vista del `admin` con filtros por vertical, ciudad, estado y fuente.
