import { forwardRef } from "react";
import type { Zone } from "../../lib/types";
import { getCategory, SEVERITY_COLOR, levelCode } from "../../data/catalog";
import { computePriority, relevantSignals, PRIORITY_SEVERITY } from "../../lib/priority";
import { wrapText } from "../../lib/svg";
import { GLYPHS } from "../pictogram/glyphs";

const W = 460;
const PAD = 24;
const SIGNALS_TOP = 116;
const ROW_H = 88;

const PRIORITY_LABEL: Record<"alta" | "media" | "baja", string> = {
  alta: "Prioridad alta",
  media: "Prioridad media",
  baja: "Prioridad baja",
};

/**
 * Ficha de zona (paper §4.4): hoja de señalética que reúne las condiciones a
 * anticipar en un punto del recorrido, con su prioridad de intervención.
 * SVG autocontenido y exportable.
 */
export const FichaZona = forwardRef<SVGSVGElement, { zone: Zone; size?: number }>(
  function FichaZona({ zone, size = W }, ref) {
    const signals = relevantSignals(zone.levels);
    const priority = computePriority(zone.levels);
    const priColor = SEVERITY_COLOR[PRIORITY_SEVERITY[priority.level]];

    const rows = signals.length || 1;
    const footerTop = SIGNALS_TOP + rows * ROW_H + 8;
    const interventionLines = wrapText(priority.intervention, 58);
    const H = footerTop + 32 + interventionLines.length * 15 + 16;

    const reasonLines = wrapText(priority.reason, 50);

    return (
      <svg
        ref={ref}
        width={size}
        height={(size * H) / W}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Ficha de zona ${zone.code} ${zone.name}, ${PRIORITY_LABEL[priority.level]}`}
        style={{ color: "var(--color-ink)", display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x={1} y={1} width={W - 2} height={H - 2} rx={12} fill="var(--color-paper)" stroke="var(--color-line-strong)" strokeWidth={1.5} />

        {/* cabecera */}
        <text x={PAD} y={32} className="mono" fontSize={12} fill="var(--color-ink-3)" letterSpacing="0.6">
          {zone.code}
        </text>
        <text x={PAD} y={62} fontSize={22} fontWeight={700} fill="var(--color-ink)" letterSpacing="-0.3">
          {zone.name}
        </text>

        {/* etiqueta de prioridad */}
        <g>
          <rect x={W - PAD - 138} y={16} width={138} height={28} rx={14} fill="var(--color-paper)" stroke="var(--color-line)" strokeWidth={1} />
          <circle cx={W - PAD - 138 + 18} cy={30} r={5} fill={priColor} />
          <text x={W - PAD - 138 + 31} y={34} fontSize={12.5} fontWeight={600} fill="var(--color-ink)">
            {PRIORITY_LABEL[priority.level]}
          </text>
        </g>

        <text x={PAD} y={88} fontSize={12} fill="var(--color-ink-2)">
          {reasonLines.map((ln, i) => (
            <tspan key={i} x={PAD} dy={i === 0 ? 0 : 14}>
              {ln}
            </tspan>
          ))}
        </text>
        <line x1={PAD} y1={104} x2={W - PAD} y2={104} stroke="var(--color-line)" strokeWidth={1} />

        {/* señales */}
        {signals.length === 0 ? (
          <text x={PAD} y={SIGNALS_TOP + 34} fontSize={14} fill="var(--color-ink-2)">
            Zona tranquila: sin condiciones que anticipar.
          </text>
        ) : (
          signals.map((s, i) => {
            const cat = getCategory(s.id);
            const level = cat.levels[s.sev];
            const Glyph = GLYPHS[s.id];
            const y = SIGNALS_TOP + i * ROW_H;
            const color = SEVERITY_COLOR[s.sev];
            const meterH = [8, 13, 18];
            const meterX = W - PAD - 21;
            const decisionLine = wrapText(level.decision, 46)[0];
            return (
              <g key={s.id}>
                <g transform={`translate(${PAD} ${y + 12}) scale(${60 / 96})`} style={{ color }}>
                  <Glyph sev={s.sev} sw={5.5} variant="outline" />
                </g>
                <text x={104} y={y + 28} fontSize={15} fontWeight={700} fill="var(--color-ink)">
                  {level.label}
                </text>
                <text x={104} y={y + 47} fontSize={12} fill="var(--color-ink-2)">
                  {level.message}
                </text>
                <text x={104} y={y + 65} fontSize={11.5} fill="var(--color-ink-3)">
                  {decisionLine}
                </text>
                <g>
                  {[0, 1, 2].map((b) => (
                    <rect
                      key={b}
                      x={meterX + b * 8}
                      y={y + 40 - meterH[b]}
                      width={5}
                      height={meterH[b]}
                      rx={1}
                      fill={b <= s.sev ? color : "var(--color-line)"}
                    />
                  ))}
                </g>
                <text x={meterX + 21} y={y + 58} className="mono" fontSize={9.5} fill="var(--color-ink-3)" textAnchor="end">
                  {levelCode(s.id, s.sev)}
                </text>
                {i < signals.length - 1 && (
                  <line x1={PAD} y1={y + ROW_H} x2={W - PAD} y2={y + ROW_H} stroke="var(--color-line)" strokeWidth={1} />
                )}
              </g>
            );
          })
        )}

        {/* pie: intervención */}
        <line x1={PAD} y1={footerTop} x2={W - PAD} y2={footerTop} stroke="var(--color-line)" strokeWidth={1} />
        <text x={PAD} y={footerTop + 20} className="mono" fontSize={10} fill="var(--color-ink-3)" letterSpacing="0.6">
          INTERVENCIÓN
        </text>
        <text x={PAD} y={footerTop + 38} fontSize={12} fill="var(--color-ink-2)">
          {interventionLines.map((ln, i) => (
            <tspan key={i} x={PAD} dy={i === 0 ? 0 : 15}>
              {ln}
            </tspan>
          ))}
        </text>
      </svg>
    );
  },
);
