# INTERFACE Updates 3D website implementation plan

**Goal:** Build an interactive 3D GitHub Pages site for INTERFACE releases, with the actual web interface embedded in a CRT television.

**Architecture:** Vite builds a React/TypeScript application. React Three Fiber renders the dark desktop scene and detailed Poly Haven CRT; Drei attaches HTML controls to the screen. A bundled CC0 2K PBR GLB preserves the model textures. `skinview3d` renders the real Minecraft skin and body proportions. Phones receive the HTML page without a WebGL context. The app reads normalized release JSON and a maintained roadmap JSON. GitHub Actions generates the release feed and publishes the static build.

**Stack:** React 19, TypeScript, Vite, pnpm, Three.js, React Three Fiber, Drei, `gltfjsx`, `skinview3d`, GSAP, `@react-three/postprocessing`, Tailwind CSS, Zustand, GitHub Actions, and GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-20-interface-updates-backend-design.md`

## Constraints

- Source repository remains `ManzanitaSpice/Interface-2`; display releases, notes, and downloads only, never individual commits.
- The approved new public repository name is `ManzanitaSpice/Interface-Updates`.
- Use the 3D CRT scene and screenshot as a visual reference, while keeping the site's controls functional HTML.
- Do not change `C:\CodigoInterface` or the source repository.
- Do not use flat artwork to fake the 3D scene or interactive features.
- Do not create a WebGL context on mobile; respect reduced motion on desktop.
- Automated tests were not requested; do not add or run tests.

## Review focus

- GitHub pagination, malformed data checks, safe release-note rendering, and project-site URL base stay correct.
- The HTML screen remains pointer- and keyboard-interactive when attached to the 3D scene.
- Skin lookup errors leave the default avatar intact; dispose viewer resources on unmount.
- The CC0 PBR GLB loads under the project path without third-party decoder downloads.
- Reduced-motion and mobile layouts keep the same navigation and release downloads available.

## Implementation

### 1. Preserve and adapt the release backend

- [x] Generate normalized paginated release JSON from the public source repository.
- [x] Fail safely on API errors and malformed release or asset metadata.
- [x] Keep published prereleases; exclude drafts and unpublished releases.
- [x] Document the Pages feed URL and manual refresh.
- [ ] Move the feed artifact into Vite's public data directory for local and production use.

### 2. Build the React and 3D scene

- [ ] Add Vite, React, and TypeScript project config with `/Interface-Updates/` build base.
- [x] Bundle the CC0 2K PBR CRT GLB and load it through Drei.
- [x] Build the near-black floor scene, screen glow, shadows, curved display treatment, grain, scanlines, and bloom.
- [x] Add the correctly proportioned, seated skin avatar on the left, with its outer layer and cape hidden.
- [x] Add smooth camera focus on section navigation and reduced-motion handling.

### 3. Make the TV interface functional

- [ ] Embed an accessible React HTML interface on the TV using Drei `Html` transform.
- [ ] Implement Inicio, Actualizaciones, Descargas, and Roadmap views with Zustand navigation.
- [ ] Read releases from JSON, displaying notes and direct download links safely.
- [ ] Add an editable roadmap JSON file and loading/empty/error states.
- [ ] Add a username lookup and load the Minecraft skin into `skinview3d` with visible status/errors.

### 4. Responsive and deployment setup

- [x] Add CRT scanlines and grain, Tailwind styling, focus visibility, and a mobile HTML page without WebGL.
- [ ] Update GitHub Actions to install from `pnpm-lock.yaml`, refresh feed JSON, build Vite, and deploy Pages.
- [ ] Document local run/build, roadmap editing, releases, skin service attribution, and Pages setup.
- [ ] Remove the obsolete plain HTML draft once the Vite app is in place.

## Publication after code review

- [x] Confirm that `ManzanitaSpice/Interface-Updates` is unused; do not overwrite an existing repository.
- [ ] Create the repository, then set **Settings → Pages → Build and deployment → Source → GitHub Actions**.
- [ ] Push the completed `main` branch to the new repository.
- [ ] Confirm the Pages workflow publishes the site and release feed.

## Known external dependency

Username-based skin lookup uses the documented MCHeads skin endpoint, which resolves usernames and supports CORS. The page should surface a clear error and keep the default avatar when that third-party service is unavailable.
