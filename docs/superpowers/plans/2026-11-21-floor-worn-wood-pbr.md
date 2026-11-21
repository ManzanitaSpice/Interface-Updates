# Worn Wood Floor PBR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat dark floor with subtly worn wood planks whose surface detail responds to warm light while the room remains dark.

**Architecture:** Add a focused `WoodFloor` scene component that generates deterministic, repeating color, roughness, and height textures locally and applies them to one `MeshStandardMaterial`. Replace the current plane in `Room` with this component, keeping its dimensions, position, shadow reception, and existing reflection overlay.

**Tech Stack:** React, TypeScript, Three.js, React Three Fiber.

**Spec:** `docs/superpowers/specs/2026-11-21-floor-worn-wood-pbr-design.md`

## Global Constraints

- Keep the existing Three.js / React Three Fiber scene and single floor plane.
- Use `MeshStandardMaterial` PBR maps, generated locally and repeated across the plane.
- Set the color map to sRGB; keep roughness and normal/height maps as non-color data.
- Preserve the dark room, existing warm light pool, floor shadows, and camera.
- Avoid bright or high-contrast boards that remain prominent in the unlit room.
- Do not add or run tests; build verification is limited to TypeScript and bundling.

## Review Focus

- Plank seams and color remain subdued when the TV is off.
- Warm direct lighting reveals grain, shallow scuffs, and changes in surface roughness.
- High roughness and near-zero metalness keep reflections soft.
- The texture pattern tiles across the 90 by 90 plane without obvious texture borders.
- Generated textures are disposed when the floor component unmounts.

---

### Task 1: Add the procedural PBR floor

**Files:**
- Create: `src/scene/WoodFloor.tsx`
- Modify: `src/scene/Scene.tsx` (`Room`)

**Interfaces:**
- Produces: `WoodFloor`, a no-props React Three Fiber scene component that owns its generated textures and floor material.
- Consumes: Three.js canvas textures, the existing `Room` lighting, and the current floor transform and shadow behavior.

- [x] **Step 1: Create deterministic repeating wood maps in `src/scene/WoodFloor.tsx`**

Generate a muted warm-brown color canvas with staggered plank ends, fine longitudinal grain, and sparse shallow scuffs. Generate a mostly high-value roughness canvas and a low-contrast height canvas for subtle light-catching relief. Wrap all maps with `RepeatWrapping`, repeat them to give floorboards believable proportions at the scene scale, set only the color map to `THREE.SRGBColorSpace`, and cap anisotropy to the renderer-supported maximum (up to 8).

- [x] **Step 2: Apply the maps with a matte `MeshStandardMaterial` and preserve the existing floor mesh behavior**

Use high roughness, near-zero metalness, and a small bump scale. Keep the floor plane at `[0, -0.04, 0]`, rotated `[-Math.PI / 2, 0, 0]`, sized `90 x 90`, and receiving shadows. Dispose all generated textures when `WoodFloor` unmounts.

- [x] **Step 3: Mount `WoodFloor` from `Room` in `src/scene/Scene.tsx`**

Replace only the inline floor mesh and its material; leave `ScreenReflection` and the existing lights in their current order and positions.

- [x] **Step 4: Run the production build**

Run: `pnpm build`
Expected: TypeScript completes and Vite produces the production bundle successfully; no tests are added or run.
