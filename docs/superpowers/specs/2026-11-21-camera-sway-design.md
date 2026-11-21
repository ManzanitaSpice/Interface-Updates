# Subtle camera sway in overview

## Intent

Give the distant television overview a subtle, sustained floating camera motion so the scene feels gently alive.

## Goals

- Add slow, low-amplitude motion to both camera position and aim only in the distant overview.
- Ease the sway away when a section is focused, without changing zoom, pointer response, or navigation.
- Keep the motion disabled when the user requests reduced motion.

## Non-goals and anti-goals

- Do not add controls, dependencies, camera shake, abrupt jitter, or motion to the focused view.
- Do not change mobile rendering or the television scene.

## Constraints

- Use the current React Three Fiber `CameraMotion` implementation and existing animation stack.
- Preserve the existing camera transitions and wheel zoom behavior.

## Approaches

1. **Slow oscillations in the scene (chosen).** Compose a few low-frequency offsets to camera position and aim in the existing frame loop, then fade their influence based on overview/focus state. The current position tween only controls zoom depth, so the small horizontal and vertical offsets can be applied without competing with it.
2. **A repeating animation sequence.** Animate small offsets through a timeline. This is easy to tune as keyframes, but adds timeline lifecycle and can feel cyclic.

The user chose a subtle floating sway and selected slow scene oscillations.

## Implementation calls

- Keep the effect subtle, slow, and continuous in the distant overview.
- Include small positional movement as well as aim movement so the scene has visible parallax.
- Fade it out as the camera focuses on a section.
- Respect reduced-motion preference by applying no idle sway in that mode.
- Leave tuning values to implementation, keeping the movement visually restrained.
