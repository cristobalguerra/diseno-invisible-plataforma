import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase del repositorio compartido. Modo anónimo (anon key + RLS abierta):
 * cualquier visitante puede leer, insertar y modificar. La fuente de verdad es Supabase;
 * localStorage se mantiene como fallback de lectura offline.
 *
 * Si las env vars no existen (preview sin secrets), `supabase` es null y la app se
 * comporta como antes (solo localStorage).
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const REMOTE_ENABLED = Boolean(URL && KEY);

export const supabase: SupabaseClient | null = REMOTE_ENABLED
  ? createClient(URL!, KEY!, { auth: { persistSession: false } })
  : null;
