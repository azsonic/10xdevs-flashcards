// @ts-check
import { defineConfig } from "astro/config";
import { env } from "node:process";
import process from "node:process";
import dotenv from "dotenv";
import path from "path";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// Load .env.test if E2E_TEST flag is set (from dotenv-cli)
// This ensures E2E tests use the correct Supabase instance
// Load BEFORE Astro's built-in env loading by using override
if (env.E2E_TEST === "true") {
  const result = dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });
  // Force override by directly setting process.env (in case Astro loads .env after)
  if (result.parsed) {
    Object.assign(process.env, result.parsed);
  }
}

const isProduction = env.NODE_ENV === "production" || !!env.CF_PAGES;

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
    // Prevent Astro/Vite from loading .env files when in E2E mode
    // We've already loaded .env.test above
    envDir: env.E2E_TEST === "true" ? false : undefined,
    define: {
      "import.meta.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL),
      "import.meta.env.SUPABASE_KEY": JSON.stringify(env.SUPABASE_KEY),
      "import.meta.env.E2E_TEST": JSON.stringify(env.E2E_TEST || ""),
    },
    resolve: {
      alias: isProduction
        ? {
            // Use edge-compatible React DOM server for Cloudflare Workers (production only)
            "react-dom/server": "react-dom/server.edge",
          }
        : {},
    },
  },
  adapter: cloudflare({
    imageService: "passthrough",
  }),
});
