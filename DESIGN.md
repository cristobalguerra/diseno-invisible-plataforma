---
name: Diseño invisible · Plataforma
description: Instrumento de autoría del sistema Diseño invisible (legibilidad sensorial anticipatoria)
colors:
  # Neutros: OKLCH tintados hacia el hue de marca (262), nunca negro puro
  sunken: "oklch(0.142 0.009 262)"
  canvas: "oklch(0.176 0.01 262)"
  paper: "oklch(0.225 0.012 262)"
  line: "oklch(0.305 0.012 262)"
  line-strong: "oklch(0.42 0.015 262)"
  ink: "oklch(0.955 0.006 262)"
  ink-2: "oklch(0.745 0.013 262)"
  ink-3: "oklch(0.575 0.013 262)"
  # Acento: lima, única señal viva (foco / live / sliders), ≤10% de superficie
  accent: "oklch(0.9 0.19 122)"
  accent-ink: "oklch(0.2 0.02 262)"
  accent-weak: "oklch(0.27 0.035 262)"
  # Categoría: COLOR = DATO. Único color saturado, la lectura luminosa del sello
  cat-sound: "#b79cff"
  cat-light: "#ffe974"
  cat-flow: "#5bd1e6"
  cat-wait: "#ff8a4c"
  cat-orientation: "#8fafef"
  cat-visual: "#ff6ba3"
  cat-pause: "#a6e0a0"
  # Valencia emocional: journey + Medición. No es color de categoría
  low: "#5fd98a"
  low-bg: "oklch(0.26 0.05 152)"
  mid: "#ffd45c"
  mid-bg: "oklch(0.28 0.05 86)"
  high: "#ff6f6f"
  high-bg: "oklch(0.28 0.08 25)"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.625rem, 4vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  readout:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, monospace"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tabular-nums"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  eyebrow:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.14em"
rounded:
  xs: "2px"
  sm: "5px"
  md: "9px"
  lg: "14px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  segmented:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
  segmented-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.xs}"
  toggle:
    backgroundColor: "{colors.sunken}"
    rounded: "9999px"
    height: "18px"
    width: "30px"
  toggle-on:
    backgroundColor: "{colors.accent}"
  severity-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    rounded: "9999px"
    padding: "2px 8px"
  nav-item-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
---

# Design System: Diseño invisible · Plataforma

## 1. Overview

Diseño invisible es un instrumento de diagnóstico, no un dashboard. Lee las
condiciones sensoriales de un espacio (7 categorías) y las vuelve un dato visible
antes de habitarlo. La interfaz es un panel oscuro de precisión: superficies casi
negras tintadas hacia el azul de marca, reglas de pelo, anotación monoespaciada y
un único color vivo reservado al dato. La profundidad nace de la luz de cada
superficie, nunca de una sombra.

El sistema rechaza de forma explícita el gloss de SaaS (tarjetas idénticas,
métricas-héroe, gradientes decorativos), la iconografía clínica o el encuadre de
"discapacidad", el estilo amable de app de consumo y cualquier codificación que
dependa solo del color. Cada decisión empuja hacia el carácter de un manual
señalético suizo / Isotype: figura-fondo nítida, retícula, lectura inmediata.

El protagonista es el sello sensorial: un marcador circular-radial generado del
dato, no un pictograma dibujado a mano. El color saturado vive únicamente ahí,
como una lectura encendida. Todo lo demás es neutro, tipográfico y silencioso,
para que el dato sea lo único que brilla.

**Key Characteristics:**
- Tema oscuro de instrumento: neutros OKLCH tintados al hue 262, nunca negro ni blanco puro.
- Color = dato: las 7 categorías son el único color saturado; el lima es la única señal viva (≤10%).
- Profundidad tonal, cero sombra: sunken (pozo) sube a canvas (base) sube a paper (elevado).
- Voz monoespaciada (IBM Plex Mono) para códigos, valores y lecturas; Inter para la UI.
- Redundancia perceptiva: el nivel es forma + cantidad + medidor + texto, jamás solo color.
- Moción disciplinada: solo transform, opacity y stroke-dashoffset; respeta prefers-reduced-motion.

## 2. Colors

El color es casi todo neutro: una sola tinta viva (lima) para la interacción y un
espectro de 7 matices reservado al dato.

### Primary
- **Lima señal** (oklch(0.9 0.19 122)): el único acento vivo. Foco, estado activo, sliders, ícono del módulo activo, indicador "live" de Medición. Nunca decorativo. El texto sobre lima usa tinta profunda (oklch(0.2 0.02 262)); su tinte tenue (oklch(0.27 0.035 262)) rellena fondos de estado.

