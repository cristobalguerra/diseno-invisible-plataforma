/** Marca del sistema: placa con el medidor de 3 niveles ascendente (la firma
 *  de la codificación redundante). Mono, escala con `size`. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden style={{ display: "block" }}>
      <rect x="1.5" y="1.5" width="29" height="29" rx="5" fill="none" stroke="var(--color-ink)" strokeWidth={2} />
      <rect x="8" y="18" width="4" height="6" rx="1" fill="var(--color-low)" />
      <rect x="14" y="13" width="4" height="11" rx="1" fill="var(--color-mid)" />
      <rect x="20" y="8" width="4" height="16" rx="1" fill="var(--color-high)" />
    </svg>
  );
}
