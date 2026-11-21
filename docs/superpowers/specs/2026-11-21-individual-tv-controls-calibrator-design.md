# Individual TV Control Calibrator

## Intent

Remove the dark backing plate behind the television's physical controls and remove the `INTERFACE` and `VOLUMEN` labels. Keep the channel and volume knobs, the power button, and the four lower buttons. Let the user select and calibrate each physical control separately in the development scene, then save those values to source code.

## Goals

- Preserve the saved screen plane calibration: position `[-0.289, 1.142, 0.750]`, rotation `[0.003491, 0, 0]` radians, size `886 × 678` CSS pixels.
- Remove the physical control panel backing geometry and only the `INTERFACE` and `VOLUMEN` labels. Keep the `POWER` label because the user named only the other two labels for removal.
- Calibrate seven physical control groups individually: channel knob, volume knob, power button, channel down, channel up, volume down, and volume up.
- Use direct pointer selection in the 3D scene. A dedicated selection mode intercepts control clicks so selecting the power button or another control cannot invoke its normal action.
- Provide live position, rotation, and uniform scale adjustments for the selected group.
- Save the per-control transforms into the same fixed source module used by the existing screen calibrator.
- Keep calibration available only on desktop, in Vite development, with `?calibrate-screen=1`.

## Non-goals

- Change the HTML interface content, its background, or its text.
- Calibrate individual HTML buttons or text blocks inside the screen.
- Change the camera, television model, normal control actions, or mobile interface.
- Add dependencies or include the calibrator in production builds.

## Constraints

- The existing `TvPhysicalControls.tsx` defines the channel and volume knobs, power button, and four bottom buttons as separate Three.js groups with hard-coded positions. The power button currently toggles power and audio on click.
- `ControlPanel` renders the separate backing geometry; `SurfaceLabel` renders the `INTERFACE`, `VOLUMEN`, and `POWER` text.
- The user's saved screen-plane values are already in `src/scene/screenCalibration.ts` and must survive any source-writer changes.
- The development endpoint must validate a fixed list of control IDs and bounded numeric transforms; request data cannot choose a file path.

## Approaches

1. **Select a 3D control by clicking it (chosen).** The existing control hit surfaces identify the selected group. This matches what the user sees; a dedicated selection mode prevents accidental clicks from changing channel, volume, or power.
2. **Select a named control from a list.** This is simple and reliable, but makes the user map list names to objects in the scene.
3. **Show a full set of sliders for all controls at once.** This avoids a selection step but creates a large panel and makes it harder to track which values affect which control.

The user chose direct click selection.

## Interaction

- The existing screen-plane calibration remains available and keeps its saved transform and size.
- Add a `Seleccionar control` mode. While active, clicking one of the seven physical controls selects it and suppresses its normal action.
- Show the selected control name and its X/Y/Z position, X/Y/Z rotation, and uniform scale controls. Changes apply live only to the selected group.
- Save writes the screen-plane settings and every control transform to `src/scene/screenCalibration.ts`; reload rehydrates all values from that module.
- Leaving selection mode restores normal interactions immediately.
- The screen's web interface stays visually and functionally unchanged.

## Implementation calls

- Use stable IDs: `channel`, `volume`, `power`, `channelDown`, `channelUp`, `volumeDown`, and `volumeUp`.
- Put each existing physical-control group under its own calibrated transform while retaining its internal mesh hierarchy and pointer surface.
- Remove the `ControlPanel` backing group and the `INTERFACE` and `VOLUMEN` labels. Preserve the `POWER` label as it was not included in the user's requested removals.
- Extend the existing development-only source writer with strict shape, ID, finite-number, range, and request-size validation. Keep the save target fixed.
- Choose practical transform bounds in the implementation from current model units; the controls must stay near the TV's front face.

## Success criteria

- The right side of the TV shows the controls without their black backing plate, and `INTERFACE`/`VOLUMEN` text is gone.
- Selecting and moving any of the seven groups affects only that group; the power button does not toggle while selection mode is active.
- Saved transforms are present in source and remain after a reload.
- A normal development page without the query flag and all production builds contain no calibration panel or source-writing endpoint.