### Neutral (OKLCH tintados hacia hue 262, nunca negro puro)
- **Sunken** (oklch(0.142 0.009 262)): pozos e insets, lo más profundo.
- **Canvas** (oklch(0.176 0.01 262)): fondo base de la app y de los paneles.
- **Paper** (oklch(0.225 0.012 262)): superficie elevada (lo activo, lo seleccionado).
- **Line** (oklch(0.305 0.012 262)): regla de pelo, borde por defecto de todo.
- **Line-strong** (oklch(0.42 0.015 262)): regla fuerte, bordes de control.
- **Ink** (oklch(0.955 0.006 262)): texto primario.
- **Ink-2** (oklch(0.745 0.013 262)): texto secundario.
- **Ink-3** (oklch(0.575 0.013 262)): etiquetas, anotación, mudo.

### Tertiary: espectro de dato (codificación por categoría)
Siete matices fijos, uno por categoría sensorial; el color codifica QUÉ categoría
es, por su posición angular en el sello. Aclarados para encender sobre fondo oscuro.
- **Sonido / violeta** (#b79cff) · **Luz / amarillo** (#ffe974) · **Flujo / cian** (#5bd1e6) · **Espera / naranja** (#ff8a4c) · **Orientación / azul** (#8fafef) · **Saturación visual / magenta** (#ff6ba3) · **Pausa / verde salvia** (#a6e0a0).

### Valencia emocional (journey + Medición)
Semáforo de valencia, no de categoría. Brillante sobre un fondo tenue del mismo hue.
- **Calma / verde** (#5fd98a) sobre (oklch(0.26 0.05 152)).
- **Alerta / ámbar** (#ffd45c) sobre (oklch(0.28 0.05 86)).
- **Tensión / rojo** (#ff6f6f) sobre (oklch(0.28 0.08 25)).

### Named Rules
**La regla Color = Dato.** El color saturado pertenece solo a las 7 categorías. La
estructura es neutra, la interacción es lima, y todo lo demás saturado es una
lectura. Si un color no comunica un dato, no debe estar saturado.

**La regla del nunca-negro.** Prohibido #000 y #fff. Todo neutro se tinta hacia el
hue 262 (chroma 0.006 a 0.015). La profundidad viene de la luminosidad de la
superficie, no de una sombra.

**La regla de una sola señal.** El lima cubre ≤10% de cualquier pantalla. Su rareza
es el punto: marca foco, vivo o activo, y nada más.

**La regla valencia distinta de categoría.** Verde, ámbar y rojo son valencia
emocional (confort del recorrido, nivel de medición). Nunca se usan como color de
una categoría sensorial.

## 3. Typography

**Display Font:** Inter (con system-ui, -apple-system, sans-serif)
**Mono Font:** IBM Plex Mono (con ui-monospace, SF Mono, monospace)

**Character:** Inter sostiene la UI con neutralidad; IBM Plex Mono da el carácter de
instrumento. Códigos, valores, niveles y metadatos van en mono tabular: es la voz
de la lectura técnica.

### Hierarchy
- **Display** (Inter 700, clamp 26 a 30px, line-height 1.1, tracking -0.025em): títulos de módulo.
- **Readout** (IBM Plex Mono 600, 22px, tabular-nums): cifras grandes (conteos, lecturas).
- **Title** (Inter 700, 14px, tracking -0.01em): marca y encabezados de sección.
- **Body** (Inter 400, 13px, line-height 1.5): texto de UI. Cuerpo ≤ 70ch.
- **Label** (Inter 600, 11px, uppercase, tracking 0.08em): etiquetas de campo (versalitas).
- **Eyebrow / código** (IBM Plex Mono 600, 10 a 11px, uppercase, tracking 0.14em): códigos (SND-3), numeración de módulos, anotación.

### Named Rules
**La regla del readout monoespaciado.** Todo número con significado técnico (dB, lux,
%, niveles, conteos) se compone en IBM Plex Mono con tabular-nums. Las cifras no
bailan al cambiar.

**La regla de la versalita.** Las etiquetas son versalitas de 11px con tracking
abierto, en ink-3. Nunca metadatos en minúscula corrida.

## 4. Elevation

El sistema es plano: no usa ni una sombra. La profundidad se construye por capas
tonales de luminosidad creciente: **sunken** (pozo) por debajo de **canvas** (base)
por debajo de **paper** (elevado). Lo activo o seleccionado sube a paper; lo hundido
baja a sunken. Las reglas de pelo (line, line-strong) delimitan sin peso.

### Named Rules
**La regla de cero sombra.** Ninguna box-shadow. Si algo necesita destacar, sube de
luminosidad o gana una regla, no una sombra. Test: si ves un blur gris bajo una
superficie, está mal.

**La regla del resplandor de dato.** El único glow permitido es el filtro SVG del
sello, donde cada radio irradia su propio color de categoría. No es elevación, es la
lectura encendida del dato. Nunca se usa glow en superficies de UI.

## 5. Components

### Buttons
- **Shape:** esquinas crisp (rounded-sm, 5px), padding 12px / 6px, 13px medium; active:scale(0.97), transición 150ms ease-out.
- **Primary:** tinta sólida (fondo ink, texto canvas); en hover invierte a lima (fondo accent, borde accent). El primario se enciende al tocarlo.
- **Outline:** fondo paper, texto ink, borde line-strong que pasa a ink en hover. Acción por defecto.
- **Ghost:** transparente, texto ink-2 que pasa a ink, fondo sunken en hover. Acciones terciarias.

### Segmented control
- Riel fondo paper con borde line-strong y padding 2px. Opción activa: fondo ink, texto canvas (rounded-xs, 2px). Inactiva: ink-2 que pasa a ink. active:scale(0.96).

### Toggle
- Pista 30×18px redonda. Apagado: fondo sunken, borde line-strong. Encendido: fondo lima, borde lima. El pulgar (12px, fondo paper) se desplaza 12px en 200ms ease-out.

### Severity chip
- Cápsula (rounded-full) fondo paper, borde line, 11px. **Siempre punto de color más texto**, nunca color solo: encarna la redundancia perceptiva.

### Fields
- Etiqueta versalita (11px uppercase tracking, ink-3) sobre el control; hint en ink-3 11px. Sin cajas pesadas; el control hereda los neutros.

### Navigation
- Riel lateral fijo (228px) con borde derecho line y fondo canvas; en móvil colapsa a una barra superior con nav de scroll horizontal. Ítems con borde y rounded-sm: el activo sube a paper con borde line, ícono en lima y numeración mono (01/02/03); el inactivo va en ink-2 con hover a sunken. La marca arriba (BrandMark con "Diseño invisible" y "Pictogramas" en eyebrow mono).

### Cards / Containers
- **Corner Style:** rounded-sm (5px) o rounded-md (9px); nada grande.
- **Background:** paper sobre canvas; pozos en sunken.
- **Shadow Strategy:** ninguna (ver Elevation); borde de pelo line.
- **Internal Padding:** variado por ritmo, no uniforme. Prohibida la rejilla de tarjetas idénticas: los espacios se agrupan por sitio con anotación de especificación, no "icon cards".

### Sello sensorial (componente firma)
El marcador del sistema: SVG circular-radial 200×200. Las 7 categorías ocupan
sectores angulares FIJOS (RING_ORDER) y se dibujan como radios en su color de
categoría. Codificación nivel 1: **longitud del radio = intensidad** (revelada con
stroke-dashoffset), **grosor = duración** (1.8 a 5.5px), **opacidad = confianza**. Un
filtro SVG hace que cada radio irradie su color (lectura encendida); al abrir un
espacio (animateIn) los radios se dibujan desde el cubo. Ticks de color en el cubo
garantizan que las 7 categorías sean visibles aun en intensidad baja. Pico,
variabilidad, predictibilidad y fuente se capturan pero no se dibujan en nivel 1:
alimentan la ficha.

### Named Rules
**La regla de moción disciplinada.** Solo se anima transform, opacity y
stroke-dashoffset (criterio Emil Kowalski). El sello respira al editar el dato y se
enciende al abrir el estudio; las placas responden con presión (active:scale) y
hover. La entrada de módulo es 200ms ease-out con translateY de 4px. Nunca se animan
propiedades de layout. prefers-reduced-motion desactiva todo (regla global).

## 6. Do's and Don'ts

### Do:
- **Do** tintar cada neutro hacia el hue 262 (chroma 0.006 a 0.015); nunca #000 ni #fff.
- **Do** reservar el color saturado para las 7 categorías (color = dato) y el lima para la señal viva (≤10%).
- **Do** construir profundidad por luminosidad de superficie (sunken, canvas, paper), no por sombra.
- **Do** componer todo readout técnico en IBM Plex Mono con tabular-nums.
- **Do** codificar el nivel con redundancia: forma + cantidad + medidor + texto, además del color.
- **Do** animar solo transform, opacity y dashoffset, y respetar prefers-reduced-motion.
- **Do** mantener fijo el RING_ORDER del sello (sound, light, flow, wait, orientation, visual, pause).

### Don't:
- **Don't** usar iconografía médica o clínica, ni el encuadre de "discapacidad": el sistema informa el espacio, nunca etiqueta a la persona.
- **Don't** caer en estilo decorativo, ilustrativo o "amable" de app de consumo.
- **Don't** codificar nada solo por color (cerca del 8% de deficiencia cromática): siempre redundancia.
- **Don't** usar gloss de SaaS: tarjetas idénticas, métricas-héroe, gradientes decorativos.
- **Don't** usar side-stripe borders (border-left o right mayor a 1px como acento de color), gradient text, glassmorphism decorativo, ni el modal como primer recurso.
- **Don't** meter sombras: si hay un blur gris bajo una superficie, está mal.
- **Don't** usar em dashes (ni `--`) en el copy; comas, dos puntos, punto y coma o paréntesis.
