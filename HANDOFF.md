# HANDOFF — Diseño invisible · Plataforma

Documento para retomar el proyecto en frío (desarrollo, diseño o investigación).
Última actualización del estado: build "instrumento oscuro" publicado.

- **En vivo:** https://cristobalguerra.github.io/diseno-invisible-plataforma/
- **Repo:** `cristobalguerra/diseno-invisible-plataforma` (privado → público; GitHub Pages)
- **Despliegue:** automático en cada `push` a `main` (GitHub Actions).

---

## 1. Qué es

Herramienta de autoría del sistema **Diseño invisible** (legibilidad sensorial
anticipatoria, paper Guerra-Tamez et al., UDEM). Hace visibles las condiciones
sensoriales de un espacio (7 categorías) **antes** de habitarlo.

El artefacto central es un **sello sensorial generativo**: un marcador
circular-radial generado de datos, no un pictograma literal. Cada espacio medido
se vuelve su sello. La app es un **instrumento de diagnóstico oscuro**.

**7 categorías sensoriales** (orden fijo en el anillo, `RING_ORDER`):
`sound · light · flow · wait · orientation · visual · pause`.

---

## 2. Stack y cómo correr

- **Vite + React 19 + TypeScript**, **Tailwind v4** (`@tailwindcss/postcss`),
  tokens **OKLCH** en `@theme` (`src/index.css`).
- Fuentes: Inter (UI) + IBM Plex Mono (lecturas técnicas).

```bash
npm install
npm run dev      # desarrollo (Vite)
npm run build    # build de producción a dist/
npm run preview  # previsualiza el build
npx tsc --noEmit # typecheck
```

Despliegue: hacer `push` a `main`. El workflow `.github/workflows/deploy.yml`
compila y publica en GitHub Pages (acciones en Node 24). No hay paso manual.

---

## 3. Arquitectura

### Módulos (3) — `src/App.tsx` enruta; `src/components/shell/AppShell.tsx` el riel

| # | id | Archivo | Qué hace |
|---|----|---------|----------|
| 01 | `library` | `components/modules/Espacios.tsx` | Repositorio de espacios medidos, agrupado por **sitio**; registrar/abrir |
| 02 | `etiquetas` | `components/modules/Etiquetas.tsx` | Estudio del sello: sello + editor de datos + ficha (escaneo) + journey |
| 03 | `medicion` | `components/modules/Medicion.tsx` | Cámara/micrófono miden luz/sonido (hook `lib/useSensors.ts`) |

### Estado y persistencia — `src/App.tsx`

- `profiles: SensorProfile[]` y `spaceId` **se elevan en App** y se pasan a
  Espacios y Etiquetas (colección compartida).
- Persistencia local: `localStorage["di-espacios-v2"]` (`lib/labels/profiles.ts`
  → `loadProfiles` / `saveProfiles`). Semilla: Museo MARCO (×4) + Biblioteca UDEM
  (×2).

### Modelo de datos — `src/lib/labels/types.ts`

```ts
SensorProfile { id, code, site, name, params: Record<CategoryId, CategoryParams> }
CategoryParams { intensity, peak, variability, duration, predictability,
                 confidence: number/*0..1*/, source: "sensor"|"observation"|"survey" }
```

### El sello — `src/components/labels/SensorSeal.tsx`

Codificación (nivel 1, solo color):
- **posición angular** = categoría (`RING_ORDER`) · **color** = categoría (`CATEGORY_COLOR`)
- **longitud del radio** = `intensity` (animada con `stroke-dashoffset`)
- **grosor** = `duration` · **opacidad** = `confidence`
- resplandor por filtro SVG (lectura "encendida"); `animateIn` dibuja los radios al montar.
- `pico, variabilidad, predictibilidad, fuente` se capturan pero **no se dibujan**
  en nivel 1: alimentan la ficha.

### El journey — `src/components/labels/JourneyMap.tsx`

Mapa de experiencia emocional por sitio. Confort por espacio:
`comfort = clamp01(1 - carga*0.9 - orientación*0.25 + pausa*0.3)`
→ bandas: `≥0.6 en calma · ≥0.38 alerta · <0.38 tensión`. `carga` = intensidad
media de las categorías de carga (sound, light, flow, visual, wait).

### Otros archivos clave

