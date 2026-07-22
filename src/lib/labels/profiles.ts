import type { CategoryId } from "../types";
import { supabase } from "../supabase";
import type { CategoryParams, DataSource, ProfileParams, SensorProfile } from "./types";
import { RING_ORDER } from "./types";

/** atajo para declarar los 7 parámetros de una categoría */
function pr(
  intensity: number,
  peak: number,
  variability: number,
  duration: number,
  predictability: number,
  confidence: number,
  source: DataSource,
): CategoryParams {
  return { intensity, peak, variability, duration, predictability, confidence, source };
}

function space(id: string, code: string, site: string, name: string, p: ProfileParams): SensorProfile {
  return { id, code, site, name, params: p };
}

/* Espacios de ejemplo, AGRUPADOS por sitio. El repositorio crece por grupos:
   un edificio (p. ej. Museo MARCO) y, dentro, sus espacios medidos. */
export const PROFILES: SensorProfile[] = [
  // ── Museo MARCO ──────────────────────────────────────────────────────────
  space("marco-vestibulo", "MARCO-01", "Museo MARCO", "Vestíbulo principal", {
    sound: pr(0.82, 0.92, 0.5, 0.8, 0.5, 0.9, "sensor"),
    light: pr(0.7, 0.85, 0.4, 0.7, 0.6, 0.85, "sensor"),
    flow: pr(0.9, 0.95, 0.6, 0.85, 0.35, 0.8, "sensor"),
    wait: pr(0.35, 0.5, 0.4, 0.4, 0.6, 0.7, "observation"),
    orientation: pr(0.62, 0.6, 0.55, 0.5, 0.35, 0.65, "observation"),
    visual: pr(0.78, 0.85, 0.65, 0.7, 0.4, 0.75, "sensor"),
    pause: pr(0.2, 0.3, 0.3, 0.3, 0.7, 0.6, "survey"),
  }),
  space("marco-espera", "MARCO-02", "Museo MARCO", "Sala de espera", {
    sound: pr(0.45, 0.6, 0.35, 0.6, 0.6, 0.8, "sensor"),
    light: pr(0.5, 0.55, 0.25, 0.6, 0.7, 0.85, "sensor"),
    flow: pr(0.3, 0.45, 0.4, 0.4, 0.6, 0.7, "observation"),
    wait: pr(0.85, 0.9, 0.45, 0.9, 0.5, 0.85, "survey"),
    orientation: pr(0.4, 0.4, 0.3, 0.4, 0.7, 0.7, "observation"),
    visual: pr(0.45, 0.55, 0.4, 0.5, 0.6, 0.7, "sensor"),
    pause: pr(0.6, 0.5, 0.3, 0.6, 0.75, 0.7, "survey"),
  }),
  space("marco-pasillo", "MARCO-03", "Museo MARCO", "Pasillo norte", {
    sound: pr(0.5, 0.7, 0.6, 0.5, 0.4, 0.6, "observation"),
    light: pr(0.4, 0.6, 0.5, 0.5, 0.45, 0.6, "observation"),
    flow: pr(0.65, 0.8, 0.7, 0.6, 0.4, 0.7, "sensor"),
    wait: pr(0.25, 0.4, 0.5, 0.3, 0.55, 0.6, "observation"),
    orientation: pr(0.8, 0.7, 0.6, 0.6, 0.25, 0.55, "survey"),
    visual: pr(0.6, 0.7, 0.6, 0.55, 0.4, 0.6, "sensor"),
    pause: pr(0.25, 0.35, 0.4, 0.3, 0.6, 0.55, "survey"),
  }),
  space("marco-patio", "MARCO-04", "Museo MARCO", "Patio tranquilo", {
    sound: pr(0.2, 0.35, 0.25, 0.3, 0.8, 0.85, "sensor"),
    light: pr(0.45, 0.5, 0.3, 0.5, 0.8, 0.85, "sensor"),
    flow: pr(0.2, 0.3, 0.3, 0.3, 0.8, 0.8, "observation"),
    wait: pr(0.15, 0.25, 0.2, 0.2, 0.85, 0.8, "observation"),
    orientation: pr(0.25, 0.3, 0.2, 0.3, 0.85, 0.8, "observation"),
    visual: pr(0.2, 0.3, 0.25, 0.3, 0.8, 0.8, "sensor"),
    pause: pr(0.85, 0.7, 0.2, 0.8, 0.85, 0.9, "survey"),
  }),
  // ── Biblioteca UDEM ──────────────────────────────────────────────────────
  space("bib-lectura", "UDEM-01", "Biblioteca UDEM", "Sala de lectura", {
    sound: pr(0.25, 0.4, 0.3, 0.4, 0.7, 0.8, "sensor"),
    light: pr(0.55, 0.6, 0.25, 0.6, 0.8, 0.85, "sensor"),
    flow: pr(0.3, 0.45, 0.35, 0.4, 0.65, 0.75, "observation"),
    wait: pr(0.3, 0.4, 0.3, 0.4, 0.6, 0.7, "observation"),
    orientation: pr(0.35, 0.4, 0.3, 0.4, 0.75, 0.7, "observation"),
    visual: pr(0.35, 0.45, 0.35, 0.4, 0.6, 0.7, "sensor"),
    pause: pr(0.75, 0.6, 0.25, 0.7, 0.8, 0.85, "survey"),
  }),
  space("bib-acceso", "UDEM-02", "Biblioteca UDEM", "Acceso principal", {
    sound: pr(0.55, 0.7, 0.45, 0.6, 0.5, 0.75, "sensor"),
    light: pr(0.6, 0.7, 0.4, 0.6, 0.6, 0.8, "sensor"),
    flow: pr(0.8, 0.9, 0.6, 0.8, 0.4, 0.8, "sensor"),
    wait: pr(0.4, 0.55, 0.45, 0.5, 0.55, 0.7, "observation"),
    orientation: pr(0.55, 0.6, 0.5, 0.5, 0.4, 0.65, "survey"),
    visual: pr(0.65, 0.75, 0.55, 0.6, 0.45, 0.7, "sensor"),
    pause: pr(0.2, 0.3, 0.3, 0.3, 0.7, 0.6, "survey"),
  }),
];

