import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "%%SITE_URL%%",
  output: "static",
  integrations: [sitemap()],
  prefetch: true,
});
