# Tareas Pendientes (TODO) - Módulo de Cotizaciones y Contratos

Este documento contiene los pasos restantes para que el flujo completo de "Cotizaciones -> n8n -> Contratos" funcione de manera integral.

## 1. Configuración de Variables de Entorno en Next.js (`admin`)

Debes conectar tu panel administrativo con los webhooks que recibirán y enviarán los datos a n8n.

- [ ] Crea un archivo llamado `.env.local` en la raíz de la carpeta `admin` (si aún no existe).
- [ ] Asegúrate de que este archivo figure dentro de tu `.gitignore` para no subirlo al repositorio.
- [ ] Agrega las siguientes variables de entorno:

```env
# URL para cargar la lista de cotizaciones en la tabla
# (Debería ser un webhook GET en n8n que busque en Google Sheets)
N8N_GET_QUOTES_URL="REEMPLAZAR_POR_TU_WEBHOOK_GET_DE_N8N"

# URL para generar el contrato desde la tabla
# (Debería ser el webhook POST del workflow que te entregué)
N8N_GENERATE_CONTRACT_URL="REEMPLAZAR_POR_TU_WEBHOOK_POST_DE_N8N"
```

## 2. Importación y Configuración del Workflow en n8n

El flujo lógico del backend para crear el contrato está documentado en un JSON, listos para importarse a n8n.

- [ ] Abre tu panel de n8n.
- [ ] Crea un nuevo Workflow.
- [ ] Selecciona la opción **Import from File**.
- [ ] Sube el archivo `n8n_contract_generator.json` que dejé en la raíz de esta carpeta `admin`.
- [ ] Dentro de n8n, abre el nodo llamado **"Buscar en Google Sheets"** y conecta tu credencial de Google.
- [ ] En ese mismo nodo, pega la URL exacta o selecciona tu archivo y hoja ("Cotizaciones") de Google Sheets.
- [ ] Abre el nodo **"Google Docs (Duplicar y Rellenar)"** y selecciona la plantilla base del contrato. Asegúrate de que las variables (ej. `{{Nombre_Empresa}}`) estén en el documento base.
- [ ] Abre el nodo **"Activar Fila en Google Sheets"** (el último) y asegúrate nuevamente de tener seleccionada la hoja correcta para poder actualizar el "Estado" a "Contrato Enviado".
- [ ] Guarda el workflow y actívalo cambiando el switch superior derecho a **"Active"**.
- [ ] En el nodo de "Webhook (Trigger)", **copia la Test URL o Production URL** y pégala en el archivo `.env.local` de Next.js bajo `N8N_GENERATE_CONTRACT_URL`.

## 3. Crear el Workflow para `N8N_GET_QUOTES_URL` (Opcional, pero necesario para la data real)

La tabla de Next.js (`GET`) actualmente usa Mock Data de respaldo si no hay URL. Para enganchar la tabla a respuestas reales de n8n:

- [ ] Crea otro Workflow en n8n.
- [ ] Agrega un Webhook (Trigger) configurado en método `GET`.
- [ ] Agrega un nodo de Google Sheets y lee todas las filas de la sheet "Cotizaciones".
- [ ] Agrega un nodo **Respond to Webhook** que envíe la salida de Google Sheets con este formato JSON para que el frontend lo entienda:
  ```json
  [
    {
      "id": "1",
      "nombre": "Nombre del cliente",
      "empresa": "Su empresa",
      "servicio": "Servicio elegido",
      "monto": "$100 USD",
      "estado": "Pendiente"
    }
  ]
  ```
- [ ] Copia la URL de este webhook y pégala en `N8N_GET_QUOTES_URL`.

## 4. Pruebas Finales

- [ ] Inicia o reinicia el servidor de desarrollo (`npm run dev` en la capeta `admin`).
- [ ] Ingresa a `http://localhost:3000/cotizaciones`.
- [ ] Verifica que los datos reales de la hoja aparezcan en la tabla.
- [ ] Presiona "Generar Contrato".
- [ ] Verifica tu correo electrónico, tu Google Docs y/o Google Sheets para confirmar que el contrato modificado se ha generado.
