# Worn wood floor PBR design

## Intent

Replace the flat dark floor with worn wooden planks that add a nostalgic, cozy feel while keeping the room black and minimal. Wood grain and surface wear should read mainly when the existing warm lights hit them.

## Goals

- Give the floor a subtle, repeating plank layout with restrained grain, seams, and scuffs.
- Use high roughness and near-zero metalness for a matte, low-reflection finish.
- Use surface relief and roughness variation so imperfections respond to lighting.
- Preserve the dark room, existing warm light pool, floor shadows, camera, and scene performance.

## Non-goals and anti-goals

- Do not add furniture, change room lighting, or introduce a glossy floor effect.
- Do not add external texture assets or change the existing plane footprint.
- Avoid bright or high-contrast boards that remain prominent in the unlit room.

## Constraints

- Keep the existing Three.js / React Three Fiber scene and single floor plane.
- Use `MeshStandardMaterial` PBR maps, generated locally and repeated across the plane.
- Set the color map to sRGB; keep roughness and normal/height maps as non-color data.
- Keep the map and material lifecycle bounded to the floor component.

## Approaches

1. **Procedural PBR maps on the existing plane (chosen).** Generate subdued color, roughness, and shallow relief maps. This preserves the lightweight scene and makes wear respond to the TV's existing light.
2. Separate plank meshes. This would create stronger physical joints but increase geometry and could make seams visible even when unlit.
3. Add a sourced PBR wood set. This could provide authored detail but would add large external assets and sourcing/licensing work.

The user chose procedural PBR maps on the plane.

## Implementation calls

- Keep board color variation and seams subdued; let roughness and shallow relief carry most of the worn detail under light.
- Use dark, warm-brown wood, high roughness, and nearly zero metalness.
- Reuse the existing amber lighting and floor glow; do not change them as part of this floor material update.

## Builder decisions

- Choose a repeat scale and map resolution that show believable board widths from both overview and zoomed camera views.
- Keep generated patterns deterministic and dispose of textures when the floor material is removed.
