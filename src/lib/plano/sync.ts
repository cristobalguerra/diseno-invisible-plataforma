import type { SensorProfile } from "../labels/types";
import type { Plano, PlanoRoom } from "./types";
import { DEFAULT_SCALE } from "./types";
import { autoLayout, appendRooms } from "./layout";

/**
 * Reconcilia el plano guardado de un sitio con sus espacios actuales:
 *   · 0 espacios            → plano vacío
 *   · sin guardar / sin salas → auto-acomodo completo
 *   · si no                 → conserva las salas cuyo profileId sigue existiendo,
 *                             purga huérfanas y agrega las de espacios nuevos.
 * Pura: no persiste; el llamador decide si guarda el resultado.
 */
export function reconcilePlano(site: string, spaces: SensorProfile[], stored?: Plano): Plano {
  const title = stored?.title ?? site;
  const scale = stored?.scale ?? DEFAULT_SCALE;

  if (spaces.length === 0) {
    return { site, title, scale, rooms: [], entrance: stored?.entrance };
  }

  if (!stored || stored.rooms.length === 0) {
    const { rooms, entrance } = autoLayout(spaces);
    return { site, title, scale, rooms, entrance };
  }

  const liveIds = new Set(spaces.map((s) => s.id));
  const kept: PlanoRoom[] = stored.rooms.filter((r) => liveIds.has(r.profileId));

  // todas las salas guardadas eran huérfanas → re-acomoda de cero
  if (kept.length === 0) {
    const { rooms, entrance } = autoLayout(spaces);
    return { site, title, scale, rooms, entrance };
  }

  const keptIds = new Set(kept.map((r) => r.profileId));
  const added = spaces.filter((s) => !keptIds.has(s.id));
  const rooms = added.length ? [...kept, ...appendRooms(kept, added)] : kept;

  return { site, title, scale, rooms, entrance: stored.entrance };
}

/** ¿el conjunto de salas cubre exactamente los espacios vivos? (para decidir si persistir) */
export function roomsMatchSpaces(plano: Plano, spaces: SensorProfile[]): boolean {
  if (plano.rooms.length !== spaces.length) return false;
  const ids = new Set(plano.rooms.map((r) => r.profileId));
  return spaces.every((s) => ids.has(s.id));
}
