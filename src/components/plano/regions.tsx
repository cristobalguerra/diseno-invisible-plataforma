import type { JSX } from "react";
import type { CategoryId } from "../../lib/types";
import { CATEGORIES, CATEGORY_COLOR, getCategory } from "../../data/catalog";
import { RING_ORDER, type SensorProfile } from "../../lib/labels/types";
import { intensitySeverity, isEvaluated, siteCode } from "../../lib/labels/profiles";
import { polar, wrapText } from "../../lib/svg";
import type { Plano } from "../../lib/plano/types";
import { PLANO_W, PLANO_H } from "../../lib/plano/types";
import { SealGroup } from "./sealGroup";
import { AccionGlyph, type AccionId } from "./glyphsAcciones";

type Rect = { x: number; y: number; w: number; h: number };

/** ajuste uniforme del lienzo lógico (0..PLANO) dentro de una región de la lámina */
export function fitCanvas(region: Rect): { s: number; tx: number; ty: number } {
  const s = Math.min(region.w / PLANO_W, region.h / PLANO_H);
  return {
    s,
    tx: region.x + (region.w - PLANO_W * s) / 2,
    ty: region.y + (region.h - PLANO_H * s) / 2,
  };
}

/* ----------------------------------------------------------------- título -- */

export function TitleBlock({ x, y, site }: { x: number; y: number; site: string }): JSX.Element {
  return (
    <g>
      <text x={x} y={y + 30} fontSize={34} fontWeight={800} fill="var(--color-ink)" style={{ letterSpacing: "-0.02em" }}>
        DISEÑO INVISIBLE
      </text>
      <text x={x + 2} y={y + 52} fontSize={14} fill="var(--color-ink-2)">
        Sistema de lectura sensorial para espacios
      </text>
      <line x1={x + 2} y1={y + 64} x2={x + 250} y2={y + 64} stroke="var(--color-accent)" strokeWidth={1.5} />
      <text x={x + 2} y={y + 88} fontSize={15} className="mono" fill="var(--color-accent)" style={{ letterSpacing: "0.06em" }}>
        BLUEPRINT SENSORIAL — {site.toUpperCase()}
      </text>
      <text x={x + 2} y={y + 106} fontSize={11} fill="var(--color-ink-3)">
        Plano abstracto + lectura por capas
      </text>
    </g>
  );
}

/* --------------------------------------------------------- chips + plano -- */

function Chip({ x, y, w, cat, profile }: { x: number; y: number; w: number; cat: CategoryId; profile: SensorProfile }): JSX.Element {
  const sev = intensitySeverity(profile.params[cat].intensity);
  const code = getCategory(cat).code;
  const word = getCategory(cat).levels[sev].short;
  const h = 22;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill="var(--color-sunken)" stroke="var(--color-line)" strokeWidth={1} />
      <circle cx={x + 11} cy={y + h / 2} r={3.4} fill={CATEGORY_COLOR[cat]} />
      <text x={x + 21} y={y + h / 2 + 4} fontSize={11.5} className="mono" fill="var(--color-ink)">
        <tspan fill={CATEGORY_COLOR[cat]} fontWeight={700}>{code}</tspan>
        <tspan dx={6} fill="var(--color-ink-2)">{word}</tspan>
      </text>
    </g>
  );
}