/** categorías que suman a la carga sensorial (para la densidad global) */
const LOAD_CATS: CategoryId[] = ["sound", "light", "flow", "visual", "wait"];

/** carga general del espacio 0..1 = intensidad media de las categorías de carga */
export function globalLoad(profile: SensorProfile): number {
  const s = LOAD_CATS.reduce((a, c) => a + profile.params[c].intensity, 0);
  return s / LOAD_CATS.length;
}

/** intensidad → nivel 0..4 (Muy bajo … Crítico) */
export function intensityLevel(x: number): 0 | 1 | 2 | 3 | 4 {
  if (x < 0.2) return 0;
  if (x < 0.35) return 1;
  if (x < 0.6) return 2;
  if (x < 0.8) return 3;
  return 4;
}

/** intensidad → severidad 0..2 (para reutilizar decisiones del catálogo) */
export function intensitySeverity(x: number): 0 | 1 | 2 {
  if (x < 0.4) return 0;
  if (x < 0.7) return 1;
  return 2;
}

/** prefijo de código del sitio: usa el acrónimo si lo hay, si no las iniciales.
 *  "Museo MARCO" → "MARCO" · "Biblioteca UDEM" → "UDEM" · "Hospital General" → "HG" */
export function siteCode(site: string): string {
  const words = site.split(/\s+/).filter(Boolean);
  const acronym = words.find((w) => w.length >= 2 && w === w.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(w));
  if (acronym) return acronym.replace(/[^A-Za-zÁÉÍÓÚÑ0-9]/g, "").slice(0, 6).toUpperCase();
  const initials = words.map((w) => w[0]).join("").replace(/[^A-Za-zÁÉÍÓÚÑ]/g, "").toUpperCase().slice(0, 4);
  return initials || "ESP";
}

