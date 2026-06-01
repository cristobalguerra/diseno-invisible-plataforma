# DESIGN — Diseño invisible · Plataforma

**register: product · theme: claro de alto contraste · estrategia de color: restrained**

La interfaz encarna el principio del sistema: máxima legibilidad y nunca depender
del color. Lienzo claro y neutro (juzgar pictogramas como se imprimirán), tinta
casi negra, bordes de pelo nítidos, retícula visible. El color semafórico
(verde/ámbar/rojo) vive **solo** en la semántica de los pictogramas y los
indicadores de prioridad, siempre con redundancia (forma + cantidad + texto).

## Escena (por qué tema claro)

Un equipo de museo o un estudiante de diseño compone señalética en un laptop, de
día, en un estudio; necesita juzgar color y contraste como se verán impresos en
muro. Un lienzo claro y honesto, tipo hoja de especificación, gana al dark mode.

## Color — OKLCH (sin #000 / #fff; neutros tintados hacia hue 258)

Neutros
- canvas  `oklch(0.972 0.004 255)` — fondo de app
- paper   `oklch(0.995 0.0025 255)` — paneles / superficies elevadas
- sunken  `oklch(0.945 0.006 255)` — pozos / insets
- line    `oklch(0.86 0.008 255)` — borde de pelo
- line-strong `oklch(0.74 0.012 255)` — borde fuerte / reglas
- ink     `oklch(0.21 0.021 262)` — texto primario
- ink-2   `oklch(0.38 0.018 262)` — texto secundario
- ink-3   `oklch(0.50 0.015 262)` — etiquetas / mudo

Acento (interacción, ≤10 % de superficie)
- accent      `oklch(0.48 0.16 258)` — tinta azul: foco, activo, primario
- accent-weak `oklch(0.93 0.035 258)` — fondo tinte de acento

Semáforo (semántica de pictograma + prioridad; con redundancia)
- low / bajo   `oklch(0.55 0.13 155)` · low-bg  `oklch(0.95 0.03 155)`
- mid / medio  `oklch(0.66 0.14 70)`  · mid-bg  `oklch(0.95 0.045 80)`
- high / alto  `oklch(0.55 0.20 28)`  · high-bg `oklch(0.95 0.04 28)`

## Tipografía

- **Inter** (variable) — UI y títulos. Jerarquía por escala + peso (ratio ≥1.25).
  Tracking negativo en tamaños grandes.
- **IBM Plex Mono** — lecturas técnicas: códigos de pictograma (SND-3), valores
  (dB, lux), niveles, metadatos. Da el carácter de instrumento.
- Cuerpo ≤ 70ch.

## Layout

- Shell de workspace: riel lateral (Biblioteca · Editor · Señalética · Mapa),
  barra superior, lienzo central, panel contextual de propiedades.
- Esquinas casi rectas (radius 2–4px), reglas y anotación de retícula.
- Sin tarjetas idénticas repetidas: el catálogo es una rejilla de espécimen con
  anotación de especificación, no "icon cards".

## Motion

Restringido. Ease-out exponencial. Transiciones de panel/pictograma sutiles; no
animar propiedades de layout. Respeta `prefers-reduced-motion`.

## Pictogramas

- Rejilla de 96×96, área segura, trazo consistente (peso parametrizable).
- Nivel codificado de forma multivariable: **cantidad** de elementos (arcos,
  rayos, figuras) + **medidor de 3 segmentos** + **color** + **texto**.
- Variantes: contorno / relleno; color on/off; con/sin retícula.

## Prohibiciones (heredadas de impeccable)

Sin side-stripe borders, gradient text, glassmorphism decorativo, hero-metric,
rejillas de tarjetas idénticas, modal como primer recurso, em dashes en copy.
