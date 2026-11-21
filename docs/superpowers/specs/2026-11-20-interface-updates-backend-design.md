# INTERFACE Updates — 3D web design and architecture

## Purpose

Build the dedicated GitHub Pages site for updates to the INTERFACE Minecraft launcher. Its release source remains `ManzanitaSpice/Interface-2`; only published releases, their Spanish notes, and uploaded downloads appear. Individual commits are excluded.

## Experience

- A nearly black room with a detailed, floor-level CRT television as the main focal point, framed at a slight side angle with enough space to show the full set.
- Soft violet and blue screen light, floor reflections, a curved CRT surface, scanlines, subtle grain and bloom, realistic shadows, and a Minecraft character seated in the left foreground in a three-quarter back view.
- The TV shows a real, keyboard-accessible HTML interface with Inicio, Actualizaciones, Descargas, and Roadmap views. It is embedded in the 3D scene rather than drawn into a screenshot.
- The avatar uses `skinview3d`'s Minecraft proportions, loads the public Notch skin by default, accepts other player names, and keeps both outer skin layers and the cape hidden.
- Camera movement is gentle, respects reduced-motion preferences, and moves closer when a section is opened.
- Desktop alone renders the 3D scene; phones show the ordinary responsive HTML page with the same releases and download controls.
- Keep supporting copy and scene props minimal. Do not use a static image to simulate a working control or scene element.

## Approved stack

- React, TypeScript, Vite, pnpm, and Tailwind CSS for the app and build.
- Three.js through React Three Fiber, with Drei for GLB loading and the transformed HTML screen.
- Poly Haven's detailed `Television 01` 2K PBR model (CC0), bundled as `public/models/television-01.glb` with glTF Transform; the source and maps stay in `assets/models/television-01-source/`.
- `skinview3d` for Minecraft player skin rendering and animation.
- GSAP for camera transitions, Zustand for active page and player settings, and `@react-three/postprocessing` for restrained bloom.
- JSON for the release feed and roadmap; GitHub Actions and GitHub Pages for automated publication.

## Release data

- A dependency-free Node script requests every page of the public GitHub Releases API for `ManzanitaSpice/Interface-2`.
- It excludes drafts and unpublished tags, includes published prereleases, preserves notes as Markdown text, and exposes the direct HTTPS download URLs and metadata for uploaded assets.
- The normalized versioned feed is served at `/Interface-Updates/data/releases.json` under the project Pages site. The frontend uses the same schema in local development and production.
- A separately edited `roadmap.json` supplies real roadmap entries with clear statuses; no placeholder controls are presented as working features.
- The feed is refreshed on repository pushes, hourly, and by manual workflow dispatch. A failed fetch or malformed response prevents deployment.

## Performance and accessibility

- Keep the 2K model below 2 MB, limit real-time lights, cap the pixel ratio, and provide a reduced-motion camera mode. Do not create a WebGL context on phones.
- Provide loading/error states for the release feed and skin lookup.
- Use semantic HTML, visible focus states, keyboard-operable navigation, and readable contrast in the CRT interface.
- Keep the mobile HTML page readable and responsive without hiding the release and download functionality.

## Hosting

The new public repository is `ManzanitaSpice/Interface-Updates`. GitHub Actions builds the Vite project, generates the release JSON, and deploys the resulting static site to GitHub Pages. The owner must select **Settings → Pages → Build and deployment → Source → GitHub Actions** before the first deployment.
