import type { CategoryId } from "../types";
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

function profile(id: string, code: string, name: string, p: ProfileParams): SensorProfile {
  return { id, code, name, params: p };
}

/* Perfiles de ejemplo: mismos parámetros, datos distintos → sellos distintos. */
export const PROFILES: SensorProfile[] = [
  profile("vestibulo", "PERF-01", "Vestíbulo principal", {
    sound: pr(0.82, 0.92, 0.5, 0.8, 0.5, 0.9, "sensor"),
    light: pr(0.7, 0.85, 0.4, 0.7, 0.6, 0.85, "sensor"),
    flow: pr(0.9, 0.95, 0.6, 0.85, 0.35, 0.8, "sensor"),
    wait: pr(0.35, 0.5, 0.4, 0.4, 0.6, 0.7, "observation"),
    orientation: pr(0.62, 0.6, 0.55, 0.5, 0.35, 0.65, "observation"),
    visual: pr(0.78, 0.85, 0.65, 0.7, 0.4, 0.75, "sensor"),
    pause: pr(0.2, 0.3, 0.3, 0.3, 0.7, 0.6, "survey"),
  }),
  profile("espera", "PERF-02", "Sala de espera", {
    sound: pr(0.45, 0.6, 0.35, 0.6, 0.6, 0.8, "sensor"),
    light: pr(0.5, 0.55, 0.25, 0.6, 0.7, 0.85, "sensor"),
    flow: pr(0.3, 0.45, 0.4, 0.4, 0.6, 0.7, "observation"),
    wait: pr(0.85, 0.9, 0.45, 0.9, 0.5, 0.85, "survey"),
    orientation: pr(0.4, 0.4, 0.3, 0.4, 0.7, 0.7, "observation"),
    visual: pr(0.45, 0.55, 0.4, 0.5, 0.6, 0.7, "sensor"),
    pause: pr(0.6, 0.5, 0.3, 0.6, 0.75, 0.7, "survey"),
  }),
  profile("pasillo", "PERF-03", "Pasillo norte", {
    sound: pr(0.5, 0.7, 0.6, 0.5, 0.4, 0.6, "observation"),
    light: pr(0.4, 0.6, 0.5, 0.5, 0.45, 0.6, "observation"),
    flow: pr(0.65, 0.8, 0.7, 0.6, 0.4, 0.7, "sensor"),
    wait: pr(0.25, 0.4, 0.5, 0.3, 0.55, 0.6, "observation"),
    orientation: pr(0.8, 0.7, 0.6, 0.6, 0.25, 0.55, "survey"),
    visual: pr(0.6, 0.7, 0.6, 0.55, 0.4, 0.6, "sensor"),
    pause: pr(0.25, 0.35, 0.4, 0.3, 0.6, 0.55, "survey"),
  }),
  profile("patio", "PERF-04", "Patio tranquilo", {
    sound: pr(0.2, 0.35, 0.25, 0.3, 0.8, 0.85, "sensor"),
    light: pr(0.45, 0.5, 0.3, 0.5, 0.8, 0.85, "sensor"),
    flow: pr(0.2, 0.3, 0.3, 0.3, 0.8, 0.8, "observation"),
    wait: pr(0.15, 0.25, 0.2, 0.2, 0.85, 0.8, "observation"),
    orientation: pr(0.25, 0.3, 0.2, 0.3, 0.85, 0.8, "observation"),
    visual: pr(0.2, 0.3, 0.25, 0.3, 0.8, 0.8, "sensor"),
    pause: pr(0.85, 0.7, 0.2, 0.8, 0.85, 0.9, "survey"),
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

const SOURCES: DataSource[] = ["sensor", "observation", "survey"];

/** Genera un perfil con datos aleatorios (demuestra la variedad del sistema). */
export function randomProfile(n: number): SensorProfile {
  const rnd = () => Math.round(Math.random() * 100) / 100;
  const params = {} as ProfileParams;
  for (const c of RING_ORDER) {
    params[c] = pr(
      rnd(),
      Math.min(1, rnd() * 0.5 + 0.5),
      rnd(),
      rnd(),
      rnd(),
      Math.min(1, rnd() * 0.4 + 0.5),
      SOURCES[Math.floor(Math.random() * SOURCES.length)],
    );
  }
  return profile(`rnd-${n}`, `GEN-${String(n).padStart(2, "0")}`, `Espacio generado ${n}`, params);
}

/** Actualiza un parámetro de una categoría devolviendo un nuevo perfil. */
export function setParam(
  p: SensorProfile,
  cat: CategoryId,
  key: keyof CategoryParams,
  value: number | DataSource,
): SensorProfile {
  return { ...p, params: { ...p.params, [cat]: { ...p.params[cat], [key]: value } } };
}
