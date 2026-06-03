/**
 * Exportación de cualquier <svg> del sistema a SVG vectorial o PNG rasterizado.
 * Los pictogramas usan variables CSS (var(--color-...)) y currentColor; al
 * exportar inyectamos esas variables en un <style> dentro del SVG para que
 * resuelvan de forma autónoma fuera de la app.
 */
const VARS = [
  "--color-low", "--color-mid", "--color-high",
  "--color-low-bg", "--color-mid-bg", "--color-high-bg",
  "--color-ink", "--color-ink-2", "--color-ink-3",
  "--color-line", "--color-line-strong",
  "--color-paper", "--color-canvas", "--color-sunken",
  "--color-accent", "--color-accent-weak", "--color-accent-ink",
  "--color-cat-sound", "--color-cat-light", "--color-cat-flow", "--color-cat-wait",
  "--color-cat-orientation", "--color-cat-visual", "--color-cat-pause",
];

function cssVarsBlock(): string {
  const cs = getComputedStyle(document.documentElement);
  return VARS.map((v) => `${v}:${cs.getPropertyValue(v).trim()};`).join("");
}

export function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent =
    `svg{${cssVarsBlock()}font-family:Inter,system-ui,sans-serif;}` +
    `.mono{font-family:"IBM Plex Mono",ui-monospace,monospace;}`;
  clone.insertBefore(style, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${xml}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(svg: SVGSVGElement, filename: string) {
  const blob = new Blob([serializeSvg(svg)], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, filename.endsWith(".svg") ? filename : `${filename}.svg`);
}

export async function downloadPng(svg: SVGSVGElement, filename: string, scale = 4) {
  const str = serializeSvg(svg);
  const vb = svg.viewBox.baseVal;
  const w = vb && vb.width ? vb.width : svg.clientWidth || 96;
  const h = vb && vb.height ? vb.height : svg.clientHeight || 96;

  const blob = new Blob([str], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("sin contexto 2d"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((out) => {
        if (out) triggerDownload(out, filename.endsWith(".png") ? filename : `${filename}.png`);
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("no se pudo rasterizar el SVG"));
    };
    img.src = url;
  });
}