export function PlanoBody({ region, plano, byId }: { region: Rect; plano: Plano; byId: Map<string, SensorProfile> }): JSX.Element {
  const { s, tx, ty } = fitCanvas(region);
  const mx = (cx: number) => tx + cx * s;
  const my = (cy: number) => ty + cy * s;

  return (
    <g>
      {/* fondo + retícula del plano */}
      <rect x={mx(0)} y={my(0)} width={PLANO_W * s} height={PLANO_H * s} fill="var(--color-sunken)" opacity={0.4} />
      <rect x={mx(0)} y={my(0)} width={PLANO_W * s} height={PLANO_H * s} fill="url(#bpgrid)" />
      <rect x={mx(0)} y={my(0)} width={PLANO_W * s} height={PLANO_H * s} fill="none" stroke="var(--color-line)" strokeWidth={1} />

      {/* entrada */}
      {plano.entrance && (
        <g>
          <path
            d={`M ${mx(plano.entrance.x) - 26} ${my(plano.entrance.y)} L ${mx(plano.entrance.x) - 6} ${my(plano.entrance.y)}`}
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d={`M ${mx(plano.entrance.x) - 12} ${my(plano.entrance.y) - 5} L ${mx(plano.entrance.x) - 6} ${my(plano.entrance.y)} L ${mx(plano.entrance.x) - 12} ${my(plano.entrance.y) + 5}`}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {plano.rooms.map((room) => {
        const p = byId.get(room.profileId);
        if (!p) return null;
        const rx = mx(room.x);
        const ry = my(room.y);
        const rw = room.w * s;
        const rh = room.h * s;
        const cxr = rx + rw / 2;
        const cyr = ry + rh / 2;
        const nameMax = Math.max(6, Math.floor((rw - 16) / 8));
        const nameLines = wrapText(p.name.toUpperCase(), nameMax).slice(0, 2);
        const chipW = Math.min(rw - 20, 132);
        const chips = room.chips.slice(0, 3);
        return (
          <g key={room.profileId} transform={room.rot ? `rotate(${room.rot} ${cxr} ${cyr})` : undefined}>
            <rect x={rx} y={ry} width={rw} height={rh} rx={3} fill="var(--color-paper)" fillOpacity={0.22} stroke="var(--color-ink-2)" strokeWidth={1.3} />
            <text x={cxr} y={ry + 18} textAnchor="middle" fontSize={12.5} className="mono" fill="var(--color-ink)" style={{ letterSpacing: "0.04em" }}>
              {nameLines.map((ln, i) => (
                <tspan key={i} x={cxr} dy={i === 0 ? 0 : 14}>{ln}</tspan>
              ))}
            </text>
            <g>
              {chips.map((cat, i) => (
                <Chip key={cat} x={rx + 10} y={ry + 14 + nameLines.length * 14 + i * 26} w={chipW} cat={cat} profile={p} />
              ))}
            </g>
          </g>
        );
      })}
    </g>
  );
}

/* ---------------------------------------------------------------- leyenda -- */

export function LegendSensorial({ x, y, step = 46 }: { x: number; y: number; step?: number }): JSX.Element {
  return (
    <g>
      <text x={x} y={y} fontSize={12} className="mono" fill="var(--color-ink)" style={{ letterSpacing: "0.1em" }}>
        LEYENDA SENSORIAL
      </text>
      {RING_ORDER.map((id, i) => {
        const cat = getCategory(id);
        const ry = y + 24 + i * step;
        const aboutLines = wrapText(cat.about, 40).slice(0, 2);
        return (
          <g key={id}>
            <rect x={x} y={ry} width={42} height={20} rx={4} fill={CATEGORY_COLOR[id]} />
            <text x={x + 21} y={ry + 14} textAnchor="middle" fontSize={11} fontWeight={700} className="mono" fill="var(--color-sunken)">
              {cat.code}
            </text>
            <text x={x + 54} y={ry + 10} fontSize={12.5} fontWeight={600} fill="var(--color-ink)">
              {cat.name}
            </text>
            <text x={x + 54} y={ry + 24} fontSize={10} fill="var(--color-ink-3)">
              {aboutLines.map((ln, j) => (
                <tspan key={j} x={x + 54} dy={j === 0 ? 0 : 11}>{ln}</tspan>
              ))}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* --------------------------------------------------------------- acciones -- */

const ACCIONES: { id: AccionId; verb: string; line: string; cat: CategoryId }[] = [
  { id: "entrar", verb: "ENTRAR", line: "Se reconoce y se comprende el lugar.", cat: "flow" },
  { id: "circular", verb: "CIRCULAR", line: "Se circula con flujo y orientación.", cat: "orientation" },
  { id: "esperar", verb: "ESPERAR", line: "Se transita el tiempo con confort.", cat: "wait" },
  { id: "descansar", verb: "DESCANSAR", line: "Se recupera energía en calma.", cat: "pause" },
];

export function AccionesClave({ x, y, step = 44 }: { x: number; y: number; step?: number }): JSX.Element {
  return (
    <g>
      <text x={x} y={y} fontSize={12} className="mono" fill="var(--color-ink)" style={{ letterSpacing: "0.1em" }}>
        ACCIONES CLAVE DEL SISTEMA
      </text>
      {ACCIONES.map((a, i) => {
        const ry = y + 22 + i * step;
        const color = CATEGORY_COLOR[a.cat];
        return (
          <g key={a.id}>
            <AccionGlyph id={a.id} x={x} y={ry} color={color} />
            <text x={x + 34} y={ry + 11} fontSize={12.5} fontWeight={700} fill={color} style={{ letterSpacing: "0.04em" }}>
              {a.verb}
            </text>
            <text x={x + 34} y={ry + 25} fontSize={10.5} fill="var(--color-ink-2)">
              {a.line}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ sello -- */

const SELLO_MAP: [string, string][] = [
  ["Sector", "una categoría por eje"],
  ["Longitud", "intensidad"],
  ["Grosor", "duración"],
  ["Opacidad", "confianza del dato"],
  ["Punto activo", "lecturas en curso"],
];

export function SelloBlock({ x, y, profile }: { x: number; y: number; profile: SensorProfile | undefined }): JSX.Element {
  return (
    <g>
      <text x={x} y={y} fontSize={12} className="mono" fill="var(--color-ink)" style={{ letterSpacing: "0.1em" }}>
        SELLO SENSORIAL
      </text>
      <text x={x} y={y + 18} fontSize={10.5} fill="var(--color-ink-3)">
        Sintetiza la lectura completa del entorno.
      </text>
      {profile && <SealGroup profile={profile} cx={x + 66} cy={y + 110} r={56} idSuffix={`lamina-${profile.id}`} />}
      {profile && (
        <text x={x + 66} y={y + 188} textAnchor="middle" fontSize={10} className="mono" fill="var(--color-ink-3)">
          {profile.code}
        </text>
      )}
      <g>
        {SELLO_MAP.map(([k, v], i) => {
          const ry = y + 46 + i * 24;
          return (
            <g key={k}>
              <text x={x + 148} y={ry} fontSize={11} fontWeight={600} fill="var(--color-ink)">{k}</text>
              <text x={x + 148} y={ry + 13} fontSize={10} fill="var(--color-ink-3)">{v}</text>
            </g>
          );
        })}
      </g>
    </g>
  );
}

/* -------------------------------------------------------------- multicapa -- */

export function MultilayerStack({ x, y, profiles }: { x: number; y: number; profiles: SensorProfile[] }): JSX.Element {
  const cx = x + 96;
  const top = y + 56;
  const dy = 26;
  const halfW = 74;
  const halfH = 38;

  /** capa = promedio de intensidad SOLO de los espacios que evaluaron la categoría */
  function layer(id: CategoryId): { on: boolean; a: number } {
    const evals = profiles.filter((p) => isEvaluated(p.params[id]));
    if (!evals.length) return { on: false, a: 0 };
    return { on: true, a: evals.reduce((s, p) => s + p.params[id].intensity, 0) / evals.length };
  }

  const anyOff = RING_ORDER.some((id) => !layer(id).on);

  return (
    <g>
      <text x={x} y={y} fontSize={12} className="mono" fill="var(--color-ink)" style={{ letterSpacing: "0.1em" }}>
        MAPA SENSORIAL MULTICAPA
      </text>
      <text x={x} y={y + 18} fontSize={10.5} fill="var(--color-ink-3)">
        Solo se prende la variable evaluada en el sitio.
      </text>
      {RING_ORDER.map((id, i) => {
        const cy = top + i * dy;
        const { on, a } = layer(id);
        const color = CATEGORY_COLOR[id];
        const d = `M ${cx} ${cy - halfH} L ${cx + halfW} ${cy} L ${cx} ${cy + halfH} L ${cx - halfW} ${cy} Z`;
        return (
          <g key={id}>
            <path
              d={d}
              fill={on ? color : "none"}
              fillOpacity={on ? 0.12 + 0.5 * a : 0}
              stroke={on ? color : "var(--color-line-strong)"}
              strokeOpacity={on ? 0.75 : 0.45}
              strokeWidth={1}
              strokeDasharray={on ? undefined : "3 4"}
            />
            <line x1={cx + halfW} y1={cy} x2={cx + halfW + 24} y2={cy} stroke={on ? color : "var(--color-line-strong)"} strokeOpacity={on ? 0.6 : 0.35} strokeWidth={1} />
            <text x={cx + halfW + 30} y={cy + 4} fontSize={11} className="mono" fontWeight={700} fill={on ? color : "var(--color-ink-3)"} opacity={on ? 1 : 0.55}>
              {getCategory(id).code}
            </text>
          </g>
        );
      })}
      <text x={x} y={top + RING_ORDER.length * dy + halfH + 6} fontSize={10} className="mono" fill="var(--color-ink-3)" style={{ letterSpacing: "0.08em" }}>
        {anyOff ? "TENUE = SIN EVALUAR" : "MAPA FINAL"}
      </text>
    </g>
  );
}

/* ----------------------------------------------------------- norte/escala -- */

export function NorthScale({ x, y, scale }: { x: number; y: number; scale: string }): JSX.Element {
  const ncx = x + 18;
  const ncy = y + 4;
  const up = arrowUp(ncx, ncy, 16);
  return (
    <g>
      {/* brújula */}
      <circle cx={ncx} cy={ncy} r={18} fill="none" stroke="var(--color-line-strong)" strokeWidth={1} />
      <path d={up} fill="var(--color-ink-2)" stroke="none" />
      <text x={ncx} y={ncy - 22} textAnchor="middle" fontSize={10} className="mono" fill="var(--color-ink-2)">N</text>
      {/* barra de escala */}
      <g>
        <line x1={x + 56} y1={ncy + 8} x2={x + 216} y2={ncy + 8} stroke="var(--color-ink-2)" strokeWidth={1.4} />
        {[0, 40, 100, 160].map((dx) => (
          <line key={dx} x1={x + 56 + dx} y1={ncy + 4} x2={x + 56 + dx} y2={ncy + 12} stroke="var(--color-ink-2)" strokeWidth={1.4} />
        ))}
        <text x={x + 56} y={ncy + 26} fontSize={10} className="mono" fill="var(--color-ink-3)">{scale}</text>
      </g>
    </g>
  );
}

function arrowUp(cx: number, cy: number, r: number): string {
  const [tx, tyP] = polar(cx, cy, r, 0);
  const [lx, ly] = polar(cx, cy, r * 0.5, 215);
  const [rx, ry] = polar(cx, cy, r * 0.5, 145);
  return `M ${tx} ${tyP} L ${lx} ${ly} L ${cx} ${cy} L ${rx} ${ry} Z`;
}

/* --------------------------------------------------------------- nota -- */

export function NotaMetodologica({ x, y, w }: { x: number; y: number; w: number }): JSX.Element {
  const text =
    "Mapa sensorial multicapa para anticipar las condiciones del entorno y facilitar la toma de decisiones. Las etiquetas resumen la lectura de cada espacio; los porcentajes son ilustrativos hasta sustituirlos por datos de estudio.";
  const lines = wrapText(text, Math.floor(w / 7.2));
  return (
    <g>
      <rect x={x} y={y} width={w} height={20 + lines.length * 14 + 14} rx={4} fill="var(--color-paper)" fillOpacity={0.3} stroke="var(--color-line)" strokeWidth={1} />
      <text x={x + 14} y={y + 22} fontSize={11} className="mono" fill="var(--color-accent)" style={{ letterSpacing: "0.1em" }}>
        NOTA METODOLÓGICA
      </text>
      <text x={x + 14} y={y + 40} fontSize={11} fill="var(--color-ink-2)">
        {lines.map((ln, i) => (
          <tspan key={i} x={x + 14} dy={i === 0 ? 0 : 14}>{ln}</tspan>
        ))}
      </text>
    </g>
  );
}

/** código corto del sitio para el nombre de archivo de exportación */
export function planoFileName(site: string): string {
  return `blueprint-${siteCode(site)}`;
}
