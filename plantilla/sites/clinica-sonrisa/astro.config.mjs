import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://clinica-sonrisa.vercel.app",
  output: "static",
  integrations: [sitemap()],
  prefetch: true,
});
