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
    ssr: {
      // Externalize Node.js modules for Cloudflare Workers compatibility
      external: ["node:buffer", "node:crypto"],
    },
    resolve: {
      // Ensure React uses the correct server build for SSR
      conditions: ["workerd", "worker", "node"],
    },
  },
  adapter: cloudflare({
    imageService: "passthrough",
  }),
});
