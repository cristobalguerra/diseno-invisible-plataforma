import { forwardRef, useEffect, useMemo, useState } from "react";
import type { CategoryId } from "../../lib/types";
import { getCategory } from "../../data/catalog";
import type { SensorProfile } from "../../lib/labels/types";
import { RING_ORDER } from "../../lib/labels/types";
import { intensitySeverity } from "../../lib/labels/profiles";
import { profileSheet } from "../../lib/labels/sheet";

/* ============================================================
   ETIQUETA SONA — la etiqueta de lectura de los lugares.
   Port del instrumento SONA (cristobalguerra.github.io/sona) al
   sistema Diseño Invisible: la lectura sensorial del espacio se
   clasifica en un ESTADO (7 familias de color) que tiñe la ficha
   completa, y la palabra "sona" vive en el cielo como vidrio
   líquido, recomponiéndose por compases (biblioteca de flancos).
   Autocontenida: no depende del tema de la app.
   ============================================================ */

const MOODS = [
  { id: "calm", nombre: "Calmado", proto: [0.85, 0.8, 0.3, 0.3, 0.75, 0.25, 0.3],
    cielo: ["#8fa0b4", "#aebbc6", "#cfd4d4", "#e3e0d8"], claroB: "#c6d4e0", profOsc: "#1f2c39", profCl: "#8ea2b5", barra: ["#d6dbdf", "#7d93ab"] },
  { id: "active", nombre: "Activo", proto: [0.5, 0.4, 0.9, 0.5, 0.85, 0.5, 0.4],
    cielo: ["#a8946a", "#c4b391", "#ded4b8", "#efe9d8"], claroB: "#e0d6ba", profOsc: "#3d3320", profCl: "#a89a78", barra: ["#e6ddc2", "#a8946a"] },
  { id: "busy", nombre: "Ajetreado", proto: [0.6, 0.75, 0.45, 0.5, 0.8, 0.6, 0.5],
    cielo: ["#6f9a9b", "#9bbcbb", "#c6d7d4", "#e2e7e0"], claroB: "#c4d8d5", profOsc: "#1f3a3a", profCl: "#84a6a4", barra: ["#d2e0dc", "#6f9a9b"] },
  { id: "crowded", nombre: "Concurrido", proto: [0.3, 0.15, 0.6, 0.75, 0.5, 0.85, 0.7],
    cielo: ["#a07868", "#bd9a8b", "#d8c0b3", "#ecdfd6"], claroB: "#dcc6ba", profOsc: "#3c2620", profCl: "#a5847a", barra: ["#e4d2c8", "#a07868"] },
  { id: "balanced", nombre: "Equilibrado", proto: [0.5, 0.6, 0.35, 0.35, 0.9, 0.4, 0.35],
    cielo: ["#7fa08c", "#a3b8a6", "#cfd8cc", "#e7e6da"], claroB: "#c9d8cd", profOsc: "#22352b", profCl: "#8fa89a", barra: ["#d6ded2", "#7fa08c"] },
  { id: "dynamic", nombre: "Dinámico", proto: [0.45, 0.3, 0.55, 0.6, 0.15, 0.75, 0.5],
    cielo: ["#8f8bb0", "#afaac8", "#d0cddf", "#e8e5ec"], claroB: "#cfcadf", profOsc: "#322c47", profCl: "#9a93b5", barra: ["#dcd8e6", "#8f8bb0"] },
  { id: "unstable", nombre: "Inestable", proto: [0.25, 0.15, 0.85, 0.9, 0.2, 0.8, 0.85],
    cielo: ["#7d7f85", "#a0a2a6", "#c6c7c9", "#e2e1de"], claroB: "#c9cbcd", profOsc: "#232427", profCl: "#96989c", barra: ["#d6d7d8", "#7d7f85"] },
];

/* biblioteca de flancos: los 8 estados de la palabra "sona"
   (Recursos 5-20 del sistema tipográfico SONA, cajas 200×200) */
