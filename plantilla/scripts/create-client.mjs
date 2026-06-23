import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const templateDir = path.join(rootDir, "template");
const sitesDir = path.join(rootDir, "sites");

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  printHelp();
  process.exit(0);
}

const slug = sanitizeSlug(args.slug || "");
if (!slug) fail("Debes enviar --slug nombre-del-cliente");

const configPath = path.resolve(
  process.cwd(),
  args.config || `clients/${slug}/client.json`,
);
const targetDir = path.join(sitesDir, slug);
const client = JSON.parse(await readFile(configPath, "utf8"));
validateClientConfig(client);

if (args.dryRun) {
  console.log(`Config valida: ${configPath}`);
  console.log(`Sitio destino: ${targetDir}`);
  process.exit(0);
}

await ensureTemplateExists();
await prepareTarget(targetDir, Boolean(args.force));
await cp(templateDir, targetDir, {
  recursive: true,
  filter: (src) => {
    const ignored = ["/node_modules", "/dist", "/.astro", "/.vercel"].some((part) =>
      src.includes(part),
    );
    return !ignored;
  },
});

await writeGeneratedConfig(targetDir, client);
await replaceSiteTokens(targetDir, client.seo.siteUrl);
await writeGeneratedAssets(targetDir, client);
await writeClientReadme(targetDir, client);

console.log(`Landing generada en ${path.relative(rootDir, targetDir)}`);
console.log("Siguiente paso:");
console.log(`  cd ${path.relative(process.cwd(), targetDir)}`);
console.log("  npm install");
console.log("  npm run build && npm run check:seo");

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const [rawKey, inlineValue] = arg.slice(2).split("=");
    const key = rawKey.replaceAll("-", "");
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return {
    slug: parsed.slug,
    config: parsed.config,
    dryRun: Boolean(parsed.dryrun),
    force: Boolean(parsed.force),
    help: Boolean(parsed.help),
    h: Boolean(parsed.h),
  };
}

function sanitizeSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateClientConfig(client) {
  requireObject(client, "client");
  requireObject(client.business, "business");
  requireObject(client.brand, "brand");
  requireObject(client.brand.colors, "brand.colors");
  requireObject(client.seo, "seo");
  requireObject(client.content, "content");
  requireObject(client.content.hero, "content.hero");
  requireObject(client.content.trust, "content.trust");
  requireObject(client.content.finalCta, "content.finalCta");

  [
    "business.name",
    "business.type",
    "business.city",
    "business.country",
    "business.address",
    "business.phone",
    "business.whatsapp",
    "business.hours",
    "brand.logoText",
    "brand.logoAlt",
    "seo.siteUrl",
    "seo.title",
    "seo.description",
    "seo.schemaType",
    "content.hero.headline",
    "content.hero.subheadline",
    "content.hero.primaryCta",
    "content.hero.secondaryCta",
    "content.finalCta.title",
    "content.finalCta.body",
    "content.finalCta.button",
    "content.whatsappMessage",
  ].forEach((field) => requireString(getPath(client, field), field));

  ["primary", "secondary", "accent", "background", "text"].forEach((color) => {
    const value = client.brand.colors[color];
    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
      fail(`brand.colors.${color} debe ser HEX de 6 digitos. Valor: ${value}`);
    }
  });

  try {
    new URL(client.seo.siteUrl);
  } catch {
    fail("seo.siteUrl debe ser una URL absoluta.");
  }

  requireStringArray(client.seo.keywords, "seo.keywords", 3);
  requireStringArray(client.content.painPoints, "content.painPoints", 3);
  requireStringArray(client.content.trust.items, "content.trust.items", 3);
  requireArray(client.content.services, "content.services", 3);
  requireArray(client.content.faq, "content.faq", 3);

  client.content.services.forEach((service, index) => {
    requireString(service.name, `content.services[${index}].name`);
    requireString(service.description, `content.services[${index}].description`);
  });

  client.content.faq.forEach((item, index) => {
    requireString(item.question, `content.faq[${index}].question`);
    requireString(item.answer, `content.faq[${index}].answer`);
  });
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} debe ser un objeto.`);
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim().length < 2) {
    fail(`${label} debe ser texto no vacio.`);
  }
}

function requireArray(value, label, minLength) {
  if (!Array.isArray(value) || value.length < minLength) {
    fail(`${label} debe tener al menos ${minLength} elementos.`);
  }
}

function requireStringArray(value, label, minLength) {
  requireArray(value, label, minLength);
  value.forEach((item, index) => requireString(item, `${label}[${index}]`));
}

function getPath(object, field) {
  return field.split(".").reduce((value, key) => value?.[key], object);
}

async function ensureTemplateExists() {
  try {
    const stats = await stat(templateDir);
    if (!stats.isDirectory()) throw new Error("template no es carpeta");
  } catch {
    fail(`No existe template en ${templateDir}`);
  }
}

async function prepareTarget(target, force) {
  try {
    await stat(target);
    if (!force) {
      fail(`Ya existe ${target}. Usa --force para regenerarlo.`);
    }
    await rm(target, { recursive: true, force: true });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  await mkdir(target, { recursive: true });
}

async function writeGeneratedConfig(target, client) {
  const configFile = path.join(target, "src/data/client.config.ts");
  const serialized = JSON.stringify(client, null, 2);
  await writeFile(
    configFile,
    `import type { ClientConfig } from "../lib/types";\n\nexport const client = ${serialized} satisfies ClientConfig;\n\nexport default client;\n`,
    "utf8",
  );
}

async function replaceSiteTokens(target, siteUrl) {
  const normalized = siteUrl.replace(/\/$/, "");
  const files = [
    path.join(target, "astro.config.mjs"),
    path.join(target, "public/robots.txt"),
  ];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    await writeFile(file, content.replaceAll("%%SITE_URL%%", normalized), "utf8");
  }
}

async function writeGeneratedAssets(target, client) {
  const logoSvg = createLogoSvg(client, 96);
  const faviconSvg = createLogoSvg(client, 64);
  const heroSvg = createHeroSvg(client);
  const ogSvg = createOgSvg(client);

  await writeFile(path.join(target, "src/assets/logo.svg"), logoSvg, "utf8");
  await writeFile(path.join(target, "src/assets/hero.svg"), heroSvg, "utf8");
  await writeFile(path.join(target, "public/favicon.svg"), faviconSvg, "utf8");
  await writeFile(path.join(target, "public/og-image.svg"), ogSvg, "utf8");
}

function createLogoSvg(client, size) {
  const initials = escapeXml(client.brand.logoText.slice(0, 4).toUpperCase());
  const fontSize = initials.length > 2 ? Math.round(size * 0.29) : Math.round(size * 0.38);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.24)}" fill="${client.brand.colors.primary}"/>
  <text x="${size / 2}" y="${Math.round(size * 0.62)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="#fff">${initials}</text>
</svg>
`;
}

