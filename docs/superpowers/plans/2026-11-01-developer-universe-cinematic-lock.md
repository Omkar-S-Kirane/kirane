# Developer Universe Cinematic Lock Implementation Plan

> **Execution:** Implement inline in the current workspace. Do not commit without user approval.

**Goal:** Make Hero and Developer Universe one full-screen, reversible, gesture-controlled transformation, then release normal page scrolling.

**Spec:** `docs/superpowers/specs/2026-11-01-developer-universe-cinematic-lock-design.md`

## Task 1 — Specify and test progress/input rules

**Files:** `src/sections/CinematicJourney/cinematic-progress.ts`, `src/sections/CinematicJourney/cinematic-progress.test.ts`.

- [x] Test progress clamping, line/page wheel normalization, max delta bounds, directional boundary capture, reversal, and dissolve progress.
- [x] Test the organic Hero clip path is complete at 0, ragged at mid-transition, and fully removed at 1.
- [x] Implement only the pure helpers required by those tests.

## Task 2 — Build the scoped cinematic interaction controller

**Files:** `src/sections/CinematicJourney/CinematicJourney.tsx`, `src/sections/CinematicJourney/CinematicJourney.css`, `src/sections/CinematicJourney/index.ts`, relevant tests.

- [x] Add a 100svh journey root with a shared target/smoothed MotionValue and native wheel/touch listeners attached only to that root.
- [x] Consume only vertical input that advances or reverses progress at the document top; normalize wheel modes and bound each input step.
- [x] Add focused keyboard controls and keep interactive descendants' normal keys intact.
- [x] Lock document overflow only while the visual transition is incomplete; remove the lock when the scene completes. Reduced-motion mode does not lock scrolling.
- [x] Expose `reset` and `completeForNavigation` actions for Home/Impact/other navbar destinations.
- [x] Verify lock boundaries, keyboard input, and navigation release with focused tests and browser interaction.

## Task 3 — Compose Hero, Universe, and metrics in one viewport

**Files:** `src/app/App.tsx`, `src/sections/PortfolioSections/PortfolioSections.tsx`, `src/sections/EngineeringImpact/EngineeringImpact.tsx`, `src/components/DeveloperUniverse/developerUniverse.css`, `src/app/LenisProvider.tsx`.

- [x] Move Hero and Engineering Impact into the same full-screen `CinematicJourney`; keep Work and later sections in document flow after it.
- [x] Convert Impact's long sticky-scroll section to a full-screen overlay that receives the shared progress.
- [x] Preserve Impact hash navigation; complete the journey before navigating to later sections, reset for Home, and complete for Impact.
- [x] Keep the existing Lenis route behavior; its main-portfolio configuration leaves wheel smoothing disabled while the journey owns its local transition input.
- [x] Test that no other section sits between Hero, the universe, and the completed Impact metrics.

## Task 4 — Add the Hero dissolve and particle flow

**Files:** `src/sections/Hero/Hero.tsx`, `src/sections/CinematicJourney/HeroParticleBridge.tsx`, `src/sections/CinematicJourney/cinematic-progress.ts` and tests.

- [x] Apply a progress-driven, deterministic noise-shaped clip to the Hero layer; keep the start frame unchanged and fully remove it at completion.
- [x] Draw bounded golden particles from the moving boundary toward the center with varied depth, glow, and curved trails; derive all positions from progress and resize, with no animation timer.
- [x] Layer the existing universe behind the dissolving Hero and let its starfield take over as the dissolve completes.
- [x] Test that the Hero clip is full at progress 0 and that the deterministic particle layer is layered across the scene.

## Task 5 — Preserve the existing universe and finish verification

**Files:** `src/sections/EngineeringImpact/EngineeringImpact.tsx`, `src/components/DeveloperUniverse/DeveloperUniverse.tsx`, existing tests, relevant styles.

- [x] Reuse the current right-to-center sun, Orbitron identity, planets, orbits, interactions, information cards, and all four metric values.
- [x] Retain the Hero in reduced-motion mode and snap progress endpoints; preserve keyboard and touch access.
- [x] Run focused tests, the full Vitest suite, typecheck, lint, formatting, and production build.
- [x] Browser-check wheel input, keyboard progress, reverse gestures, scoped capture, navigation release, mobile/tablet layouts, metric readability, overflow, and console errors.

## Verification notes

- Typecheck, formatting, lint, and production build complete. Lint reports existing warnings in unrelated files; build reports the existing large-chunk advisory.
- The full suite reports 124 passing tests and four known baseline failures in the stale splash handoff, stale Hero copy/CTA expectations, and ParticleSphere palette test. The Vengeance test file also contains no test suite. New cinematic and section-order tests pass.
- Browser checks used desktop, tablet, 390 px, and 320 px viewports. Mouse wheel and keyboard input were exercised, including reversal and release into Work; touch event direction and horizontal gesture pass-through are covered in component tests. Physical trackpad/touch hardware and OS reduced-motion emulation were unavailable in this browser session; reduced-motion progress snaps to the Hero or completed endpoint by implementation.
