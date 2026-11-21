# INTERFACE Vintage Scene Implementation Plan

> **For agentic workers:** This plan is being executed inline with the user's prior approval of the cream-and-amber design and preserved CRT model.

**Goal:** Apply the approved vintage look to the actual CRT interface and scene, and fix the avatar and physical controls.

**Architecture:** Keep the existing Vite app, JSON-backed React pages, Drei HTML portal, and Poly Haven PBR GLB. Update screen styling and copy, replace the static-looking control overlays with separated animated meshes, and use a local Steve skin with corrected seated placement.

**Tech Stack:** React, TypeScript, Vite, Three.js, React Three Fiber, Drei, skinview3d, GSAP, Zustand, Web Audio.

**Spec:** `docs/superpowers/specs/2026-11-21-interface-vintage-scene-design.md`

## Global Constraints

- Desktop keeps real-time 3D; mobile keeps the normal responsive HTML page without WebGL.
- Keep the existing JSON release feed and all four working sections.
- Keep the current CC0 PBR CRT model.
- Use the warm cream-and-amber 1980s direction; keep on-screen copy concise.
- Do not publish or push changes during this implementation.
- Do not add or run automated tests; use the existing production build and manual browser checks.

## Review Focus

- Display controls remain clickable when the scene is zoomed and the TV is powered off.
- Channel changes select the expected content page and update the visible dial marker.
- Failed player skin requests leave the bundled Steve avatar visible.
- Skin alpha/outer-layer pixels remain visible without texture bleeding or blur.
- Desktop and mobile retain the intended separate layouts.

---

### Task 1: Vintage HTML screen

**Files:**
- Modify: `src/components/TvInterface.tsx`
- Modify: `src/styles.css`
- Modify: `src/scene/PoweredTvScreen.tsx`

**Interfaces:** Keep `PageId`, release data hooks, and current navigation actions unchanged. Keep the mobile prop and Drei `Html` portal.

- [ ] Replace the redundant home headline and descriptions with one latest release, date, brief summary, and a notes action.
- [ ] Rename the section label to `Versiones`; retain real releases, downloads, and roadmap content.
- [ ] Apply cream, aged-paper, dark-brown, and amber colors consistently to desktop and mobile.
- [ ] Expand the HTML surface to fill the CRT glass with a restrained curvature, scanlines, and local warm glow; remove the floating-card appearance.
- [ ] Build the app and inspect the embedded home and release pages at desktop and mobile sizes.

### Task 2: Physical controls, channel routing, and power audio

**Files:**
- Modify: `src/scene/TvPhysicalControls.tsx`
- Modify: `src/state/tvStore.ts`
- Modify: `src/scene/Scene.tsx`

**Interfaces:** Keep `TvState` setters and `InterfaceState.setPage`; map channels 1–4 to `home`, `updates`, `downloads`, `roadmap`.

- [ ] Replace the dials with layered recessed rings and complete rotating knobs whose marks turn with the control.
- [ ] Rebuild the lower button row with clear spacing and labels `CH−`, `CH+`, `VOL−`, `VOL+`; animate press travel and keep actual R3F raycast targets.
- [ ] Route knob and channel button actions to the matching page; show volume changes on the volume knob and power lamp.
- [ ] Add brief synthesized analog power-on and power-off sounds, unlocked only by the user's switch click.
- [ ] Change room and screen reflection lighting from violet/blue to warm amber while retaining dark surroundings and floor shadows.
- [ ] Build and manually operate each knob, button, and switch in the browser.

### Task 3: Bundled Steve skin and grounded seated pose

**Files:**
- Create: `public/skins/steve.png`
- Modify: `src/scene/SkinAvatar.tsx`
- Modify: `src/state/interfaceStore.ts`
- Modify: `docs/ASSET_CREDITS.md`

**Interfaces:** Keep `skinUsername`, `skinRequestId`, and `setSkinResult`; retain `skinview3d` `PlayerObject` and normalized canvas skin mapping.

- [ ] Bundle the default Steve texture and initialize the avatar with it before any remote request.
- [ ] Enable the outer skin layers, detect slim/classic models, use pixel-safe mipmapping, and clean up replaced textures.
- [ ] Keep Steve visible if a requested skin fails; keep cape and elytra hidden.
- [ ] Lower and scale the avatar to a seated posture with its hips at floor level, legs extended forward, and body angled toward the CRT.
- [ ] Build and inspect the default, loaded-skin state and floor contact in the desktop scene.

### Task 4: Final manual verification

- [ ] Run `pnpm build` and read the complete result.
- [ ] Inspect the desktop home and all four pages in the live browser; confirm controls are absent and screen fills the glass.
- [ ] Confirm zooming the TV does not disable its HTML navigation or raycast controls.
- [ ] Inspect the mobile route at 390px width; confirm it uses HTML only and keeps navigation/links usable.
- [ ] Review the resulting source diff and report any remaining limitation.
