# Subtle overview camera sway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a subtle, sustained floating sway to the distant desktop camera overview.

**Architecture:** Extend the existing `CameraMotion` frame loop with small, smoothly varying position and aim offsets whose influence follows overview state. Keep the existing position tween responsible for zoom depth.

**Tech Stack:** React, React Three Fiber, Three.js, GSAP.

**Spec:** `docs/superpowers/specs/2026-11-21-camera-sway-design.md`

## Global Constraints

- Use the current React Three Fiber `CameraMotion` implementation and existing animation stack.
- Preserve the existing camera transitions and wheel zoom behavior.
- Apply no idle sway when reduced motion is enabled.

## Review Focus

- Reduced motion enabled: no idle sway is applied.
- Focused section: sway fades away rather than competing with the close-up transition.
- Overview restored: sway returns smoothly without a visible jump.
- Wheel zoom in overview: sway does not overwrite the chosen zoom distance.
- Pointer movement: existing subtle look response remains active alongside the sway.

---

### Task 1: Add overview sway

**Files:**
- Modify: `src/scene/Scene.tsx` (`CameraMotion`)

**Interfaces:**
- Consumes: existing `page`, `cameraOverview`, `reducedMotion`, pointer, and frame clock.
- Produces: restrained, low-frequency offsets to camera position and aim in overview only.

- [x] Add smoothly composed slow oscillations to the existing `useFrame` aim calculation and fade their influence with overview/focus state.
- [x] Keep the existing pointer offsets and bypass idle motion for reduced-motion users.
- [x] Keep the positional sway independent of the GSAP zoom tween; automated tests were not added or run.
