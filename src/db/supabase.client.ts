import { createClient, type SupabaseClient as SupabaseClientGeneric } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = SupabaseClientGeneric<Database>;

export const DEFAULT_USER_ID = "422dc021-97bb-4cd7-98b4-084857c9b313";
