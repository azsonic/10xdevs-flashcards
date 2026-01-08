/// <reference types="astro/client" />

import type { SupabaseClient, User, Session } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: User | null;
      session: Session | null;
      runtime?: {
        env: {
          SUPABASE_URL?: string;
          SUPABASE_KEY?: string;
          OPENROUTER_API_KEY?: string;
        };
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly MOCK_AI_SERVICE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
