import type { JSX } from "react";
import { arc, arrow, polar } from "../../lib/svg";

/**
 * Glifos de las ACCIONES CLAVE del sistema, dibujados a mano como `<g>` SVG
 * (stroke = color), NO con lucide: lucide son componentes DOM y no se serializan
 * dentro del SVG exportable. Cada glifo se dibuja en una caja de 24×24 desde (x,y).
 */
export type AccionId = "entrar" | "circular" | "esperar" | "descansar";

const stroke = (color: string, w = 2) =>
  ({ fill: "none", stroke: color, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round" }) as const;

function Entrar(x: number, y: number, color: string): JSX.Element {
  const a = arrow(x + 1, y + 12, x + 13, y + 12, 5);
  return (
    <g {...stroke(color)}>
      <path d={a.shaft} />
      <path d={a.head} />
      <path d={`M ${x + 16} ${y + 3} L ${x + 16} ${y + 21}`} />
      <path d={`M ${x + 16} ${y + 3} L ${x + 22} ${y + 3}`} />
      <path d={`M ${x + 16} ${y + 21} L ${x + 22} ${y + 21}`} />
    </g>
  );
}

function Circular(x: number, y: number, color: string): JSX.Element {
  const cx = x + 12;
  const cy = y + 12;
  const r = 9;
  const end = 312;
  const [px, py] = polar(cx, cy, r, end);
  const [bx, by] = polar(cx, cy, r, end - 10);
  const head = arrow(bx, by, px, py, 5).head;
  return (
    <g {...stroke(color)}>
      <path d={arc(cx, cy, r, 35, end)} />
      <path d={head} />
    </g>
  );
}

function Esperar(x: number, y: number, color: string): JSX.Element {
  const cx = x + 12;
  const cy = y + 12;
  return (
    <g {...stroke(color)}>
      <circle cx={cx} cy={cy} r={9} />
      <path d={`M ${cx} ${cy} L ${cx} ${cy - 6}`} />
      <path d={`M ${cx} ${cy} L ${cx + 4.5} ${cy + 2}`} />
    </g>
  );
}

function Descansar(x: number, y: number, color: string): JSX.Element {
  return (
    <g {...stroke(color)}>
      <circle cx={x + 9} cy={y + 6} r={3} fill={color} stroke="none" />
      <path d={`M ${x + 9} ${y + 9} L ${x + 10} ${y + 15} L ${x + 18} ${y + 15}`} />
      <path d={`M ${x + 18} ${y + 15} L ${x + 18} ${y + 21}`} />
      <path d={`M ${x + 4} ${y + 21} L ${x + 20} ${y + 21}`} />
    </g>
  );
}

const DRAW: Record<AccionId, (x: number, y: number, color: string) => JSX.Element> = {
  entrar: Entrar,
  circular: Circular,
  esperar: Esperar,
  descansar: Descansar,
};

export function AccionGlyph({ id, x, y, color }: { id: AccionId; x: number; y: number; color: string }): JSX.Element {
  return DRAW[id](x, y, color);
}
