# Zoom persistente, tipografía y sintonización CRT

## Intención

Dar a la pantalla un aspecto de computadora de los 90 y hacer que acercar o alejar la cámara se sienta natural, sin que navegar o tocar los controles físicos cambie el zoom.

## Objetivos

- Acercar ligeramente la vista inicial y suavizar el zoom con la rueda en toda la escena, incluida la pantalla HTML.
- Mantener la distancia elegida al navegar a Inicio, cambiar de sección o usar los controles de encendido y canal.
- Usar una fuente retro local con una alternativa legible del sistema.
- Añadir destellos de interferencia breves e irregulares sólo a la pantalla; desactivarlos con movimiento reducido.
- Mostrar distorsión marcada durante 500 ms al cambiar de canal y reproducir ruido blanco durante el mismo intervalo, controlado por el volumen de la TV.

## No objetivos

- Añadir controles de zoom nuevos o cambiar el mapeo y el ciclo de canales.
- Aplicar el glitch a la cámara, a la carcasa o a los controles físicos.

## Enfoques considerados

1. **Rueda en toda la escena y zoom independiente de la navegación (actual).** Mantiene el zoom fluido y evita reinicios por clics, botones o cambios de página. El usuario confirmó que desea reactivar la rueda.
2. Rueda sólo sobre la pantalla HTML. Delimita el zoom al panel, pero no coincide con la preferencia indicada.

## Decisiones de implementación

- Desacoplar la distancia de cámara de `page`, conservar el balanceo suave existente en Inicio y eliminar los reinicios disparados por clics fuera del HTML.
- Hacer que el listener de rueda cubra el contenedor completo de la escena, normalizar sus deltas y animar la distancia con una transición suave; conservar primero el desplazamiento nativo de `.scroll-view` cuando tenga contenido en esa dirección; reducir un poco la distancia inicial.
- Al acercar, desplazar suavemente la cámara hacia el frente de la TV; al alejar hasta el encuadre normal, devolverla a su ángulo original.
- Incorporar la fuente local **VT323** a la interfaz de escritorio y móvil, conservando una alternativa monospace.
- Usar interferencia de líneas y pequeños desplazamientos cromáticos en el HTML de la TV, con los eventos de puntero desactivados y una regla para `prefers-reduced-motion`.
- Disparar la interferencia desde el estado de canal y el ruido desde el gesto de cambio, tanto en la navegación de pantalla como en los controles físicos; el volumen cero silencia el ruido.
- Tras 22 cambios de canal seguidos en el control físico, con un máximo de 750 ms entre cambios, sintonizar un video sorpresa a pantalla completa, acercar la cámara y cubrir cualquier carga con estática CRT. Salir al cambiar de canal, apagar la TV, presionar Escape o cuando termine el video.
- Reproducir el video con el reproductor oficial de YouTube, sin descargar el archivo; ocultar sus controles mientras la estática cubre la espera de `PLAYING`.
- Mantener el zoom manual con rueda disponible y persistente al navegar; el canal secreto puede acercar más la cámara temporalmente.