/** Actualiza un parámetro de una categoría devolviendo un nuevo perfil. */
export function setParam(
  p: SensorProfile,
  cat: CategoryId,
  key: keyof CategoryParams,
  value: number | DataSource | boolean,
): SensorProfile {
  return { ...p, params: { ...p.params, [cat]: { ...p.params[cat], [key]: value } } };
}

/** ¿la categoría cuenta como evaluada? (undefined = datos previos → sí) */
export function isEvaluated(cp: CategoryParams): boolean {
  return cp.evaluated !== false;
}

/** firma de una categoría recién creada (newSpace), ignorando la intensidad */
function isNeutralCat(cp: CategoryParams): boolean {
  return (
    cp.source === "observation" &&
    cp.confidence === 0.7 &&
    cp.peak === 0.5 &&
    cp.variability === 0.4 &&
    cp.duration === 0.4 &&
    cp.predictability === 0.6
  );
}

/**
 * Retro-rellena el marcador `evaluated` en datos previos a su existencia. A nivel
 * de ESPACIO: si TODAS sus categorías tienen la firma neutra de un espacio recién
 * creado, se considera no evaluado (todas false); si alguna varía, el espacio fue
 * trabajado y se marcan todas true. Evita falsos negativos por categorías de seed
 * que coinciden con la plantilla.
 */
function migrateEvaluated(list: SensorProfile[]): SensorProfile[] {
  return list.map((p) => {
    const untouched = RING_ORDER.every((c) => isNeutralCat(p.params[c]));
    let changed = false;
    const params = { ...p.params } as ProfileParams;
    for (const c of RING_ORDER) {
      if (params[c].evaluated === undefined) {
        params[c] = { ...params[c], evaluated: !untouched };
        changed = true;
      }
    }
    return changed ? { ...p, params } : p;
  });
}

/* ----------------------------------------------------------- repositorio -- */
/**
 * Persistencia local del repositorio de espacios medidos: el catálogo "se va
 * alimentando" entre sesiones conforme la investigación levanta más espacios.
 */
const STORAGE_KEY = "di-espacios-v2";

export function loadProfiles(): SensorProfile[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return migrateEvaluated(parsed as SensorProfile[]);
    }
  } catch {
    /* almacenamiento no disponible → se usan los espacios de ejemplo */
  }
  return migrateEvaluated(PROFILES);
}

export function saveProfiles(list: SensorProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* sin persistencia (modo privado, etc.) */
  }
}

/* --------------------------------------------------- repositorio remoto --- */
/**
 * Capa Supabase: misma forma (`SensorProfile`) pero persistida en `public.profiles`.
 * `params` viaja como JSONB. La app trabaja con la lista completa en memoria; las
 * funciones de sync calculan el diff (alta/edición/baja) y emiten upserts/deletes.
 */
type ProfileRow = Pick<SensorProfile, "id" | "code" | "site" | "name" | "params">;

function toRow(p: SensorProfile): ProfileRow {
  return { id: p.id, code: p.code, site: p.site, name: p.name, params: p.params };
}

export async function fetchProfilesRemote(): Promise<SensorProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id,code,site,name,params")
    .order("site", { ascending: true })
    .order("code", { ascending: true });
  if (error) throw error;
  return migrateEvaluated((data ?? []) as SensorProfile[]);
}

export async function upsertProfilesRemote(rows: SensorProfile[]): Promise<void> {
  if (!supabase || rows.length === 0) return;
  const { error } = await supabase.from("profiles").upsert(rows.map(toRow));
  if (error) throw error;
}

export async function deleteProfilesRemote(ids: string[]): Promise<void> {
  if (!supabase || ids.length === 0) return;
  const { error } = await supabase.from("profiles").delete().in("id", ids);
  if (error) throw error;
}

/** Crea un espacio recién registrado con parámetros neutros, SIN evaluar aún. */
export function newSpace(name: string, code: string, site: string): SensorProfile {
  const params = {} as ProfileParams;
  for (const c of RING_ORDER) params[c] = { ...pr(0.4, 0.5, 0.4, 0.4, 0.6, 0.7, "observation"), evaluated: false };
  return { id: `esp-${Date.now()}`, code, site, name, params };
}
