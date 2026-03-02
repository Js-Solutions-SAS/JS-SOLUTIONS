# n8n Workflows For VPS

Estos workflows estan alineados con el contrato real del codigo actual:

- `admin` envia `leadId` y opcionalmente `email` para solicitar brief y generar contrato.
- `portal` envia `token` y `technicalBrief` (o `answers`, si luego cambias el frontend).

## Archivos para importar

- `workflows/js-solutions-request-brief.json`
- `workflows/js-solutions-submit-brief.json`
- `workflows/js-solutions-generate-contract.json`
- `workflows/js-solutions-create-quote.json`

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
N8N_CREATE_QUOTE_URL=https://tu-n8n/webhook/js-solutions/create-quote
N8N_REQUEST_BRIEF_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/request-brief
N8N_GENERATE_CONTRACT_URL=https://tu-n8n/webhook/js-solutions/generate-contract
```

En `portal/.env.local`:

```env
N8N_SUBMIT_BRIEF_WEBHOOK_URL=https://tu-n8n/webhook/js-solutions/submit-brief
```

## Notas de adaptacion

- Los nodos de Google Sheets vienen como plantilla. Debes seleccionar la credencial y el documento real despues de importar.
- El workflow `create-quote` genera `leadId`, `Brief_Token` y `Brief_URL` desde el primer registro para que el admin pueda ver el enlace del brief incluso antes de enviarlo por correo.
- El workflow de contrato deja una URL de contrato de ejemplo para que el Admin reciba `success` y `contractUrl`. Si luego conectas Google Docs, DocuSign o un servicio PDF, solo reemplaza el nodo de preparacion del contrato.
- Si quieres notificaciones a Slack/Teams, puedes agregar un `HTTP Request` despues del update del brief completado.
