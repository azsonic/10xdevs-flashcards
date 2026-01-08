// @ts-check
import { defineConfig } from "astro/config";
import { env } from "node:process";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  devToolbar: {
    enabled: false,
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "import.meta.env.SUPABASE_KEY": JSON.stringify(env.SUPABASE_KEY),
    },
    resolve: {
      alias: {
        // Use edge-compatible React DOM server for Cloudflare Workers
        "react-dom/server": "react-dom/server.edge",
      },
    },
  },
  adapter: cloudflare({
    imageService: "passthrough",
  }),
});