const BIB_PATHS: Record<number, string> = {
  5: "M175,50c13.75,0,25-11.25,25-25h0c0-13.75-11.25-25-25-25H25C11.25,0,0,11.25,0,25h0v50h0c0,13.75,11.25,25,25,25h25c13.75,0,25,11.25,25,25h0c0,13.75-11.25,25-25,25h-25c-13.75,0-25,11.25-25,25h0c0,13.75,11.25,25,25,25h150c13.75,0,25-11.25,25-25h0v-50h0c0-13.75-11.25-25-25-25h-50c-13.75,0-25-11.25-25-25h0c0-13.75,11.25-25,25-25h50Z",
  6: "M185.46,0H62.5c-6.88,0-12.5,8.31-12.5,18.47s-11.25,18.47-25,18.47h0C11.25,36.94,0,48.19,0,61.94v113.06c0,13.75,11.25,25,25,25h37.5c6.88,0,12.5-11.25,12.5-25v-50c0-13.75,10.33-25,22.96-25s22.96,11.25,22.96,25v50c0,13.75,6.54,25,14.54,25h50c8,0,14.54-11.25,14.54-25V25c0-13.75-6.54-25-14.54-25ZM97.96,87.5c-12.63,0-22.96-11.25-22.96-25v-12.5c0-13.75,10.33-25,22.96-25s22.96,11.25,22.96,25v12.5c0,13.75-10.33,25-22.96,25Z",
  7: "M175,36.94c-13.75,0-25-8.31-25-18.47S138.75,0,125,0h-50c-13.75,0-25,8.31-25,18.47s-11.25,18.47-25,18.47h0C11.25,36.94,0,48.19,0,61.94v113.06c0,13.75,11.25,25,25,25h0c13.75,0,25-11.25,25-25v-100c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25v100c0,13.75,11.25,25,25,25h50c13.75,0,25-11.25,25-25V61.94c0-13.75-11.25-25-25-25h0Z",
  8: "M175,0h-100c-13.75,0-25,8.44-25,18.75s-11.25,18.75-25,18.75h0C11.25,37.5,0,48.75,0,62.5v112.5c0,13.75,11.25,25,25,25h150c13.75,0,25-11.25,25-25V25c0-13.75-11.25-25-25-25h0ZM100,125c0,13.75-11.25,25-25,25h0c-13.75,0-25-11.25-25-25v-50c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25v50Z",
  11: "M175,50c-13.75,0-25-11.25-25-25h0c0-13.75-11.25-25-25-25h-50c-13.75,0-25,0-25,0s-11.25,0-25,0h0C11.25,0,0,11.25,0,25v150c0,13.75,11.25,25,25,25h0c13.75,0,25-11.25,25-25h0c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25h0c0,13.75,11.25,25,25,25h50c13.75,0,25-11.25,25-25v-100c0-13.75-11.25-25-25-25h0Z",
  12: "M175,0h-100C61.25,0,50,0,50,0s-11.25,0-25,0h0C11.25,0,0,11.25,0,25v100c0,13.75,11.25,25,25,25h0c13.75,0,25,11.25,25,25h0c0,13.75,11.25,25,25,25h100c13.75,0,25-11.25,25-25V25C200,11.25,188.75,0,175,0h0ZM150,125c0,13.75-11.25,25-25,25h0c-13.75,0-25-11.25-25-25v-50c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25v50Z",
  13: "M175,50c13.75,0,25-11.25,25-25h0c0-13.75-11.25-25-25-25H25C11.25,0,0,11.25,0,25h0v50h0c0,13.75,11.25,25,25,25h50c13.75,0,25,11.25,25,25h0c0,13.75-11.25,25-25,25H25c-13.75,0-25,11.25-25,25h0c0,13.75,11.25,25,25,25h150c13.75,0,25-11.25,25-25h0v-50h0c0-13.75-11.25-25-25-25h-43.75c-13.75,0-25-11.25-25-25h0c0-13.75,11.25-25,25-25h43.75Z",
  15: "M175,0h-100c-13.75,0-25,8.44-25,18.75s-11.25,18.75-25,18.75h0C11.25,37.5,0,48.75,0,62.5v112.5c0,13.75,11.25,25,25,25h0c13.75,0,25-11.25,25-25v-100c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25v100c0,13.75,11.25,25,25,25h50c13.75,0,25-11.25,25-25V25c0-13.75-11.25-25-25-25h0Z",
  16: "M175,0h-100c-13.75,0-25,11.25-25,25h0c0,13.75-11.25,25-25,25h0c-13.75,0-25,11.25-25,25v100c0,13.75,11.25,25,25,25h150c13.75,0,25-11.25,25-25V25c0-13.75-11.25-25-25-25h0ZM150,162.5c0,13.75-11.25,25-25,25h0c-13.75,0-25-11.25-25-25v-87.5c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25v87.5Z",
  17: "M175,50c13.75,0,25-11.25,25-25h0c0-13.75-11.25-25-25-25H25C11.25,0,0,11.25,0,25h0v50h0c0,13.75,11.25,25,25,25h0c13.75,0,25,11.25,25,25h0c0,13.75-11.25,25-25,25h0c-13.75,0-25,11.25-25,25h0c0,13.75,11.25,25,25,25h150c13.75,0,25-11.25,25-25h0v-50h0c0-13.75-11.25-25-25-25h-96.47c-13.75,0-25-11.25-25-25h0c0-13.75,11.25-25,25-25h96.47Z",
  18: "M175,0H25C11.25,0,0,11.25,0,25v150c0,13.75,11.25,25,25,25h0c13.75,0,25-11.25,25-25v-50c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25v50c0,13.75,11.25,25,25,25h0c13.75,0,25-11.25,25-25h0c0-13.75,11.25-25,25-25h0c13.75,0,25-11.25,25-25V25c0-13.75-11.25-25-25-25h0ZM100,62.5c0,13.75-11.25,25-25,25h0c-13.75,0-25-11.25-25-25v-12.5c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25v12.5Z",
  19: "M175,50c-13.75,0-25-11.25-25-25h0c0-13.75-11.25-25-25-25h-50c-13.75,0-25,0-25,0s-11.25,0-25,0h0C11.25,0,0,11.25,0,25v150c0,13.75,11.25,25,25,25h0c13.75,0,25-11.25,25-25v-100c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25v100c0,13.75,11.25,25,25,25h50c13.75,0,25-11.25,25-25v-100c0-13.75-11.25-25-25-25h0Z",
  20: "M175,0h-100c-13.75,0-25,11.25-25,25h0c0,13.75-11.25,25-25,25h0c-13.75,0-25,11.25-25,25v100c0,13.75,11.25,25,25,25h150c13.75,0,25-11.25,25-25V25c0-13.75-11.25-25-25-25h0ZM150,125c0,13.75-11.25,25-25,25h0c-13.75,0-25-11.25-25-25V37.5c0-13.75,11.25-25,25-25h0c13.75,0,25,11.25,25,25v87.5Z",
};

