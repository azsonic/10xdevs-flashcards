import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import { defineMiddleware } from "astro:middleware";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/signout",
  "/api/auth/reset-password",
  "/api/auth/callback",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // 1. Create Supabase Server Client (with Cloudflare runtime env)
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
    runtime: locals.runtime,
  });

  // 2. Attach to locals
  locals.supabase = supabase;

  // 3. Get User Session
  // IMPORTANT: Always get user session first before any other operations
  // This handles token refreshing automatically via the cookie options
  const {
    data: { user },
  } = await supabase.auth.getUser();

  locals.user = user;

  // 4. Route Protection
  const isPublicPath = PUBLIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path + "/"));

  // Allow static assets and public paths
  if (
    !user &&
    !isPublicPath &&
    url.pathname !== "/favicon.ico" &&
    !url.pathname.startsWith("/_astro") &&
    !url.pathname.startsWith("/assets")
  ) {
    // Redirect to login for protected routes
    return redirect("/login");
  }

  // If user IS logged in and tries to access login/register, redirect to dashboard
  if (user && ["/login", "/register", "/forgot-password"].includes(url.pathname)) {
    return redirect("/");
  }

  return next();
});