function createHeroSvg(client) {
  const primary = client.brand.colors.primary;
  const secondary = client.brand.colors.secondary;
  const accent = client.brand.colors.accent;
  const name = escapeXml(client.business.name);
  const type = escapeXml(`${client.business.type} en ${client.business.city}`);
  const serviceA = escapeXml(client.content.services[0]?.name || "Servicio principal");
  const serviceB = escapeXml(client.content.services[1]?.name || "Atencion local");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="520" viewBox="0 0 720 520">
  <rect width="720" height="520" rx="36" fill="#fff"/>
  <rect x="44" y="44" width="632" height="432" rx="30" fill="${secondary}"/>
  <circle cx="558" cy="135" r="132" fill="${primary}" opacity=".45"/>
  <circle cx="158" cy="382" r="96" fill="${accent}" opacity=".35"/>
  <rect x="86" y="92" width="92" height="92" rx="24" fill="${primary}"/>
  <text x="132" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#fff">${escapeXml(client.brand.logoText.slice(0, 3).toUpperCase())}</text>
  <text x="202" y="122" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="#fff">${name}</text>
  <text x="202" y="154" font-family="Arial, sans-serif" font-size="18" fill="#fff" opacity=".72">${type}</text>
  <rect x="86" y="226" width="500" height="52" rx="18" fill="#fff" opacity=".12"/>
  <text x="116" y="260" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="#fff">${serviceA}</text>
  <rect x="86" y="302" width="430" height="52" rx="18" fill="#fff" opacity=".1"/>
  <text x="116" y="336" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="#fff">${serviceB}</text>
  <rect x="86" y="392" width="210" height="58" rx="29" fill="${primary}"/>
  <text x="191" y="429" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="#fff">WhatsApp</text>
</svg>
`;
}

function createOgSvg(client) {
  const siteText = escapeXml(client.business.name);
  const subtitle = escapeXml(`${client.business.type} en ${client.business.city}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${client.brand.colors.background}"/>
  <rect x="70" y="70" width="1060" height="490" rx="42" fill="${client.brand.colors.secondary}"/>
  <circle cx="965" cy="155" r="160" fill="${client.brand.colors.primary}" opacity=".35"/>
  <circle cx="170" cy="500" r="130" fill="${client.brand.colors.accent}" opacity=".25"/>
  <text x="120" y="255" font-family="Arial, sans-serif" font-size="74" font-weight="900" fill="#fff">${siteText}</text>
  <text x="122" y="335" font-family="Arial, sans-serif" font-size="36" fill="#D8DEE9">${subtitle}</text>
  <rect x="120" y="410" width="320" height="70" rx="35" fill="${client.brand.colors.primary}"/>
  <text x="280" y="456" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#fff">Contactar por WhatsApp</text>
</svg>
`;
}

async function writeClientReadme(target, client) {
  const content = `# ${client.business.name}

Landing Astro generada por JS Solutions.

## Comandos

\`\`\`bash
npm install
npm run build
npm run check:seo
npm run dev
\`\`\`

## Deploy en Vercel

- Framework preset: Astro.
- Root directory: esta carpeta.
- Build command: \`npm run build\`.
- Output directory: \`dist\`.
- Dominio configurado en SEO: ${client.seo.siteUrl}

## Edicion rapida

- Datos y SEO: \`src/data/client.config.ts\`.
- Marca generada: \`src/assets/logo.svg\`, \`public/favicon.svg\`, \`public/og-image.svg\`.
- Verificacion minima: \`npm run build && npm run check:seo\`.
`;
  await writeFile(path.join(target, "README.md"), content, "utf8");
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function printHelp() {
  console.log(`Uso:
  npm run create:client -- --slug clinica-sonrisa --config clients/clinica-sonrisa/client.json

Opciones:
  --slug       Slug del sitio a generar.
  --config     Ruta al client.json. Default: clients/{slug}/client.json
  --force      Regenera si sites/{slug} ya existe.
  --dry-run    Valida sin escribir el sitio.
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
