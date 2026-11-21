# Individual TV Control Calibrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the right-side control backing and specified labels, and let the user calibrate each physical TV control independently with click selection and source persistence.

**Architecture:** Extend the current calibration data with a transform per physical control. Keep the existing HTML screen plane values and controls, add a development selection mode that routes existing 3D hit surfaces to a selected target, and persist the combined data through the existing fixed Vite dev endpoint.

**Tech Stack:** React 19, TypeScript, Vite 8, React Three Fiber 9, Three.js.

**Spec:** `docs/superpowers/specs/2026-11-21-individual-tv-controls-calibrator-design.md`

## Global Constraints

- Keep the user’s current screen transform `[-0.289, 1.142, 0.750]`, rotation `[0.003491, 0, 0]`, and size `886 × 678` unchanged.
- Remove the black backing panel and `INTERFACE`/`VOLUMEN` labels; preserve all seven physical controls and the `POWER` label.
- Calibration remains desktop-only, Vite development-only, and gated by `?calibrate-screen=1`.
- Add no dependencies and no automated tests; use manual browser interaction and build verification.
- The writer accepts only validated values and always writes `src/scene/screenCalibration.ts`.
- Stay in the current user-selected inline checkout and preserve unrelated worktree changes.

## Review Focus

- Power selection must not toggle the TV — manually select Power while selection mode is active and confirm the powered state does not change.
- Group isolation — manually move one selected control and confirm other controls stay put.
- Existing screen calibration — confirm its saved position, rotation, and size are retained after saving control transforms and reloading.
- Persistence input — review exact IDs, tuple lengths, finite values, and numeric bounds before the fixed-file write.
- Exposure — confirm the calibrator and endpoint are not available in production output or without the desktop dev query flag.

---

### Task 1: Per-control calibration data and 3D wiring

**Files:**
- Modify: `src/scene/screenCalibration.ts`
- Modify: `src/scene/Scene.tsx`
- Modify: `src/scene/TvPhysicalControls.tsx`

**Interfaces:**
- Add `TV_CONTROL_IDS` with `channel`, `volume`, `power`, `channelDown`, `channelUp`, `volumeDown`, and `volumeUp`.
- Add `TvControlTransform` with `position: [number, number, number]`, `rotation: [number, number, number]` in radians, and uniform `scale: number`.
- Add `TV_CONTROL_CALIBRATION: Record<TvControlId, TvControlTransform>` using the current hard-coded group positions as defaults and zero rotation/unit scale. Keep `ScreenCalibration` unchanged.
- `TvPhysicalControls` consumes the control map, `selectingControl`, and `onSelectControl(id)`; `Scene` forwards these props and defaults the map to `TV_CONTROL_CALIBRATION` until App supplies its live state in Task 2.

- [x] Add typed defaults for the seven control groups without changing the saved screen transform.
- [x] Apply each group’s position, rotation, and scale to its own parent group; retain child meshes and pointer hit surfaces.
- [x] In selection mode, route each hit surface to `onSelectControl(id)` instead of its normal action.
- [x] Remove the backing `ControlPanel` geometry and the `INTERFACE` and `VOLUMEN` surface labels; retain the `POWER` label.

### Task 2: Click-selection editor

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ScreenCalibrator.tsx`
- Modify: `src/scene/Scene.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- `App` owns `tvControlCalibration`, `selectingControl`, and `selectedControl` state and passes the selection callback into `Scene` and `ScreenCalibrator`.
- `ScreenCalibrator` keeps the existing screen-plane section and adds a toggle for 3D selection plus live controls for the selected group.
- Per-control position bounds: X `[-1.25, 1.25]`, Y `[0.05, 1.9]`, Z `[0.4, 1.15]`, step `0.001`.
- Per-control rotation: each axis `[-12°, 12°]`, step `0.1°`, converted to radians in source.
- Uniform scale `[0.6, 1.4]`, step `0.01`.

- [x] Add the selection-mode toggle, selected-control label, and position/rotation/scale sliders.
- [x] Apply draft changes only to the selected control while preserving all other transforms.
- [x] Confirm clicks inside the tool remain ignored by the scene’s existing outside-click handler.
- [x] Keep the compact amber editor functional at shorter desktop heights with internal scrolling.

### Task 3: Validated source persistence

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/components/ScreenCalibrator.tsx`

**Interfaces:**
- `POST /__screen-calibration` accepts `{ screen: ScreenCalibration, controls: Record<TvControlId, TvControlTransform> }` and returns `{ saved: true }` on success.
- Validation requires the exact seven stable IDs, finite three-number position/rotation tuples, integer screen dimensions, bounded control transforms, and a request body no larger than 4096 bytes.
- Serialization always writes the fixed `src/scene/screenCalibration.ts` module as `SCREEN_CALIBRATION` and `TV_CONTROL_CALIBRATION` exports, keeping the screen values from the submitted object.

- [x] Extend middleware validation to the complete calibration schema and reject unknown or missing control IDs.
- [x] Serialize all seven control transforms while preserving the saved screen plane values.
- [x] Keep the writer attached only to Vite’s `serve` lifecycle and report errors to the panel.

### Task 4: Manual review and build

**Files:**
- No additional files.

- [x] In the local flagged browser, select and move each of the seven controls; confirm only the selected group changes.
- [x] Select Power and confirm its action does not run until selection mode is turned off.
- [x] Save a changed control, reload, and confirm its transform plus the prior screen-plane values remain.
- [x] Confirm the right-side backing and the two requested labels are gone while the controls remain visible.
- [x] Confirm the tool remains hidden without the flag, on mobile, and in production output.
- [x] Run `pnpm build` and report its result.
