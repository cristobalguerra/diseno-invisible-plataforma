import { useEffect, useRef, useState } from "react";
import type { SensorProfile } from "../../lib/labels/types";
import type { Plano, PlanoRoom } from "../../lib/plano/types";
import { PLANO_W, PLANO_H, ROOM_MIN_W, ROOM_MIN_H } from "../../lib/plano/types";

type Drag =
  | { mode: "move" | "resize"; id: string; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number }
  | null;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const HANDLE = 16;

/**
 * Editor del plano: arrastra para mover, esquina inferior-derecha para
 * redimensionar. Trabaja en coordenadas del lienzo (0..PLANO) y solo confirma al
 * soltar (pointerup) para no saturar el estado/persistencia.
 */
export function PlanoCanvas({
  plano,
  byId,
  selectedId,
  onSelect,
  onRooms,
}: {
  plano: Plano;
  byId: Map<string, SensorProfile>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRooms: (rooms: PlanoRoom[]) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rooms, setRooms] = useState<PlanoRoom[]>(plano.rooms);
  const roomsRef = useRef<PlanoRoom[]>(plano.rooms);
  const [drag, setDrag] = useState<Drag>(null);

  useEffect(() => {
    setRooms(plano.rooms);
    roomsRef.current = plano.rooms;
  }, [plano.rooms]);

  function toCanvas(e: React.PointerEvent): { x: number; y: number } {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * PLANO_W, y: ((e.clientY - r.top) / r.height) * PLANO_H };
  }

  function startMove(e: React.PointerEvent, room: PlanoRoom) {
    e.stopPropagation();
    onSelect(room.profileId);
    const c = toCanvas(e);
    svgRef.current!.setPointerCapture(e.pointerId);
    setDrag({ mode: "move", id: room.profileId, sx: c.x, sy: c.y, ox: room.x, oy: room.y, ow: room.w, oh: room.h });
  }

  function startResize(e: React.PointerEvent, room: PlanoRoom) {
    e.stopPropagation();
    onSelect(room.profileId);
    const c = toCanvas(e);
    svgRef.current!.setPointerCapture(e.pointerId);
    setDrag({ mode: "resize", id: room.profileId, sx: c.x, sy: c.y, ox: room.x, oy: room.y, ow: room.w, oh: room.h });
  }

  function onMove(e: React.PointerEvent) {
    if (!drag) return;
    const c = toCanvas(e);
    const dx = c.x - drag.sx;
    const dy = c.y - drag.sy;
    const next = roomsRef.current.map((r) => {
      if (r.profileId !== drag.id) return r;
      if (drag.mode === "move") {
        return {
          ...r,
          x: Math.round(clamp(drag.ox + dx, 0, PLANO_W - r.w)),
          y: Math.round(clamp(drag.oy + dy, 0, PLANO_H - r.h)),
        };
      }
      return {
        ...r,
        w: Math.round(clamp(drag.ow + dx, ROOM_MIN_W, PLANO_W - r.x)),
        h: Math.round(clamp(drag.oh + dy, ROOM_MIN_H, PLANO_H - r.y)),
      };
    });
    roomsRef.current = next;
    setRooms(next);
  }

  function onUp(e: React.PointerEvent) {
    if (!drag) return;
    try {
      svgRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* puntero ya liberado */
    }
    setDrag(null);
    onRooms(roomsRef.current);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${PLANO_W} ${PLANO_H}`}
      width="100%"
      height="100%"
      className="touch-none select-none"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerDown={() => onSelect("")}
    >
      <rect x={0} y={0} width={PLANO_W} height={PLANO_H} fill="var(--color-sunken)" />
      <rect x={0} y={0} width={PLANO_W} height={PLANO_H} fill="url(#bpgrid-edit)" />
      <defs>
        <pattern id="bpgrid-edit" width={40} height={40} patternUnits="userSpaceOnUse">
          <path d="M40 0 H0 V40" fill="none" stroke="var(--color-line)" strokeWidth={1} opacity={0.5} />
        </pattern>
      </defs>

      {rooms.map((room) => {
        const p = byId.get(room.profileId);
        const sel = room.profileId === selectedId;
        const cxr = room.x + room.w / 2;
        const cyr = room.y + room.h / 2;
        return (
          <g key={room.profileId} transform={room.rot ? `rotate(${room.rot} ${cxr} ${cyr})` : undefined}>
            <rect
              x={room.x}
              y={room.y}
              width={room.w}
              height={room.h}
              rx={4}
              fill="var(--color-paper)"
              fillOpacity={sel ? 0.5 : 0.28}
              stroke={sel ? "var(--color-accent)" : "var(--color-ink-2)"}
              strokeWidth={sel ? 3 : 1.5}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => startMove(e, room)}
            />
            <text
              x={cxr}
              y={room.y + 26}
              textAnchor="middle"
              fontSize={20}
              className="mono"
              fill="var(--color-ink)"
              style={{ pointerEvents: "none" }}
            >
              {(p?.name ?? "—").toUpperCase().slice(0, 22)}
            </text>
            <text x={cxr} y={room.y + 48} textAnchor="middle" fontSize={15} className="mono" fill="var(--color-ink-3)" style={{ pointerEvents: "none" }}>
              {room.chips.length} chips
            </text>
            {sel && (
              <rect
                x={room.x + room.w - HANDLE}
                y={room.y + room.h - HANDLE}
                width={HANDLE}
                height={HANDLE}
                fill="var(--color-accent)"
                style={{ cursor: "nwse-resize" }}
                onPointerDown={(e) => startResize(e, room)}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
