import { supabase } from "../supabase";
import type { Plano, PlanoMap } from "./types";

/**
 * Persistencia local de los planos por sitio (espejo de lib/labels/profiles.ts).
 * Cada sitio guarda su disposición editada; arranca vacío y se va alimentando.
 */
const STORAGE_KEY = "di-planos-v1";

export function loadPlanos(): PlanoMap {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      // objeto plano (no array, no null) → mapa sitio→Plano
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as PlanoMap;
      }
    }
  } catch {
    /* almacenamiento no disponible o dato corrupto → mapa vacío */
  }
  return {};
}

export function savePlanos(map: PlanoMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* sin persistencia (modo privado, etc.) */
  }
}

/* --------------------------------------------------- repositorio remoto --- */
type PlanoRow = {
  site: string;
  title: string;
  scale: string;
  entrance: Plano["entrance"] | null;
  rooms: Plano["rooms"];
};

function toRow(p: Plano): PlanoRow {
  return { site: p.site, title: p.title, scale: p.scale, entrance: p.entrance ?? null, rooms: p.rooms };
}

export async function fetchPlanosRemote(): Promise<PlanoMap> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("planos")
    .select("site,title,scale,entrance,rooms");
  if (error) throw error;
  const map: PlanoMap = {};
  for (const row of (data ?? []) as PlanoRow[]) {
    map[row.site] = {
      site: row.site,
      title: row.title,
      scale: row.scale,
      entrance: row.entrance ?? undefined,
      rooms: row.rooms ?? [],
    };
  }
  return map;
}

export async function upsertPlanosRemote(planos: Plano[]): Promise<void> {
  if (!supabase || planos.length === 0) return;
  const { error } = await supabase.from("planos").upsert(planos.map(toRow));
  if (error) throw error;
}

export async function deletePlanosRemote(sites: string[]): Promise<void> {
  if (!supabase || sites.length === 0) return;
  const { error } = await supabase.from("planos").delete().in("site", sites);
  if (error) throw error;
}
