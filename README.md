# INTERFACE Updates

Sitio 3D interactivo para consultar las actualizaciones de [INTERFACE Launcher](https://github.com/ManzanitaSpice/Interface-2). Una televisión CRT muestra la interfaz HTML real con Inicio, Actualizaciones, Descargas y Roadmap. El feed muestra releases públicos, notas y descargas; no enumera commits.

## Desarrollo local

Requiere Node.js 24 y pnpm 10.

```sh
pnpm install
pnpm update-feed
pnpm dev
```

`pnpm update-feed` obtiene todas las versiones publicadas de `ManzanitaSpice/Interface-2` y escribe `public/data/releases.json`. El sitio lee el mismo JSON en local y en GitHub Pages. No requiere token para leer el repositorio público.

```sh
pnpm build
pnpm preview
```

## Contenido

- **Actualizaciones** muestra las notas originales de los releases.
- **Descargas** ofrece el instalador `.exe` de la versión más reciente; al actualizarse el feed, las versiones anteriores dejan de tener botón de descarga en el sitio.
- **Roadmap** se edita en `public/data/roadmap.json`. Solo agrega prioridades acordadas por el proyecto; una lista vacía se presenta como “En preparación”.
- El campo **Skin de Minecraft** acepta nombres de jugador de 3 a 16 caracteres. Las texturas se resuelven con el endpoint `skin` de [MCHeads](https://mc-heads.net/), que documenta soporte para CORS. Si falla el servicio, se conserva el avatar generado localmente. Agradecimiento a MCHeads por el servicio gratuito.

## Modelo 3D

La escena usa `public/models/television-01.glb`: un CRT PBR 2K de Poly Haven, con mapas de color, normales y metalness/roughness. Las placas de fábrica se retexturizaron para quitar las marcas originales e integrar INTERFACE. Las texturas originales están en `assets/models/television-01-source/`; ejecuta `pnpm rebrand:crt` y luego `pnpm bundle:crt` para regenerar el GLB. La fuente, licencia y personalización están en [docs/ASSET_CREDITS.md](docs/ASSET_CREDITS.md).

En escritorio, los diales físicos cambian el canal y el volumen; el botón POWER enciende y apaga la pantalla, el zumbido y la iluminación. Al apagar, la imagen se comprime en una línea brillante y se extingue.

En escritorio, el jugador usa la geometría de proporciones Minecraft de `skinview3d`, carga por defecto la skin pública de Notch y permite buscar otras por nombre; las capas exteriores y la capa están ocultas. Seleccionar una sección acerca la cámara a la pantalla. En móviles se muestra la página HTML adaptable sin Canvas ni contexto WebGL.

## Publicación

GitHub Actions genera el feed, compila Vite y publica GitHub Pages al subir cambios a `main`, cada cinco minutos y al ejecutar manualmente **Publish updates site** en **Actions**. El repositorio de publicación es `ManzanitaSpice/Interface-Updates`.

Antes del primer despliegue, configura **Settings → Pages → Build and deployment → Source → GitHub Actions**. El feed publicado queda en:

`https://manzanitaspice.github.io/Interface-Updates/data/releases.json`
