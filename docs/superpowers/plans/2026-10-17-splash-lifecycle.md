# KIRANE Splash Lifecycle Implementation Plan

> The user-provided task brief is the design specification. The user has asked to proceed directly with implementation.

**Goal:** Replace splash timeout behavior with explicit readiness and a continuous single-sphere handoff into the existing hero.

**Architecture:** Keep one `ParticleSphere` mounted in the app shell behind both the splash typography and the hero. A typed lifecycle reducer waits for shell, font, hero-layout, renderer, and reveal completion signals before starting a renderer-owned acceleration/settle sequence. Splash typography mounts only once the critical font has settled, preventing a font swap during the stroke draw. The hero is mounted early but remains visually hidden, inert, and noninteractive until the sphere settles; its reveal completion enables normal interaction.

**Tech Stack:** React 19, TypeScript, Vite, Motion for React, React Three Fiber/Three.js, Vitest, React Testing Library.

**Spec:** The user-provided attachment in this task.

## Global Constraints

- Keep the particle geometry, shaders, palette, lighting, and ordinary rotation behavior intact.
- Do not use a fixed splash-dismissal timeout or localStorage/sessionStorage bypass.
- Preserve outline-only `KIRANE | OMKAR`, the existing tagline text, and the scramble effect.
- Do not wait for below-fold work; there are no hero raster images or dynamic data requests in the current app.
- Use native HTTP caching and Vite hashed assets; do not add a host configuration because no deployment provider is configured.
- Add no dependencies or service worker.
- Respect reduced motion, safe areas, keyboard access, and horizontal overflow constraints.

## Review Focus

- WebGL/context failure must report readiness through the existing static fallback.
- Font failure must settle to the system fallback instead of trapping the visitor.
- Duplicate callbacks under StrictMode must not advance lifecycle phases twice.
- Splash readiness arriving before or after the tagline must not restart either animation.
- The Canvas must remain mounted exactly once through the handoff.

---

### Task 1: Typed splash readiness and lifecycle

**Files:** Create `src/app/splash-lifecycle.ts` and `src/app/splash-lifecycle.test.ts`.

**Interface:** `SplashLifecycleState` stores a phase, required readiness signals, and intro completion; `splashLifecycleReducer` consumes typed readiness, reveal, sphere-transition, and hero-reveal events. Required signals are `app-shell`, `critical-fonts`, `hero-layout`, and `sphere-renderer`.

- [x] Test all readiness signals, order independence, duplicate events, and reveal-before-ready/readiness-before-reveal.
- [x] Run the lifecycle tests and confirm the missing reducer/signals fail.
- [x] Implement the reducer and run the tests green.

### Task 2: Explicit intro and hero readiness signals

**Files:** Modify `src/components/Animations&Motion/TextAnimations/tsx/ScrambleReveal.tsx` and its test; modify `src/components/effects/SplashScreen/SplashScreen.tsx`; modify `src/sections/Hero/Hero.tsx`; add a focused Hero readiness test.

**Interfaces:** Add `ScrambleReveal.onComplete`; give `SplashScreen` an exit state and reveal-complete callback; give `Hero` readiness and reveal-complete callbacks plus a controlled `active` prop.

- [x] Test completion callback timing/once-only behavior for normal, reduced-motion, zero-duration, and pending-start modes.
- [x] Test Hero layout reporting and deferred reveal completion.
- [x] Implement the callback surfaces without changing copy or the outline/tagline styling.

### Task 3: One persistent sphere with a transition phase

**Files:** Modify `src/components/effects/ParticleSphere/ParticleSphere.tsx`; create and test `src/components/effects/ParticleSphere/sphere-transition.ts`.

**Interface:** `ParticleSphere` accepts a typed `phase`, `onReady`, and `onTransitionComplete`; transition math yields rotation multiplier, group scale, and responsive group offset without changing particle construction or shaders.

- [x] Test transition endpoints, smooth intermediate acceleration/settling, reduced-motion behavior, and responsive offset limits.
- [x] Implement renderer readiness/fallback signaling and one in-place scene transform; preserve geometry and avoid recreating Canvas on phase changes.
- [x] Run sphere-transition tests and confirm a single Canvas remains through each phase.

### Task 4: App orchestration, hero sequence, and accessibility

**Files:** Modify `src/app/App.tsx`, `src/sections/Hero/Hero.tsx`, `src/components/effects/SplashScreen/SplashScreen.tsx`, and splash lifecycle tests.

- [x] Test that the splash waits for both readiness and the full tagline, then starts sphere transition, then hero reveal, then interaction.
- [x] Test no automatic dismissal, reduced motion, timer absence, and inert/pointer behavior.
- [x] Mount one app-level sphere, keep the hero shell pre-rendered and inert, fade only splash typography during sphere motion, reveal the hero after settling, and enable interaction after hero completion.

### Task 5: Asset/caching audit and final verification

**Files:** Modify `index.html` or shared styles only if font configuration needs adjustment; update deployment docs/config only if an actual provider is present.

- [x] Confirm one Space Grotesk request, `font-display: swap`, system fallback, no hero image/data fetches, no service worker, and no host-specific configuration.
- [x] Run `npm test`, `npm run typecheck`, and `npm run build`.
- [x] Inspect live desktop/tablet/mobile layouts and verify one Canvas, no horizontal overflow, and no click-blocking splash after handoff.
