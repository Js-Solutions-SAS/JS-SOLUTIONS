# Prospecting Run - Cali, Medellin, Pereira

Fecha: 2026-06-18

Fuente: OpenStreetMap / Overpass via `prospecting/osm-leads.mjs`

Comando:

```bash
node prospecting/osm-leads.mjs --cities Cali,Medellin,Pereira --verticals odontologias,oftalmologicas,centros_estetica,inmobiliarias,servicios_tecnicos,gimnasios,veterinarias,abogados --limit 0
```

## Resultado

- Total leads: 602
- Unicos por `osmType/osmId`: 602
- Campos requeridos completos: si
- Archivo local JSON: `prospecting/output/osm-leads-2026-06-18.json`
- Archivo local CSV: `prospecting/output/osm-leads-2026-06-18.csv`

## Por ciudad

| Ciudad | Leads |
| --- | ---: |
| Medellin | 294 |
| Cali | 179 |
| Pereira | 129 |

## Por vertical

| Vertical | Leads |
| --- | ---: |
| Gimnasios y centros fitness | 275 |
| Centros de estetica | 93 |
| Odontologias | 74 |
| Veterinarias | 72 |
| Oftalmologicas y opticas | 63 |
| Inmobiliarias | 13 |
| Abogados | 8 |
| Servicios tecnicos | 4 |

## Lectura comercial

- Mejor volumen inmediato: gimnasios/fitness, centros de estetica, odontologias, veterinarias y opticas.
- Mejor fit para landing rapida: odontologias, oftalmologicas/opticas, estetica, gimnasios y veterinarias.
- Mejor criterio de priorizacion: leads con telefono/email y sin website, porque tienen contacto publico y una brecha digital clara.
- Servicios tecnicos e inmobiliarias devolvieron bajo volumen con los tags actuales; requieren ampliar criterios por nombre, directorios sectoriales u otra fuente complementaria.

## Siguiente accion

1. Tomar los primeros 50 leads con score alto.
2. Revisar manualmente presencia actual: website, Instagram, WhatsApp y claridad de CTA.
3. Preparar mensaje personalizado por vertical usando `sales-assets/cold-outreach-playbook.md`.
4. Registrar opt-out y estado de contacto antes de cualquier seguimiento.