/* partitura de 8 compases para "sona": abierto → pares → todas →
   impares → primera → todas → última → abierto (corte seco) */
const SCORE: number[][] = [
  [17, 16, 7, 6],
  [13, 8, 15, 18],
  [13, 12, 11, 18],
  [17, 20, 19, 6],
  [13, 8, 7, 6],
  [13, 12, 11, 18],
  [17, 16, 15, 18],
  [17, 16, 7, 6],
];
const XS = [0, 220, 440, 660];
const PAL_W = 860;
const ESC = Math.min(560 / PAL_W, 0.72) * 0.8;
const PAL_OX = 350 - (PAL_W * ESC) / 2;
const PAL_OY = 200 - 100 * ESC;   /* cielo 0..400, palabra centrada */

function mezclaHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

/* Diseño Invisible → lecturas SONA (0..1, orden L,P,S,V,O,F,M).
   La intensidad DI mide CARGA sensorial; algunas dimensiones SONA
   miden lo contrario (pausa disponible, orientación congruente,
   claridad visual), de ahí las inversiones. */
function lecturasSona(p: SensorProfile): number[] {
  const x = (id: CategoryId) => p.params[id]?.intensity ?? 0;
  return [
    x("light"),
    1 - x("pause"),
    x("sound"),
    1 - x("visual"),
    1 - x("orientation"),
    x("flow"),
    x("wait"),
  ];
}

