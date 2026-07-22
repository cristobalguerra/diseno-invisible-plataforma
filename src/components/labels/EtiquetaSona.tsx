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
const PAL_OY = 158 - 100 * ESC;

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

function partirLineas(texto: string, max: number, lineas: number): string[] {
  const out: string[] = [];
  let linea = "";
  for (const w of texto.split(/\s+/)) {
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

export const EtiquetaSona = forwardRef<SVGSVGElement, { profile: SensorProfile; animateIn?: boolean }>(
  function EtiquetaSona({ profile }, ref) {
    const [beat, setBeat] = useState(0);
    useEffect(() => {
      if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const t = setInterval(() => setBeat((b) => (b + 1) % SCORE.length), 600);
      return () => clearInterval(t);
    }, []);

    const lects = useMemo(() => lecturasSona(profile), [profile]);
    const mood = useMemo(() => moodDe(lects), [lects]);
    const luz = lects[0];
    const claro = mezclaHex(mood.claroB, "#ffffff", luz);
    const profundo = mezclaHex(mood.profOsc, mood.profCl, luz);
    const papel = mezclaHex("#f1f0ea", mood.cielo[3], 0.5);
    const tinta = "#3d4e60";
    const pct = Math.round((lects.reduce((a, b) => a + b, 0) / 7) * 100);
    const sheet = useMemo(() => profileSheet(profile), [profile]);
    const descLineas = partirLineas(sheet.anticipation, 56, 3);
    const fecha = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "numeric", year: "numeric" });
    const firmaTec = RING_ORDER.map((id) => `${getCategory(id).code}·${intensitySeverity(profile.params[id]?.intensity ?? 0) + 1}`).join("  ");
    const ids = SCORE[beat];

    /* filas de medidores: orden angular canónico, 2 columnas */
    const filas = RING_ORDER.map((id) => {
      const cat = getCategory(id);
      const sev = intensitySeverity(profile.params[id]?.intensity ?? 0);
      return { id, nombre: cat.name, palabra: cat.levels[sev].short, marca: profile.params[id]?.intensity ?? 0 };
    });
    const colIzq = filas.slice(0, 4), colDer = filas.slice(4);

    const metro = (f: (typeof filas)[number], x: number, y: number) => (
      <g key={f.id}>
        <text x={x} y={y + 4} fill={tinta} opacity={0.6} style={{ font: `500 9.5px ${MONO}`, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {f.nombre.toUpperCase()}
        </text>
        <text x={x} y={y + 30} fill={tinta} style={{ font: `300 21px ${SANS}` }}>
          {f.palabra}
        </text>
        <rect x={x + 218} y={y - 6} width={8} height={44} rx={4} fill={`url(#metroSona)`} />
        <rect x={x + 216.5} y={y - 6 + (1 - f.marca) * 41} width={11} height={2.5} fill={tinta} />
      </g>
    );

    return (
      <svg ref={ref} viewBox="0 0 700 1000" role="img" aria-label={`Etiqueta SONA de ${profile.name}`} style={{ width: "100%", height: "auto", borderRadius: 18, boxShadow: "0 24px 60px rgba(0,0,0,.35)" }}>
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
          <filter id="granoSona">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          </filter>
        </defs>

        <rect width="700" height="1000" rx="26" fill={papel} />
        <clipPath id="recorteSona"><rect width="700" height="1000" rx="26" /></clipPath>
        <g clipPath="url(#recorteSona)">
          <rect width="700" height="310" fill="url(#cieloSona)" />
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
          <rect width="700" height="310" filter="url(#granoSona)" opacity="0.3" style={{ mixBlendMode: "overlay" }} />
        </g>

        {/* cabecera */}
        <text x="40" y="348" fill={tinta} style={{ font: `500 11px ${MONO}`, letterSpacing: "0.16em" }}>LECTURA DEL LUGAR</text>
        <text x="660" y="348" fill={tinta} textAnchor="end" style={{ font: `500 11px ${MONO}`, letterSpacing: "0.12em" }}>{fecha}</text>
        <text x="40" y="372" fill={tinta} opacity={0.6} style={{ font: `500 10px ${MONO}`, letterSpacing: "0.12em" }}>
          {`${profile.site.toUpperCase()} · ${profile.name.toUpperCase()} · ${profile.code}`}
        </text>

        {/* héroe: índice + estado */}
        <text x="40" y="412" fill={tinta} opacity={0.6} style={{ font: `500 10px ${MONO}`, letterSpacing: "0.14em" }}>ÍNDICE DEL LUGAR</text>
        <text x="40" y="464" fill={tinta} style={{ font: `200 58px ${SANS}` }}>
          {pct}<tspan style={{ font: `300 22px ${SANS}` }} opacity={0.55}>%</tspan>
        </text>
        <text x="660" y="412" fill={tinta} opacity={0.6} textAnchor="end" style={{ font: `500 10px ${MONO}`, letterSpacing: "0.14em" }}>ESTADO</text>
        <text x="660" y="452" fill={tinta} textAnchor="end" style={{ font: `300 34px ${SANS}` }}>{mood.nombre}</text>

        <line x1="40" y1="492" x2="660" y2="492" stroke={tinta} strokeWidth="1" opacity="0.14" />

        {/* medidores en dos columnas */}
        {colIzq.map((f, i) => metro(f, 40, 528 + i * 64))}
        {colDer.map((f, i) => metro(f, 380, 528 + i * 64))}

        <line x1="40" y1="790" x2="660" y2="790" stroke={tinta} strokeWidth="1" opacity="0.14" />

        {/* descripción anticipatoria */}
        <text x="40" y="814" fill={tinta} opacity={0.75} style={{ font: `500 9px ${MONO}`, letterSpacing: "0.14em" }}>DESCRIPCIÓN DEL ESPACIO</text>
        {descLineas.map((ln, i) => (
          <text key={i} x="40" y={838 + i * 21} fill={tinta} style={{ font: `400 11.5px ${MONO}` }}>{ln}</text>
        ))}

        {/* barra índice */}
        <g>
          <clipPath id="barraClipSona"><rect x="40" y="898" width="620" height="42" rx="13" /></clipPath>
          <rect x="40" y="898" width="620" height="42" rx="13" fill="url(#barraSona)" />
          <rect x={40 + 620 * (pct / 100)} y="898" width={620 * (1 - pct / 100)} height="42" clipPath="url(#barraClipSona)" fill={papel} opacity="0.82" />
          <text x="54" y="926" fill={tinta} style={{ font: `300 22px ${SANS}` }}>
            {pct}<tspan style={{ font: `300 11px ${SANS}` }} opacity={0.5}>%</tspan>
          </text>
        </g>

        {/* firma serif */}
        <text x="350" y="972" textAnchor="middle" fill="#000000" style={{ font: `italic 400 26px ${SERIF}`, letterSpacing: "0.03em" }}>sona</text>

        {/* pie */}
        <text x="40" y="992" fill={tinta} opacity={0.55} style={{ font: `500 8.5px ${MONO}`, letterSpacing: "0.12em" }}>SONA · LECTURA DEL LUGAR</text>
        <text x="660" y="992" fill={tinta} opacity={0.55} textAnchor="end" style={{ font: `500 8.5px ${MONO}`, letterSpacing: "0.1em" }}>{firmaTec}</text>
      </svg>
    );
  }
);
