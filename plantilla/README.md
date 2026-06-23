# Plantilla base de landings economicas

Sistema para generar landings Astro estaticas, rapidas y data-driven para negocios locales.

## Estructura

```txt
plantilla/
  template/              # Astro base reutilizable
  clients/{slug}/        # Configuracion editable por cliente
  scripts/create-client.mjs
  sites/{slug}/          # Sitios generados listos para Vercel
```

## Crear una landing

```bash
cd plantilla
npm run create:client -- --slug clinica-sonrisa --config clients/clinica-sonrisa/client.json
```

Para regenerar:

```bash
npm run create:client -- --slug clinica-sonrisa --config clients/clinica-sonrisa/client.json --force
```

## Validar sin generar

```bash
npm run validate:client -- --slug clinica-sonrisa --config clients/clinica-sonrisa/client.json
```

## Probar el sitio generado

```bash
cd sites/clinica-sonrisa
npm install
npm run build
npm run check:seo
npm run dev
```

## Que se cambia por cliente

- `clients/{slug}/client.json`: negocio, SEO, marca, servicios, FAQs y mensaje de WhatsApp.
- `brand.colors`: colores base de la marca.
- `seo.siteUrl`: dominio final para canonical, sitemap, OG image y robots.
- `content.whatsappMessage`: mensaje prellenado para conversion.

## Alcance v1

- Landing estatica Astro.
- WhatsApp como canal principal.
- SEO tecnico base: title, description, canonical, sitemap, robots, Open Graph, Twitter Card y JSON-LD.
- Favicon, logo y OG image generados desde config.
- Sin backend, cotizador, pagos ni CRM.

## Deploy recomendado

Cada cliente debe tener un proyecto Vercel propio usando como root directory `plantilla/sites/{slug}`.