function moodDe(lects: number[]) {
  let mejor = MOODS[0], mejorD = Infinity;
  for (const m of MOODS) {
    let d = 0;
    for (let i = 0; i < 7; i++) d += Math.abs(lects[i] - m.proto[i]);
    if (d < mejorD) { mejorD = d; mejor = m; }
  }
  return mejor;
}

/* Blueprint Sensorial: el color identifica al factor (Eva Heller);
   la intensidad se comunica con tratamientos de saturación:
   bajo = +40% blanco · medio = +20% · alto = color base. */
const FACTOR_COLOR: Record<CategoryId, string> = {
  sound: "#6F90B5",
  light: "#D9C67A",
  flow: "#7E9B83",
  wait: "#C98A63",
  orientation: "#6D9FA6",
  visual: "#9087A8",
  pause: "#C8C1B2",
};
const NIVEL_MEZCLA = [0.4, 0.2, 0];

/* NIVEL 1 — interpretación inmediata por estado: significado, no
   métricas. Responde "¿qué encontraré y cómo podría sentirme?" */
const INTERPRETACION: Record<string, string[]> = {
  calm: ["Carga sensorial baja.", "Ideal para permanecer largos periodos.", "No se esperan cambios abruptos."],
  active: ["Hay energía y sonido presentes.", "Buen lugar para lo social; concentrarse puede costar.", "Los estímulos suben y bajan con la actividad."],
  busy: ["Movimiento constante, con orden.", "Funciona bien para estancias breves.", "Conviene ubicar las zonas de pausa al llegar."],
  crowded: ["Mucha gente y pocas pausas disponibles.", "La exigencia sensorial se acumula con el tiempo.", "Mejor en horarios valle o con preparativos."],
  balanced: ["Estímulos moderados y orientación clara.", "Compatible con la mayoría de las necesidades.", "Puedes decidir tu ritmo sin presión."],
  dynamic: ["El entorno cambia con frecuencia.", "Pueden ocurrir cambios inesperados.", "Planifica estancias cortas o flexibles."],
  unstable: ["Estímulos altos y poco predecibles.", "La visita puede resultar demandante.", "Se recomienda visita breve o acompañada."],
};

function partirLineas(texto: string, max: number, lineas: number): string[] {
  const out: string[] = [];
  let linea = "";
  for (const w of (texto || "").split(/\s+/)) {
    if ((linea + " " + w).trim().length > max) {
      out.push(linea.trim());
      linea = w;
      if (out.length === lineas - 1) break;
    } else linea = (linea + " " + w).trim();
  }
  if (linea && out.length < lineas) out.push(linea.trim());
  return out;
}

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const SANS = '"Inter", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

function useCompasSona(): number {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* compás sereno: la palabra respira sin volverse estímulo */
    const t = setInterval(() => setBeat((b) => (b + 1) % SCORE.length), 1200);
    return () => clearInterval(t);
  }, []);
  return beat;
}

/* ============================================================
   CIELO SONA — capa de apertura del celular: el color del estado
   a pantalla completa con la palabra "sona" SIEMPRE al centro del
   espacio. La hoja de lectura desliza por encima.
   ============================================================ */
export function CieloSona({ profile }: { profile: SensorProfile }) {
  const lects = useMemo(() => lecturasSona(profile), [profile]);
  const mood = useMemo(() => moodDe(lects), [lects]);
  return (
    <svg
      viewBox="0 0 700 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id="cieloFull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mood.cielo[0]} />
          <stop offset="0.45" stopColor={mood.cielo[1]} />
          <stop offset="0.78" stopColor={mood.cielo[2]} />
          <stop offset="1" stopColor={mood.cielo[3]} />
        </linearGradient>
        <filter id="granoFull" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
        </filter>
      </defs>
      <rect width="700" height="1000" fill="url(#cieloFull)" />
      <rect width="700" height="1000" filter="url(#granoFull)" opacity="0.2" style={{ mixBlendMode: "overlay" }} />
    </svg>
  );
}

