import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configurationError =
  !url || !/^https:\/\/[^/]+/.test(url) || !key || key.startsWith("sb_secret_")
    ? "Configura VITE_SUPABASE_URL con la URL HTTPS del proyecto y VITE_SUPABASE_PUBLISHABLE_KEY con su clave pública en .env.local. Después reinicia Vite."
    : null;
export const supabase = createClient(
  configurationError ? "https://unconfigured.supabase.co" : url,
  configurationError ? "unconfigured-public-key" : key,
);
