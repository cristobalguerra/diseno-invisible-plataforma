import type { ReactNode } from "react";
import { Gauge, LayoutGrid, Map, Radar } from "lucide-react";
import { cx } from "../ui/kit";
import { BrandMark } from "./BrandMark";

export type ModuleId = "library" | "etiquetas" | "medicion" | "plano";

const NAV: { id: ModuleId; n: string; label: string; desc: string; icon: typeof LayoutGrid }[] = [
  { id: "library", n: "01", label: "Espacios medidos", desc: "Repositorio de la investigación", icon: LayoutGrid },
  { id: "etiquetas", n: "02", label: "Etiqueta", desc: "Lectura del lugar", icon: Radar },
  { id: "medicion", n: "03", label: "Medición", desc: "Cámara y micrófono", icon: Gauge },
  { id: "plano", n: "04", label: "Blueprint sensorial", desc: "Lámina y disposición del sitio", icon: Map },
];

export function AppShell({
  module,
  onModule,
  children,
}: {
  module: ModuleId;
  onModule: (m: ModuleId) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-line bg-canvas md:h-screen md:w-[228px] md:border-b-0 md:border-r md:sticky md:top-0">
        <div className="flex items-center gap-2.5 px-4 py-4 md:px-5 md:py-5">
          <BrandMark size={30} />
          <div className="leading-tight">
            <div className="text-strong font-bold tracking-tight text-ink">Diseño invisible</div>
            <div className="font-mono text-micro uppercase tracking-[0.12em] text-ink-3">Pictogramas</div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-0.5 md:overflow-visible md:px-3">
          {NAV.map((item) => {
            const active = item.id === module;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onModule(item.id)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group flex shrink-0 items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition duration-150 ease-out active:scale-[0.98]",
                  active
                    ? "border-line bg-paper text-ink"
                    : "border-transparent text-ink-2 hover:bg-sunken hover:text-ink",
                )}
              >
                <Icon size={17} strokeWidth={2} className={active ? "text-accent" : "text-ink-3 group-hover:text-ink-2"} />
                <span className="leading-tight">
                  <span className="flex items-center gap-1.5 text-body font-semibold">
                    <span className="font-mono text-micro text-ink-3">{item.n}</span>
                    {item.label}
                  </span>
                  <span className="hidden text-eyebrow text-ink-3 md:block">{item.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-line px-5 py-4 md:block">
          <p className="text-eyebrow leading-relaxed text-ink-3">
            Legibilidad sensorial anticipatoria.
            <br />
            7 categorías · 3 niveles.
          </p>
          <p className="mt-2 font-mono text-micro text-ink-3">UDEM · LDG</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