/* La palabra sona flotante con el nombre del ESTADO SIEMPRE debajo:
   el héroe móvil que viaja del centro a la parte superior. */
/* ============================================================
   DIMENSIÓN SONA — slide de detalle de una dimensión: nivel,
   escalera del factor en grande, qué significa y qué puedo hacer.
   Mismo lienzo/tipografía que la hoja principal (700×920).
   ============================================================ */
export function DimensionSona({ profile, id }: { profile: SensorProfile; id: CategoryId }) {
  /* Detalle compacto de una dimensión: cabe EXACTO en la caja del
     slider (700×318), con el resto de la hoja fija alrededor. */
  const cat = getCategory(id);
  const sev = intensitySeverity(profile.params[id]?.intensity ?? 0);
  const nivel = cat.levels[sev];
  const tinta = "#1F334F";
  const significa = partirLineas(nivel.message, 52, 2);
  const hacer = partirLineas(nivel.decision, 52, 2);
  return (
    <svg viewBox="0 0 700 318" role="img" aria-label={`${cat.name}: ${nivel.label}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect width="700" height="318" fill="#F7F4EE" />
      <text x="40" y="34" fill={tinta} opacity={0.6} style={{ font: `500 16px ${MONO}`, letterSpacing: "0.14em" }}>{cat.name.toUpperCase()}</text>
      <text x="40" y="86" fill={tinta} style={{ font: `300 42px "Inter", system-ui, sans-serif` }}>{nivel.short}</text>
      {[0, 1, 2].map((c) => (
        <rect
          key={c}
          x={460 + c * 70}
          y={58}
          width={60}
          height={19}
          rx={9.5}
          fill={c <= sev ? mezclaHex(FACTOR_COLOR[id], "#FFFFFF", NIVEL_MEZCLA[c]) : tinta}
          opacity={c <= sev ? 1 : 0.12}
          stroke={c <= sev ? mezclaHex(FACTOR_COLOR[id], tinta, 0.35) : "none"}
          strokeWidth={c <= sev ? 0.75 : 0}
        />
      ))}
      <text x="40" y="146" fill={tinta} opacity={0.75} style={{ font: `500 14px ${MONO}`, letterSpacing: "0.14em" }}>QUÉ SIGNIFICA</text>
      {significa.map((ln, i) => (
        <text key={i} x="40" y={178 + i * 32} fill={tinta} opacity={0.85} style={{ font: `400 22px "Inter", system-ui, sans-serif` }}>{ln}</text>
      ))}
      {hacer.map((ln, i) => (
        <text key={`h${i}`} x="40" y={252 + i * 32} fill={tinta} opacity={0.9} style={{ font: `400 22px "Inter", system-ui, sans-serif` }}>{`· ${ln}`}</text>
      ))}
    </svg>
  );
}

export function tonoProfundo(profile: SensorProfile): string {
  /* tono de TEXTO sobre el cielo: cerca del oscuro del mood para
     sostener AA (≥4.5:1) incluso en la franja media del gradiente */
  const lects = lecturasSona(profile);
  const mood = moodDe(lects);
  return mezclaHex(mood.profOsc, mood.profCl, lects[0] * 0.3);
}

export function PalabraSona({ profile, estadoVisible = true }: { profile: SensorProfile; estadoVisible?: boolean }) {
  const beat = useCompasSona();
  const lects = useMemo(() => lecturasSona(profile), [profile]);
  const mood = useMemo(() => moodDe(lects), [lects]);
  const pctCarga = useMemo(() => Math.round(profileSheet(profile).load * 100), [profile]);
  const luz = lects[0];
  const claro = mezclaHex(mood.claroB, "#ffffff", luz);
  const profundo = mezclaHex(mood.profOsc, mood.profCl, luz);
  const tintaCielo = mezclaHex(mood.profOsc, mood.profCl, luz * 0.3);
  const ids = SCORE[beat];
  return (
    <div className="flex flex-col items-center" style={{ gap: 30 }}>
      <svg viewBox="-30 -30 920 260" aria-label="sona" style={{ width: "min(74vw, 400px)", display: "block" }}>
        <defs>
          <filter id="vidrioFlot" x="-20%" y="-30%" width="140%" height="170%">
            <feOffset in="SourceAlpha" dy="5" result="dAbajo" />
            <feComposite in="SourceAlpha" in2="dAbajo" operator="out" result="crestaLuz" />
            <feGaussianBlur in="crestaLuz" stdDeviation="2.2" result="crestaLuzB" />
            <feFlood floodColor={mezclaHex(claro, "#ffffff", 0.75)} floodOpacity="0.42" />
            <feComposite in2="crestaLuzB" operator="in" result="luz" />
            <feOffset in="SourceAlpha" dy="-5" result="dArriba" />
            <feComposite in="SourceAlpha" in2="dArriba" operator="out" result="crestaSom" />
            <feGaussianBlur in="crestaSom" stdDeviation="2.6" result="crestaSomB" />
            <feFlood floodColor={profundo} floodOpacity="0.28" />
            <feComposite in2="crestaSomB" operator="in" result="som" />
            <feFlood floodColor={claro} floodOpacity="0.06" />
            <feComposite in2="SourceAlpha" operator="in" result="cuerpo" />
            <feMerge>
              <feMergeNode in="cuerpo" />
              <feMergeNode in="som" />
              <feMergeNode in="luz" />
            </feMerge>
          </filter>
          <filter id="somPalFlot" x="-30%" y="-40%" width="160%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <g transform="translate(0 13)" filter="url(#somPalFlot)" opacity="0.16" fill={profundo}>
          {ids.map((id, i) => (
            <path key={`s${i}`} transform={`translate(${XS[i]} 0)`} d={BIB_PATHS[id]} />
          ))}
        </g>
        <g filter="url(#vidrioFlot)">
          {ids.map((id, i) => (
            <path key={`v${i}`} transform={`translate(${XS[i]} 0)`} d={BIB_PATHS[id]} />
          ))}
        </g>
      </svg>
      <div
        className="flex flex-col items-center"
        style={{ gap: 14, opacity: estadoVisible ? 1 : 0, transition: "opacity 400ms ease" }}
      >
        <span
          style={{
            color: tintaCielo,
            font: '500 13px "IBM Plex Mono", ui-monospace, monospace',
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            paddingLeft: "0.3em",
          }}
        >
          {mood.nombre}
        </span>
        <span aria-label={`Carga sensorial ${pctCarga}%`} style={{ color: tintaCielo, font: '200 21px "Inter", system-ui, sans-serif' }}>
          {`${pctCarga}%`}
        </span>
      </div>
    </div>
  );
}

export const EtiquetaSona = forwardRef<SVGSVGElement, { profile: SensorProfile; animateIn?: boolean; plena?: boolean; hoja?: boolean; recorte?: string }>(
  function EtiquetaSona({ profile, plena, hoja, recorte }, ref) {
    const beat = useCompasSona();

    const lects = useMemo(() => lecturasSona(profile), [profile]);
    const mood = useMemo(() => moodDe(lects), [lects]);
    const luz = lects[0];
    const claro = mezclaHex(mood.claroB, "#ffffff", luz);
    const profundo = mezclaHex(mood.profOsc, mood.profCl, luz);
    const papel = "#F7F4EE";        /* fondo del blueprint (fijo) */
    const tinta = "#1F334F";        /* color estructura */
    const sheet = useMemo(() => profileSheet(profile), [profile]);
    const pctCarga = Math.round(sheet.load * 100);
    const anchoLleno = 620 * (pctCarga / 100);
    const interpretacion = INTERPRETACION[mood.id] ?? [];
    /* NIVEL 3 — recomendaciones accionables: primero las dimensiones
       más exigentes; si todo está bajo, el espacio simplemente recibe */
    const recomendaciones = [...sheet.rows]
      .sort((a, b) => b.pct - a.pct)
      .map((r) => r.recommendation)
      .filter(Boolean)
      .slice(0, 3);
    const ids = SCORE[beat];

    /* filas de medidores: orden angular canónico, 2 columnas */
    const filas = RING_ORDER.map((id) => {
      const cat = getCategory(id);
      const sev = intensitySeverity(profile.params[id]?.intensity ?? 0);
      return { id, nombre: cat.name, sev };
    });

    /* fila de UNA línea: nombre a la izquierda y escalera del factor a
       la derecha — el nivel se lee contando celdas llenas; escribirlo
       sería redundante */
    const metro = (f: (typeof filas)[number], x: number, y: number) => (
      <g key={f.id}>
        <text x={x} y={y} fill={tinta} opacity={0.8} style={{ font: `500 19px ${MONO}`, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {f.nombre.toUpperCase()}
        </text>
        {[0, 1, 2].map((c) => (
          <rect
            key={c}
            x={x + 420 + c * 70}
            y={y - 16}
            width={60}
            height={19}
            rx={9.5}
            fill={c <= f.sev ? mezclaHex(FACTOR_COLOR[f.id], "#FFFFFF", NIVEL_MEZCLA[c]) : tinta}
            opacity={c <= f.sev ? 1 : 0.12}
            stroke={c <= f.sev ? mezclaHex(FACTOR_COLOR[f.id], tinta, 0.35) : "none"}
            strokeWidth={c <= f.sev ? 0.75 : 0}
          />
        ))}
      </g>
    );

    return (
      <svg
        ref={ref}
        viewBox={recorte ?? (hoja ? "0 400 700 920" : "0 0 700 1320")}
        role="img"
        aria-label={`Etiqueta SONA de ${profile.name}`}
        style={plena
          ? { width: "100%", height: "auto", display: "block" }
          : { width: "100%", height: "auto", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.35)" }}
      >
        <defs>
          <linearGradient id="cieloSona" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mood.cielo[0]} />
            <stop offset="0.42" stopColor={mood.cielo[1]} />
            <stop offset="0.74" stopColor={mood.cielo[2]} />
            <stop offset="1" stopColor={mood.cielo[3]} />
          </linearGradient>
          <linearGradient id="barraSona" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={mood.barra[0]} />
            <stop offset="1" stopColor={mood.barra[1]} />
          </linearGradient>
          <linearGradient id="metroSona" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mood.barra[1]} />
            <stop offset="1" stopColor={mood.barra[0]} />
          </linearGradient>
          <filter id="vidrioSona" x="-20%" y="-30%" width="140%" height="170%">
            <feOffset in="SourceAlpha" dy="5" result="dAbajo" />
            <feComposite in="SourceAlpha" in2="dAbajo" operator="out" result="crestaLuz" />
            <feGaussianBlur in="crestaLuz" stdDeviation="2.2" result="crestaLuzB" />
            <feFlood floodColor={mezclaHex(claro, "#ffffff", 0.75)} floodOpacity="0.42" />
            <feComposite in2="crestaLuzB" operator="in" result="luz" />
            <feOffset in="SourceAlpha" dy="-5" result="dArriba" />
            <feComposite in="SourceAlpha" in2="dArriba" operator="out" result="crestaSom" />
            <feGaussianBlur in="crestaSom" stdDeviation="2.6" result="crestaSomB" />
            <feFlood floodColor={profundo} floodOpacity="0.28" />
            <feComposite in2="crestaSomB" operator="in" result="som" />
            <feFlood floodColor={claro} floodOpacity="0.06" />
            <feComposite in2="SourceAlpha" operator="in" result="cuerpo" />
            <feMerge>
              <feMergeNode in="cuerpo" />
              <feMergeNode in="som" />
              <feMergeNode in="luz" />
            </feMerge>
          </filter>
          <filter id="somPalSona" x="-30%" y="-40%" width="160%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="granoSona" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          </filter>
        </defs>

        <rect width="700" height="1320" rx={plena ? 0 : 26} fill={papel} />
        <clipPath id="recorteSona"><rect width="700" height="1320" rx={plena ? 0 : 26} /></clipPath>
        <g clipPath="url(#recorteSona)">
          <rect width="700" height="400" fill="url(#cieloSona)" />
          {/* palabra sona en vidrio líquido, recomponiéndose por compases */}
          <g transform="translate(0 13)" filter="url(#somPalSona)" opacity="0.16" fill={profundo}>
            {ids.map((id, i) => (
              <path key={`s${i}`} transform={`translate(${(PAL_OX + XS[i] * ESC).toFixed(1)} ${PAL_OY.toFixed(1)}) scale(${ESC.toFixed(4)})`} d={BIB_PATHS[id]} />
            ))}
          </g>
          <g filter="url(#vidrioSona)">
            {ids.map((id, i) => (
              <path key={`v${i}`} transform={`translate(${(PAL_OX + XS[i] * ESC).toFixed(1)} ${PAL_OY.toFixed(1)}) scale(${ESC.toFixed(4)})`} d={BIB_PATHS[id]} />
            ))}
          </g>
          <rect width="700" height="400" filter="url(#granoSona)" opacity="0.3" style={{ mixBlendMode: "overlay" }} />
        </g>

        {/* NIVEL 1 — la hoja arranca en el ESTADO */}
        <text x="40" y="444" fill={tinta} opacity={0.6} style={{ font: `500 16px ${MONO}`, letterSpacing: "0.14em" }}>ESTADO</text>
        <text x="40" y="508" fill={tinta} style={{ font: `300 58px ${SANS}` }}>{mood.nombre}</text>
        {interpretacion.map((ln, i) => (
          <text key={i} x="40" y={548 + i * 36} fill={tinta} opacity={0.85} style={{ font: `400 24px ${SANS}` }}>{ln}</text>
        ))}

        {/* carga sensorial: barra redondeada, la etiqueta por detrás */}
        <g>
          <clipPath id="cargaClipSona"><rect x="40" y="654" width="620" height="68" rx="20" /></clipPath>
          <rect x="40" y="654" width="620" height="68" rx="20" fill={tinta} opacity="0.08" />
          <rect x="40" y="654" width={anchoLleno} height="68" clipPath="url(#cargaClipSona)" fill="url(#barraSona)" />
          <text x="66" y="695" fill={tinta} style={{ font: `500 18px ${MONO}`, letterSpacing: "0.14em" }}>CARGA SENSORIAL</text>
          <text x="634" y="699" fill={tinta} textAnchor="end" style={{ font: `300 30px ${SANS}` }}>{`${pctCarga}%`}</text>
        </g>

        <line x1="40" y1="752" x2="660" y2="752" stroke={tinta} strokeWidth="1" opacity="0.14" />

        {/* medidores en una columna: comparables de un vistazo */}
        {filas.map((f, i) => metro(f, 40, 794 + i * 41))}

        <line x1="40" y1="1070" x2="660" y2="1070" stroke={tinta} strokeWidth="1" opacity="0.14" />

        {/* NIVEL 3 — qué puedo hacer */}
        <text x="40" y="1108" fill={tinta} opacity={0.75} style={{ font: `500 16px ${MONO}`, letterSpacing: "0.14em" }}>QUÉ PUEDO HACER</text>
        {recomendaciones.map((ln, i) => (
          <text key={i} x="40" y={1146 + i * 36} fill={tinta} opacity={0.9} style={{ font: `400 24px ${SANS}` }}>{`· ${ln}`}</text>
        ))}

        {/* firma serif */}
        <text x="350" y="1288" textAnchor="middle" fill="#000000" style={{ font: `italic 400 28px ${SERIF}`, letterSpacing: "0.03em" }}>sona</text>

        {/* pie */}
        <text x="40" y="1286" fill={tinta} opacity={0.55} style={{ font: `500 13px ${MONO}`, letterSpacing: "0.1em" }}>BIENESTAR SENSORIAL</text>
        <text x="660" y="1286" fill={tinta} opacity={0.55} textAnchor="end" style={{ font: `500 13px ${MONO}`, letterSpacing: "0.08em" }}>ANTICIPA TU ENTORNO</text>
      </svg>
    );
  }
);
