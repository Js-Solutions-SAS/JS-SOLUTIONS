# n8n Workflows For VPS

Estos workflows estan alineados con el contrato real del codigo actual y cubren el flujo completo `Brief_Token -> brief -> cotización -> aprobación en portal -> contrato`.

- `admin` envia `leadId` y opcionalmente `email` para solicitar brief y generar contrato.
- `admin` tambien envia `leadId`, `clientToken`, `transcripcion` y `feedback` a `cotizador_js_solutions` para generar/re-generar la cotización.
- `portal` envia `token` y `technicalBrief` (o `answers`, si luego cambias el frontend), consulta estado con `clientToken` y aprueba cotización con `resourceType: "quote"`.

## Archivos para importar

- `workflows/js-solutions-request-brief.json`
- `workflows/js-solutions-submit-brief.json`
- `workflows/js-solutions-generate-contract.json`
- `workflows/js-solutions-create-quote.json`
- `workflows/js-solutions-get-quotes.json`
- `workflows/js-solutions-generate-quote.json`
- `workflows/js-solutions-project-status.json`
- `workflows/js-solutions-portal-approval.json`
- `workflows/js-solutions-signature-callback-docusign.json`
- `workflows/js-solutions-payments-create.json`
- `workflows/js-solutions-payments-callback-bancolombia.json`

## Importacion en la VPS

1. Entra a n8n en tu VPS.
2. Crea un workflow nuevo.
3. Usa `Import from file`.
4. Importa cada JSON de `n8n/workflows/`.
5. Configura credenciales de Google Sheets y Gmail.
6. Reemplaza los placeholders:
   - `https://portal.jssolutions.com.co`
   - `URL_A_TU_GOOGLE_SHEET`
   - columnas reales de tu hoja
7. Activa cada workflow.
8. Copia la Production URL del Webhook y pegala en los `.env.local`.

## Variables de entorno del repo

En `admin/.env.local`:

```env
N8N_GET_QUOTES_URL=https://tu-n8n/webhook/js-solutions/get-quotes
N8N_CREATE_QUOTE_URL=https://tu-n8n/webhook/js-solutions/create-quote
N8N_REQUEST_BRIEF_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/request-brief
N8N_GENERATE_QUOTE_URL=https://tu-n8n/webhook/cotizador_js_solutions
N8N_GENERATE_CONTRACT_URL=https://tu-n8n/webhook/js-solutions/generate-contract
```

En `portal/.env.local`:

```env
N8N_WEBHOOK_URL=https://tu-n8n/webhook/project-status
N8N_APPROVAL_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/portal-approval
N8N_SUBMIT_BRIEF_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/submit-brief
N8N_PAYMENTS_CREATE_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/payments/create
N8N_SECRET_TOKEN=tu_token_bearer_opcional
N8N_REQUEST_TIMEOUT_MS=15000
```

## Notas de adaptacion

- Los nodos de Google Sheets vienen como plantilla. Debes seleccionar la credencial y el documento real despues de importar.
- El workflow `get-quotes` lee la hoja completa y devuelve `{ quotes: [...] }` con los campos que ya consume la UI del admin.
- El workflow `create-quote` genera `leadId`, `Brief_Token` y `Brief_URL` desde el primer registro para que el admin pueda ver el enlace del brief incluso antes de enviarlo por correo.
- `request-brief` ya no debe regenerar el token si la fila ya tiene `Brief_Token`; reusa el mismo link y actualiza `Client_Dashboard_URL`.
- `generate-quote` mantiene compatibilidad con el payload viejo del cotizador de `landing` (`id`, `datos_cliente`, `pdfUrl`) y, cuando recibe `leadId` + `clientToken`, sincroniza la cotización en Google Sheets y la expone al portal.
- `project-status` busca por `Brief_Token` y devuelve la cotización tanto como bloque destacado (`quote`) como dentro de `documents`.
- `portal-approval` reutiliza el mismo endpoint para `deliverable` y `quote`; cuando `resourceType = "quote"` actualiza `Quote_Status`, `Quote_Approved_At` y `estado = Firmado`.
- El workflow de contrato deja una URL de contrato de ejemplo para que el Admin reciba `success` y `contractUrl`. Si luego conectas Google Docs, DocuSign o un servicio PDF, solo reemplaza el nodo de preparacion del contrato.
- Si quieres notificaciones a Slack/Teams, puedes agregar un `HTTP Request` despues del update del brief completado.
- Para Postgres VPS usa `n8n/sql/js_solutions_postgres_schema.sql` como base del modelo operacional y reemplaza gradualmente los nodos Google Sheets en los workflows críticos.
