import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/rest\/v1\/?$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const authRedirectUrl =
  import.meta.env.VITE_AUTH_REDIRECT_URL || `${window.location.origin}${window.location.pathname}`;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure. Ajoute VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}
