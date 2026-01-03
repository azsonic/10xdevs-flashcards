import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient, type SupabaseClient as SupabaseClientGeneric } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl =
  import.meta.env.SUPABASE_URL || (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
const supabaseAnonKey =
  import.meta.env.SUPABASE_KEY || (typeof process !== "undefined" ? process.env.SUPABASE_KEY : undefined);

// Client-side client (for non-SSR contexts or client-side only logic)
// We provide a fallback to prevent module loading errors if env vars are missing,
// but the client will fail if used.
export const supabaseClient = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
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

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder",
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get("Cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
        },
      },
    }
  );

  return supabase;
};
