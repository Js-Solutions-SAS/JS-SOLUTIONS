import { readFile } from "node:fs/promises";

const html = await readFile("dist/index.html", "utf8");
const checks = [
  ["one-h1", (html.match(/<h1[\s>]/g) || []).length === 1],
  ["title", /<title>[^<]{20,}<\/title>/.test(html)],
  ["description", /<meta name="description" content="[^"]{50,}"/.test(html)],
  ["canonical", /<link rel="canonical" href="https?:\/\/[^"]+"/.test(html)],
  ["og-image", /<meta property="og:image" content="https?:\/\/[^"]+"/.test(html)],
  ["json-ld", /application\/ld\+json/.test(html)],
  ["whatsapp-link", /https:\/\/wa\.me\/\d+\?text=/.test(html)],
  ["faq-schema", /"@type":"FAQPage"/.test(html)],
  ["business-schema", /"@id":"[^"]+#business"/.test(html) && /"address":\{/.test(html)],
];

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) {
  console.error(`SEO checks failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log("SEO checks passed.");