- `src/data/catalog.ts` — las 7 categorías, `CATEGORY_COLOR`, escala de severidad.
- `src/lib/labels/sheet.ts` — la "ficha de escaneo" (interpretación + recomendación).
- `src/lib/export.ts` — exportar cualquier `<svg>` a SVG/PNG (inyecta los tokens).
- `src/lib/generative/{rng,levels,types}.ts` — utilidades compartidas que reusa el
  sello/labels (PRNG determinista, niveles). *(engine/meta se eliminaron con el módulo generativo viejo.)*

---

## 4. Sistema de diseño — "instrumento oscuro"

Tokens en `src/index.css` (`@theme`). Registro **product**, tema **oscuro**.

- **Neutros OKLCH tintados** hacia hue 262 (nunca negro puro); profundidad por
  luminosidad de superficie, sin sombra; radios crisp (2–14px).
- **Color = DATO**: las 7 `--color-cat-*` son el único color saturado (la lectura
  luminosa). `--color-accent` (lima) solo como señal viva (foco/sliders).
- **Severidad** (`--color-low/mid/high`, verde/ámbar/rojo) = valencia emocional del
  journey + Medición. No es color de categoría.
- Mono (IBM Plex) para códigos y lecturas; reglas de pelo; etiquetas en versalitas.
- **Moción** (criterio Emil Kowalski, disciplinada): el sello respira al editar el
  dato, se enciende al abrir el estudio, presión + hover en placas. Todo
  transform/opacity/dashoffset; `prefers-reduced-motion` respetado (regla global).

---

## 5. Decisiones clave (y por qué)

1. **El sello radial ES el sistema de pictogramas.** Reemplazó los glifos
   literales y el sistema generativo de retícula 9×9 (ambos retirados): el dato se
   vuelve identidad, no se dibuja a mano.
2. **Sello solo en color, nivel 1.** En blanco y negro perdía función; el nivel 1
   (longitud=intensidad, grosor=duración) es la marca canónica.
3. **Repositorio agrupado por sitio** (edificio → espacios), con persistencia local.
4. **Tema instrumento oscuro.** Elección del usuario; **sobrescribe** lo que dice
   hoy `DESIGN.md` (tema claro). Enmarcado como instrumento de precisión, no
   dashboard de SaaS (evita el gloss que prohíbe `PRODUCT.md`).
5. **Mapa de experiencia emocional** (curva de confort), no una matriz de datos.

Módulos retirados en el camino: Biblioteca (catálogo literal), Editor, Sistema
generativo 9×9, Señalética y Mapa (este reencarnó como el journey dentro del sello).

---

## 6. Pendientes / próximos pasos

1. **Reconectar Medición al sello.** Hoy escribe a un modelo viejo de "zonas"
   (`lib/types.ts` `Zone`, `data/zones.ts`). Debería alimentar los `params` del
   espacio (intensidad por categoría) → el sello se regenera.
2. **Regenerar `DESIGN.md`** al tema oscuro actual: `/impeccable document` (hoy
   describe el tema claro y módulos viejos).
3. **Persistencia compartida** (opcional): hoy es local por navegador. Si la
   investigación necesita multi-usuario/multi-dispositivo, mover a un backend
   (hay MCP de Supabase disponible).
4. **Escaneo real:** el sello es el marcador; la ficha vive en la app. Falta
   generar el **QR / reconocimiento** que abra la ficha desde el mundo físico.
5. **Validación con usuarios** (ISO 9186): el nivel 1 codifica categoría por
   posición + color; confirmar legibilidad y riesgo de mala interpretación.

---

## 7. Deuda técnica / código muerto (borrable)

Quedó huérfano tras retirar los módulos viejos (sin referencias):

- `src/components/pictogram/Pictogram.tsx`, `glyphs.tsx`, `PictogramTile.tsx`,
  `SignCard.tsx` — sistema de glifos literales.
- `src/lib/priority.ts` — prioridad de zonas (semáforo viejo).
- Dependencia **`framer-motion`** en `package.json` — sin uso en `src`.

**No borrar:** `src/components/pictogram/LevelMeter.tsx` (lo usa Medición),
`src/lib/{svg,useSensors,types}.ts`, `src/data/zones.ts` (Medición/zonas),
`src/lib/generative/{rng,levels,types}.ts` (reusados por el sello).

---

## 8. Limitaciones conocidas

- **Medición** requiere dispositivo real (cámara/micrófono) y contexto seguro
  (https/localhost). En sandbox sin hardware muestra el estado de error.
- Los `%` del sello/journey son **relativos**, no calibrados a dB(A) ni lux.
- Archivos `._*` de macOS (volumen Lexar) están ignorados en `.gitignore`.
