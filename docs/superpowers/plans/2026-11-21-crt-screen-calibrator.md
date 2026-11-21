# Temporary CRT Screen Calibrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let the user adjust the CRT HTML plane live in development and save the final transform into source code.

**Architecture:** Keep the existing Drei `Html` screen as one plane. Thread a typed calibration object from `App` through `Scene` to `PoweredTvScreen`, expose live position/size/rotation sliders behind a development query flag, and persist a validated selection through a fixed Vite dev middleware endpoint.

**Tech Stack:** React 19, TypeScript, Vite 8, React Three Fiber, Drei `Html`.

**Spec:** `docs/superpowers/specs/2026-11-21-crt-screen-calibrator-design.md`

## Global Constraints

- Enable the tool only in Vite development mode and with `?calibrate-screen=1`.
- Preserve the current Drei `Html` plane and React interface.
- Add no dependencies.
- Write only the fixed calibration module; never accept a path from the request.
- Keep production UI and production server output unchanged.
- The current worktree has unrelated TypeScript errors in `Scene.tsx` involving `cameraOverview` and `resetCameraView`.

## Review Focus

- Production build: the calibrator and save endpoint are absent when Vite runs `build`.
- Calibration values: non-finite values and values outside the UI ranges are rejected before file write.
- Save target: request data cannot change the destination from `src/scene/screenCalibration.ts`.
- Live preview: slider updates move the HTML plane without changing the normal screen interface.
- Click handling: clicks within the calibration panel do not trigger the existing outside-panel camera handler.

---

### Task 1: Typed calibration state and screen wiring

**Files:**
- Create: `src/scene/screenCalibration.ts`
- Modify: `src/App.tsx`
- Modify: `src/scene/Scene.tsx`
- Modify: `src/scene/PoweredTvScreen.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- `ScreenCalibration`: `{ position: [number, number, number]; rotation: [number, number, number]; width: number; height: number }`, with rotation in radians and dimensions in CSS pixels.
- `SCREEN_CALIBRATION`: source defaults, initially position `[-0.25, 1.10, 0.914]`, rotation `[0, 0, 0]`, width `933`, height `733`.
- `App` owns the live value and passes it to `Scene`; `Scene` passes it to `PoweredTvScreen`.
- `crt-power-stage` receives inline pixel width/height; `.tv-interface` fills that stage with `width: 100%` and `height: 100%`.

- [x] Create the typed source defaults and screen calibration value in `src/scene/screenCalibration.ts`.
- [x] Thread `ScreenCalibration` through `App`, `Scene`, `Room`, and `Television` without changing camera or page behavior.
- [x] Apply position and rotation to Drei `Html`; apply width and height to both `.crt-power-stage` and `.tv-interface` so the page stays at the plane's center.
- [x] Manually confirm a changed calibration prop updates the screen while the TV remains interactive.

### Task 2: Development calibration panel

**Files:**
- Create: `src/components/ScreenCalibrator.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- `ScreenCalibrator({ value, onChange, onSave })` edits the live `ScreenCalibration` draft.
- `onSave(value: ScreenCalibration): Promise<void>` reports completion or throws on save failure.
- Slider ranges are position X `[-0.55, 0.05]`, Y `[0.9, 1.3]`, Z `[0.75, 1.1]` (step `0.001`); width `[820, 1050]` and height `[650, 850]` CSS pixels (step `1`); X/Y/Z rotation `[-8°, 8°]` (step `0.1°`, converted to radians in the value).

- [x] Render the panel only on desktop when `import.meta.env.DEV` and `calibrate-screen=1` are both true.
- [x] Add sliders for X/Y/Z position, width/height, and X/Y/Z rotation, with live value labels.
- [x] Add `Guardar en código` and `Restaurar` actions, plus a concise save/error status.
- [x] Style the panel as a compact amber utility overlay and mark its root with `.tv-interface` so the current document pointer handler ignores clicks inside it.
- [ ] Manually use the sliders to confirm all eight controls update the screen in the running scene. (Panel exposes all eight controls; live movement was manually confirmed for X and width.)

### Task 3: Fixed development-only source writer

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/components/ScreenCalibrator.tsx`

**Interfaces:**
- `POST /__screen-calibration` accepts JSON `{ position, rotation, width, height }` and returns `{ saved: true }` or a concise 4xx/5xx error.
- The middleware always writes `src/scene/screenCalibration.ts` and has `apply: 'serve'`.

- [x] Add a Vite plugin with a `configureServer` middleware for `POST /__screen-calibration` only.
- [x] Limit request size, validate finite numbers and the same bounds shown by the sliders, and reject malformed input.
- [x] Serialize validated values into the fixed calibration module; never use request-provided file paths.
- [x] Connect `Guardar en código` to the endpoint and show success only after the write succeeds.
- [x] Manually save a non-default transform, reload the flagged page, and confirm the saved source values are used.

### Task 4: Final local review

- [ ] Open the local app with `?calibrate-screen=1` and adjust the plane against the inner TV corners.
- [ ] Save the final values and confirm they remain after reload.
- [x] Confirm the panel is hidden without the flag and on mobile.
- [x] Run `pnpm build`; report the existing `Scene.tsx` type errors separately if they remain.
- [x] Leave the calibrator available behind the dev query flag until the user confirms the adjustment is final; then remove the temporary UI and middleware while keeping the saved calibration constants.
