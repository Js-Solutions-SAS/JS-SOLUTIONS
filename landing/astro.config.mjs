import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.jssolutions.com.co",
  output: "server",
  adapter: vercel(),
  integrations: [react(), tailwind(), sitemap()],
});
