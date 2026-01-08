import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient, type SupabaseClient as SupabaseClientGeneric } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

// Client-side environment variables (defined at build time via Vite)
const clientSupabaseUrl = import.meta.env.SUPABASE_URL;
const clientSupabaseKey = import.meta.env.SUPABASE_KEY;

// Client-side client (for browser/client-side only logic)
export const supabaseClient = createClient<Database>(
  clientSupabaseUrl || "https://placeholder.supabase.co",
  clientSupabaseKey || "placeholder"
);
export type SupabaseClient = SupabaseClientGeneric<Database>;

export const DEFAULT_USER_ID = "3c46f389-eff8-4030-a790-3108f9bf2179";

// Server-side client (SSR)
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

interface RuntimeEnv {
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
}

interface ServerContext {
  headers: Headers;
  cookies: AstroCookies;
  runtime?: { env: RuntimeEnv };
}

export const createSupabaseServerInstance = (context: ServerContext) => {
  // Get env vars from Cloudflare runtime (production) or fallback to import.meta.env (dev)
  const runtimeEnv = context.runtime?.env;
  const url = runtimeEnv?.SUPABASE_URL || clientSupabaseUrl || "https://placeholder.supabase.co";
  const key = runtimeEnv?.SUPABASE_KEY || clientSupabaseKey || "placeholder";

  const supabase = createServerClient<Database>(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
