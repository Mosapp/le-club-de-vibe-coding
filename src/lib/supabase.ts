import { createClient } from "@supabase/supabase-js";

/* Lien de confirmation reçu par mail : Supabase renvoie vers le site avec les jetons dans
   l'adresse (#access_token=…&type=signup). On lit ça AVANT que le client ne nettoie l'adresse,
   pour savoir qu'il faut emmener la personne directement dans son espace. */
export type AuthCallback = { tokens: boolean; type: string | null; error: string | null };

function readAuthCallback(): AuthCallback {
  const none: AuthCallback = { tokens: false, type: null, error: null };
  if (typeof window === "undefined") return none;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw || raw.startsWith("/")) return none;
  const params = new URLSearchParams(raw);
  return {
    tokens: !!params.get("access_token"),
    type: params.get("type"),
    error: params.get("error_description") || params.get("error"),
  };
}

export const authCallback: AuthCallback = readAuthCallback();

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
