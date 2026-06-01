import type { CategoryId, PriorityResult, Severity, ZoneLevels } from "./types";
import { CATEGORIES } from "../data/catalog";

export const LOAD_CATEGORY_IDS: CategoryId[] = CATEGORIES.filter((c) => c.loadCategory).map((c) => c.id);

const INTERVENTION: Record<PriorityResult["level"], string> = {
  alta: "Señalética sensorial, mapa, pictogramas y texto de apoyo.",
  media: "Señalización ligera o información complementaria.",
  baja: "Intervención mínima o nula.",
};

/**
 * Semáforo de prioridad de intervención (paper, Tabla 3).
 * Regla práctica: alta carga sensorial + baja orientación = zona crítica.
 */
export function computePriority(levels: ZoneLevels): PriorityResult {
  const loadSevs = LOAD_CATEGORY_IDS.map((id) => levels[id]);
  const loadScore = loadSevs.reduce<number>((a, b) => a + b, 0); // 0..10
  const highCount = loadSevs.filter((s) => s === 2).length;
  const orientation = levels.orientation; // 0 clara .. 2 confusa

  let level: PriorityResult["level"];
  let reason: string;

  if (highCount >= 3 || (highCount >= 1 && orientation === 2) || (highCount >= 2 && orientation >= 1)) {
    level = "alta";
    reason =
      orientation === 2
        ? "Alta carga sensorial y orientación confusa."
        : "Varias condiciones sensoriales en nivel alto.";
  } else if (highCount === 0 && orientation === 0 && levels.flow <= 1 && loadScore <= 2) {
    level = "baja";
    reason = "Zona clara, tranquila y fácil de interpretar.";
  } else {
    level = "media";
    reason = "Condición relevante pero no crítica.";
  }

  return { level, loadScore, highCount, reason, intervention: INTERVENTION[level] };
}

/**
 * Señales relevantes a mostrar en una ficha de zona: condiciones que conviene
 * anticipar (severidad media/alta) y la zona de pausa cuando está disponible
 * (señal positiva). Ordenadas por severidad descendente.
 */
export function relevantSignals(levels: ZoneLevels): { id: CategoryId; sev: Severity }[] {
  const out: { id: CategoryId; sev: Severity }[] = [];
  for (const c of CATEGORIES) {
    const sev = levels[c.id];
    if (c.id === "pause") {
      if (sev === 0 || sev === 2) out.push({ id: c.id, sev });
      continue;
    }
    if (sev >= 1) out.push({ id: c.id, sev });
  }
  return out.sort((a, b) => b.sev - a.sev);
}

export const PRIORITY_SEVERITY: Record<PriorityResult["level"], Severity> = {
  alta: 2,
  media: 1,
  baja: 0,
};
