# INTERFACE vintage screen and CRT controls

## Intent

Make the live desktop experience visibly match the approved 1980s cream-and-amber direction. Keep the real, interactive release interface inside the existing CC0 CRT model; mobile continues to use a normal responsive HTML page without WebGL.

## Goals

- Replace the purple card with a warm, restrained CRT screen that fills the glass and has concise copy.
- Keep Inicio, Versiones, Descargas, and Roadmap backed by the existing JSON feed.
- Make the two tuning knobs, four lower buttons, and power switch visually distinct, physically animated, raycast-clickable, and useful.
- Make channel selection navigate the matching section; make volume and power state visible and audible with short vintage switch tones.
- Use Steve as the bundled default skin, show both the inner and outer skin layers, normalize incoming skins, and seat the avatar on the floor at the left of the television.
- Warm the 3D lighting to amber while preserving the CRT's PBR maps, low-key room, and desktop-only WebGL.

## Non-goals

- Replace the existing CC0 television model or add furniture and decorative set pieces.
- Change the release-feed contract, source repository, or GitHub Pages publishing flow.
- Create images that imitate interactive controls.

## Constraints

- Preserve the existing Vite, React, TypeScript, Three.js, React Three Fiber, Drei, skinview3d, GSAP, and Zustand stack.
- Preserve the 3D experience only above the existing mobile breakpoint; keep all four sections usable on mobile.
- Keep model, material, skin and audio assets local where they are required for reliable rendering.
- Keep screen text short and avoid duplicate version or launcher descriptions.

## Approaches considered

1. **Keep the current CRT and portal, rebuild the display and controls around them (chosen).** This preserves the CC0 PBR model and working JSON interface while replacing the parts that currently look unfinished.
2. Replace the television with a new Blender model. This would require a new asset, license review, UV work and screen alignment before the interface could be trusted.
3. Use a static render as the scene. This conflicts with the required real-time 3D scene and clickable hardware.

The user chose the cream-and-amber palette and asked to retain the current detailed CRT while rebuilding its controls. The previous vintage mockup establishes the shorter content hierarchy.

## Implementation calls

- Keep the screen as Drei `Html` backed by the existing React interface; make it a full-bleed glass display instead of a floating rounded card.
- Build replacement control faces and caps as Three.js meshes over the model's textured control area so clicks visibly rotate or depress real geometry.
- Bundle the Steve default texture and use the same normalization/filtering path for default and requested skins.
- Use small generated Web Audio tones on user-initiated power transitions; keep the sound short and local.
