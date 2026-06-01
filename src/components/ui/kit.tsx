import type { ReactNode } from "react";
import type { Severity } from "../../lib/types";
import { SEVERITY_COLOR } from "../../data/catalog";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ---- Segmented control -------------------------------------------------- */
export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]";
  return (
    <div className="inline-flex rounded-sm border border-line-strong bg-paper p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            title={o.title}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={cx(
              "rounded-[2px] font-medium transition duration-150 ease-out active:scale-[0.96]",
              pad,
              active ? "bg-ink text-canvas" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Toggle ------------------------------------------------------------- */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink"
    >
      <span
        className={cx(
          "relative inline-flex h-[18px] w-[30px] shrink-0 rounded-full border transition-colors duration-200 ease-out",
          checked ? "border-accent bg-accent" : "border-line-strong bg-sunken",
        )}
      >
        <span
          className="absolute left-[2px] top-[2px] h-[12px] w-[12px] rounded-full bg-paper transition-transform duration-200 ease-out"
          style={{ transform: checked ? "translateX(12px)" : "translateX(0)" }}
        />
      </span>
      {label}
    </button>
  );
}

/* ---- Button ------------------------------------------------------------- */
export function Button({
  children,
  onClick,
  variant = "outline",
  icon,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  icon?: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  const styles = {
    primary: "bg-ink text-canvas hover:bg-accent border-ink hover:border-accent",
    outline: "bg-paper text-ink border-line-strong hover:border-ink",
    ghost: "bg-transparent text-ink-2 border-transparent hover:text-ink hover:bg-sunken",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-[13px] font-medium transition duration-150 ease-out active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100",
        styles,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---- Field -------------------------------------------------------------- */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-snug text-ink-3">{hint}</span>}
    </label>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{children}</span>
  );
}

/* ---- Severity chip (dot + texto, nunca solo color) ---------------------- */
export function SeverityChip({ sev, label }: { sev: Severity; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-2">
      <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_COLOR[sev] }} aria-hidden />
      {label}
    </span>
  );
}
