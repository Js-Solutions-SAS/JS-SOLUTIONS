# Estructura del Sistema de Gestión en Google Sheets (JS Solutions)

Para que el modelo y automatización de n8n funcionen correctamente, es necesario contar con un archivo de Google Sheets configurado estratégicamente.

A continuación se detalla la estructura exacta que debes configurar como **cabeceras (Fila 1)** en cada pestaña de tu documento. Adicionalmente, ten en cuenta renombrar correctamente cada hoja internamente.

---

## Pestaña: CRM Clientes

Registra la información de contacto de cada cliente nuevo de manera inicial (ingresan cuando se recibe el webhook de venta o un primer pago).

| Columna | Nombre de Cabecera | Tipo de Dato Recomendado |
| ------- | ------------------ | ------------------------ |
| A       | ID Cliente         | String (Ej. Email)       |
| B       | Nombre             | String                   |
| C       | Email              | Email                    |
| D       | Empresa            | String                   |
| E       | Tipo de Servicio   | Menú Desplegable         |
| F       | URL Carpeta        | URL (Drive Link)         |
| G       | Fecha Creación     | Fecha + Hora             |

---

## Pestaña: Proyectos

Cada nuevo cliente deriva automáticamente la creación de un proyecto en el sistema.

| Columna | Nombre de Cabecera | Tipo de Dato Recomendado                         |
| ------- | ------------------ | ------------------------------------------------ |
| A       | ID Proyecto        | String (Ej. NombreEmpresa-01)                    |
| B       | Nombre Proyecto    | String                                           |
| C       | Estado             | Menú Desplegable (Iniciado, Progreso, Terminado) |
| D       | Tipo de Servicio   | Menú Desplegable                                 |
| E       | Empresa Cliente    | String                                           |
| F       | Link Carpeta Drive | URL                                              |
| G       | Link Brief         | URL (Google Docs Link)                           |

---

## Pestaña: Tareas

Las tareas estándar (Procedimiento Estándar de Trabajo - SOP) se generan automáticamente como nuevas filas según el "Tipo de Servicio" que seleccionó el cliente en su ingreso (3 filas para cada proyecto nuevo, estandarizadas).

| Columna | Nombre de Cabecera | Tipo de Dato Recomendado                               |
| ------- | ------------------ | ------------------------------------------------------ |
| A       | ID Tarea           | String                                                 |
| B       | Proyecto           | String                                                 |
| C       | Nombre Tarea       | String                                                 |
| D       | Estado             | Menú Desplegable (Pendiente, En curso, QA, Finalizado) |
| E       | Responsable        | Asignado al equipo correspondiente (String o Menú)     |
| F       | Fecha Límite       | Fecha (Calculada por días post-compra)                 |

---

### Instrucciones de implementación para n8n:

1. Crea tu archivo Base en Google Sheets e incluye las Pestañas y Columnas indicadas.
2. Copia el ID del documento, encuéntralo en la URL `(https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit)`.
3. Importa el archivo `n8n_sheets_onboarding.json` en n8n.
4. Sustituye las variables locales `ID_DE_TU_GOOGLE_SHEETS_AQUI` y las variables referentes al Brief `ID_DE_TU_PLANTILLA_DOCS_AQUI` por los de tus cuentas e integra las credenciales de Google Workspace.
