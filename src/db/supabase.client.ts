import { createClient, type SupabaseClient as SupabaseClientGeneric } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = SupabaseClientGeneric<Database>;

export const DEFAULT_USER_ID = "3c46f389-eff8-4030-a790-3108f9bf2179";
