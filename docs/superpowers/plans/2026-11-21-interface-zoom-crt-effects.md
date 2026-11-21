# Zoom persistente y efectos CRT — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mantener un zoom fluido e independiente de la navegación, con una tipografía retro local, glitch ocasional y efecto de sintonización con ruido blanco al cambiar de canal. Una secuencia de 22 sintonizaciones físicas rápidas abre un video sorpresa con zoom y estática CRT.

**Architecture:** Mantener cámara y estado global existentes de Zustand/R3F, pero desacoplar el zoom de las secciones y los clics. Conservar la interfaz HTML dentro del modelo 3D y aplicar allí la fuente y los efectos CRT. El estado del canal dispara la interferencia; los manejadores de cambio reproducen ruido blanco por Web Audio.

**Tech Stack:** React, TypeScript, Three.js, React Three Fiber, GSAP, Zustand, CSS.

**Spec:** `docs/superpowers/specs/2026-11-21-interface-zoom-crt-design.md`

## Global Constraints

- La rueda controla el zoom en toda la escena, también sobre la pantalla HTML.
- Cambiar a Inicio, navegar, usar encendido o pulsar los controles de canal no cambia el zoom.
- El glitch se limita a la interfaz HTML y se desactiva con `prefers-reduced-motion`.
- Cambiar de canal desde la pantalla o los controles físicos dispara 500 ms de interferencia intensa y ruido blanco; el volumen cero silencia el sonido.
- 22 cambios consecutivos desde el control físico, separados por hasta 750 ms, abren el video de YouTube con sus controles ocultos y una capa de estática hasta que empiece; cambiar otra vez de canal, apagar la TV, presionar Escape o terminar el video lo cierra y restaura el zoom anterior si no cambió manualmente.
- Usar el reproductor oficial de YouTube, sin descargar el video.
- No añadir ni ejecutar pruebas automatizadas.

## Review Focus

- La rueda acerca y aleja sin saltos ni diferencias por `deltaMode`.
- Al acercarse, la vista corrige levemente su ángulo para mirar más de frente a la TV y vuelve al ángulo original al alejar.
- La distancia elegida persiste al navegar, al pulsar botones físicos y al hacer clic fuera de la pantalla.
- La fuente local se carga en desktop y móvil con fallback legible.
- El glitch aparece ocasionalmente sin interceptar entradas de usuario y respeta movimiento reducido.
- La sintonización aparece una vez por cambio de canal; el ruido se inicia dentro del gesto del usuario y respeta el volumen.
- El huevo de pascua sólo se cuenta con cambios físicos seguidos, cubre el inicio del reproductor con estática y restaura el zoom cuando se cierra.

---

### Task 1: Zoom persistente y controlado por rueda

**Files:**
- Modify: `src/state/interfaceStore.ts`
- Modify: `src/scene/Scene.tsx`

**Interfaces:** Mantener `adjustCameraZoom(delta)` como acumulador acotado del zoom. El componente `CameraMotion` será responsable del listener de rueda en el contenedor `.experience-shell` y de animar la distancia.

- [x] Hacer que `setPage` no altere el zoom; retirar `cameraOverview`, `resetCameraView`, el foco de cámara dependiente de `page` y el reinicio por clic fuera de la interfaz. Conservar el balanceo existente sólo en Inicio.
- [x] Fijar una distancia base de `4.65` (actualmente `4.9`) y animar cambios de distancia durante unos `0.45` segundos, sin usar `page` para cambiar la distancia.
- [x] Escuchar la rueda en `.experience-shell`, normalizar píxeles/líneas/páginas a píxeles CSS, ignorar `Ctrl`/`Meta` y conservar el scroll nativo de `.scroll-view` mientras pueda avanzar en esa dirección.
- [x] Revisar los cambios de cámara y confirmar que la navegación y los controles físicos no invoquen acciones de zoom.

### Task 2: Tipografía vintage y glitch ocasional

**Files:**
- Review/reuse: `src/assets/fonts/vt323-latin.woff2`
- Review/reuse: `public/fonts/OFL.txt`
- Create: `src/audio/channelTuningSound.ts`
- Modify: `src/components/TvInterface.tsx`, `src/scene/TvPhysicalControls.tsx`
- Modify: `src/styles.css`
- Modify: `docs/ASSET_CREDITS.md`

**Interfaces:** La interfaz desktop y móvil seguirá compartiendo `.tv-interface`; `playChannelTuningNoise(volume)` se invoca dentro de los manejadores de navegación y de los controles físicos, mientras el efecto visual sigue el cambio de `channel`.

- [x] Confirmar los archivos VT323/OFL locales existentes, atribuir la fuente en los créditos y conservar fallback monospace.
- [x] Aplicar la tipografía al texto de la pantalla y ajustar tamaños si hacen falta para conservar lectura.
- [x] Añadir un ciclo CRT ocasional (cada ~10–12 segundos) con interferencia de menos de 200 ms en la pantalla HTML, `pointer-events: none` y respeto a movimiento reducido.
- [x] Disparar una interferencia marcada de 500 ms y ruido blanco filtrado de 500 ms en cada cambio real de canal; usar el volumen actual y silenciar con volumen cero.
- [x] Mantener fuera del efecto la carcasa, la cámara y los controles físicos.

### Task 3: Comprobación de integración

**Files:**
- Review: `src/App.tsx`, `src/state/interfaceStore.ts`, `src/scene/Scene.tsx`, `src/components/TvInterface.tsx`, `src/scene/TvPhysicalControls.tsx`, `src/audio/channelTuningSound.ts`, `src/styles.css`, `src/assets/fonts/vt323-latin.woff2`, `public/fonts/OFL.txt`, `docs/ASSET_CREDITS.md`

- [x] Ejecutar `pnpm build` y revisar el resultado completo con `GITHUB_ACTIONS=true` tras conectar la sintonización: TypeScript y Vite pasan; el único aviso es el tamaño del chunk de la escena.
- [x] Revisar los archivos del plan y el estado del árbol; preservar los cambios ajenos existentes.

### Task 4: Sintonización secreta

**Files:**
- Modify: `src/state/tvStore.ts`, `src/scene/TvPhysicalControls.tsx`, `src/components/TvInterface.tsx`, `src/styles.css`
- Create: `src/components/ChannelEasterEgg.tsx`

- [x] Contar 22 cambios físicos consecutivos, reiniciando la cuenta tras una pausa o una acción diferente.
- [x] Mostrar el video oficial de YouTube detrás de estática hasta `PLAYING`, sin controles visibles; acercar la cámara al sintonizar.
- [x] Precargar sólo la API en la primera sintonización física; si el navegador bloquea autoplay, un clic sobre la estática reintenta sin mostrar controles de reproducción.
- [x] Añadir OSD analógico de CANAL 22 con medidor VHF, barrido de estática y una animación corta de bloqueo vertical/cromático al fijar la señal.
- [x] Cerrar por cambio de canal, apagado, Escape o fin del video y restaurar el zoom anterior cuando no se modificó durante la reproducción.

### Follow-up: restaurar escala manual

- [x] Restaurar el listener de rueda de `.experience-shell`, conservando scroll nativo en `.scroll-view` y el zoom temporal del canal secreto.
- [x] Guardar los cambios en los archivos fuente y verificar la compilación de producción.

### Follow-up: frontalidad vinculada al zoom

- [x] Interpolar el desplazamiento horizontal de cámara según el acercamiento y devolverlo gradualmente a cero al alejar.
