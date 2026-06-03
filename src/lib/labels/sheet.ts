import type { CategoryId } from "../types";
import { getCategory } from "../../data/catalog";
import { GEN_LEVELS } from "../generative/levels";
import type { SensorProfile, DataSource } from "./types";
import { RING_ORDER, SOURCE_LABEL } from "./types";
import { globalLoad, intensityLevel, intensitySeverity } from "./profiles";

const varWord = (v: number) => (v < 0.33 ? "constante" : v < 0.66 ? "con cambios" : "muy variable");
const predictWord = (p: number) => (p > 0.66 ? "predecible" : p > 0.33 ? "algo predecible" : "impredecible");

export interface SheetRow {
  id: CategoryId;
  name: string;
  pct: number;
  levelWord: string;
  line: string;
  recommendation: string;
  source: DataSource;
  confidence: number;
}

export interface ProfileSheet {
  load: number;
  loadWord: string;
  anticipation: string;
  rows: SheetRow[];
}

/** La ficha completa que abre el escaneo del sello. */
export function profileSheet(profile: SensorProfile): ProfileSheet {
  const rows: SheetRow[] = RING_ORDER.map((id) => {
    const p = profile.params[id];
    const cat = getCategory(id);
    const lvl = intensityLevel(p.intensity);
    const sev = intensitySeverity(p.intensity);
    const pct = Math.round(p.intensity * 100);
    return {
      id,
      name: cat.name,
      pct,
      levelWord: GEN_LEVELS[lvl].name,
      line: `${GEN_LEVELS[lvl].name} (${pct}%), ${varWord(p.variability)}, ${predictWord(p.predictability)}.`,
      recommendation: cat.levels[sev].decision,
      source: p.source,
      confidence: p.confidence,
    };
  });

  const load = globalLoad(profile);
  const loadWord = GEN_LEVELS[intensityLevel(load)].name.toLowerCase();

  // principal exigencia: las dos categorías de carga más intensas
  const top = RING_ORDER.filter((c) => c !== "pause" && c !== "orientation")
    .map((c) => ({ name: getCategory(c).name, v: profile.params[c].intensity }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map((t) => t.name.toLowerCase());

  const pause = profile.params.pause.intensity;
  const pauseLine =
    pause >= 0.6
      ? "Hay refugio disponible para regularse."
      : pause >= 0.35
        ? "El refugio es limitado."
        : "Sin refugio cercano: planifica la pausa.";

  return {
    load,
    loadWord,
    anticipation: `Carga sensorial ${loadWord}. Principal exigencia: ${top.join(" y ")}. ${pauseLine}`,
    rows,
  };
}

export { SOURCE_LABEL };
