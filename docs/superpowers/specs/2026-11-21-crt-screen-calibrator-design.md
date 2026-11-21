# Temporary CRT Screen Calibrator

## Intent

Give the user a temporary live tool to align the HTML screen with the television's inner glass and save the chosen adjustment into source code.

## Goals

- Enable the tool only in Vite development mode and only with `?calibrate-screen=1`.
- Adjust the HTML plane's X/Y/Z position, width/height, and X/Y/Z rotation while previewing the scene.
- Save the selected values into a fixed TypeScript calibration module so they survive reloads.
- Keep the normal interface and the mobile page unchanged.
- Remove the temporary controls and save endpoint after the user confirms the final calibration, retaining the saved values.

## Non-goals

- Change the television model or rebuild its screen geometry.
- Add controls to production builds.
- Independently warp the four corners of the HTML content.

## Constraints

- Preserve the current Drei `Html` plane and React interface.
- Add no dependencies.
- The development save endpoint accepts only bounded numeric calibration values and always writes the same source file; it cannot choose a path from request data.
- The current worktree has unrelated TypeScript errors in `Scene.tsx` involving `cameraOverview` and `resetCameraView`; keep those outside this change.

## Approaches

1. **Adjust the 3D plane with controls (chosen).** Position, size, and rotation sliders preserve a single planar interface and its text, and the resulting transform continues to follow the scene camera.
2. **Drag four corners independently.** This offers direct corner matching but introduces a separate 2D perspective warp that can distort the content and no longer represents the TV's single screen plane.

The user selected the 3D plane controls.

## Implementation calls

- Store the calibration as position, rotation, width, and height constants in `src/scene/screenCalibration.ts`.
- Show a compact calibration panel only in desktop development when the query flag is present. Sliders update a live draft; Save writes the typed values into that module through a fixed `POST /__screen-calibration` Vite dev middleware route; Reset returns to the current source defaults.
- Keep the temporary UI and persistence middleware out of production builds. After the user completes calibration, remove the temporary tool and middleware while preserving the final constants.
- Verify by manually adjusting the plane in the local browser and confirming saved values reload from source. The existing unrelated TypeScript errors may prevent the full build from succeeding.
