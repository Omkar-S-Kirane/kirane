# Developer Universe Natural Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Hero-to-Impact journey use native document scrolling with a sticky, scroll-linked Developer Universe.

**Architecture:** Restore all existing portfolio sections to document flow and use IntersectionObserver for active navigation. Make Impact a sticky viewport within a longer section and feed Motion `useScroll` progress to the existing formation timeline; remove only the duplicated Hero bridge image.

**Tech Stack:** React 19, TypeScript, Motion, React Three Fiber/Three.js, Lenis, Vitest, Oxlint, Vite.

**Spec:** `docs/superpowers/specs/2026-11-02-developer-universe-natural-scroll-design.md`

## Global Constraints

- Native browser wheel, trackpad, keyboard, and mobile touch scrolling.
- No wheel/touch interception, forced transitions, aggressive scroll snapping, or new animation dependencies.
- Preserve current Hero, golden sphere, planets, content, and four metric values.
- Honor `prefers-reduced-motion`; maintain reverse-scroll replay and mobile usability.

## Review Focus

- Scroll progress remains continuous and reversible through the sticky Impact range; test both scroll directions.
- Sticky stage releases before the next section; test section boundaries and anchor navigation.
- Aether keeps its existing Lenis behavior while `/` allows native wheel input; test both entry points.
- Reduced motion skips/settles formation without hiding scene content; test the preference path.
- Mobile stays scrollable and overflow-free with readable sun text/tagline/cards; test compact viewport geometry.

---

### Task 1: Replace gesture-driven section navigation with native document flow

**Files:** `src/app/App.tsx`, `src/app/App.css`, `src/hooks/use-section-navigation.ts`, `src/hooks/use-section-navigation.test.tsx`, `src/sections/PortfolioSections/PortfolioSections.tsx`, `src/components/layout/Navbar/Navbar.tsx`, `src/components/layout/Navbar/Navbar.test.tsx`, `src/app/LenisProvider.tsx`.

- [x] Test that navigation uses section anchors/observation without preventing wheel, touch, or keyboard browser defaults.
- [x] Render existing sections in document flow and remove the one-screen keyed replacement/overflow lock that prevents native scrolling.
- [x] Replace gesture handlers and custom wheel progress with active-section observation and `useScroll`-compatible Impact progress.
- [x] Preserve hash links, CV modal action, browser history, and Aether's existing Lenis smoothing; disable Lenis wheel smoothing only for the portfolio entry.
- [x] Run navigation, App, and Navbar tests.

### Task 2: Convert Impact into a sticky scroll-linked formation section

**Files:** `src/sections/EngineeringImpact/EngineeringImpact.tsx`, `src/sections/PortfolioSections/PortfolioSections.tsx`, `src/components/DeveloperUniverse/useUniverseProgress.ts`, `src/components/DeveloperUniverse/developerUniverse.constants.ts`, `src/components/DeveloperUniverse/formationTimeline.test.ts`, `src/components/DeveloperUniverse/developerUniverse.css`.

- [x] Add tests for progress endpoints, reversal, and responsive section scroll distance.
- [x] Give Impact a responsive natural-scroll range beginning near 360svh desktop, with a viewport-height sticky inner stage and a shorter mobile range.
- [x] Derive progress from Motion `useScroll({ target: impactRef, offset: ['start start', 'end end'] })`; reuse the current spring and formation mapping.
- [x] Preserve reduced-motion completion behavior, interaction activation, planet sequencing, and natural sticky release.
- [x] Run universe and Impact tests.

### Task 3: Remove the duplicate image bridge and position the universe tagline

**Files:** `src/components/DeveloperUniverse/DeveloperUniverse.tsx`, `src/components/DeveloperUniverse/developerUniverse.css`, `src/components/DeveloperUniverse/formationTimeline.ts`, `src/components/DeveloperUniverse/formationTimeline.test.ts`.

- [x] Assert the scene no longer renders `.developer-universe__hero-bridge` and the Hero still owns its background image.
- [x] Remove bridge-specific image URL, opacity, scale, and CSS while retaining the deep-space background layers.
- [x] Place the scroll tagline relative to the universe container, reveal it in the early formation phase, and fade it before the sun text/planet layer crowds the scene.
- [x] Verify responsive placement and reduced-motion visibility.

### Task 4: Refine central typography and metric entrances

**Files:** `index.html`, `src/components/DeveloperUniverse/DeveloperUniverse.tsx`, `src/components/DeveloperUniverse/developerUniverse.css`, `src/sections/EngineeringImpact/EngineeringImpact.tsx`, `src/components/DeveloperUniverse/UniverseControls.tsx`, relevant component tests.

- [x] Add the Orbitron 600 font face using the existing Google Fonts preconnect/link approach and a fallback stack.
- [x] Test that only the central two-line sun label uses the new family and scales without overflow.
- [x] Add per-card directional initial offsets (bottom-left, bottom, bottom-right, opposite diagonal) with restrained spring transitions and stagger, preserving existing metric data.
- [x] Test reduced-motion final state, four cards, and unchanged values.
- [x] Verify planetary pointer/tap controls do not capture vertical page scrolling.

### Task 5: Final verification and responsive review

**Files:** Relevant tests and implementation files above.

- [x] Run `npm run test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm run build`.
- [x] Browser-check native wheel movement, reverse formation, sticky release, and responsive layouts. Trackpad, physical touch hardware, reduced-motion OS preference, and the standalone Aether entry were not available in the current browser checkout; native scrolling, touch-action, preference handling, and the route-scoped Lenis setting were verified in code/tests.
- [x] Check desktop, tablet, and mobile composition, overflow, console errors, font, and asset requests; record any unverified hardware-specific behavior.

## Verification Notes

- TypeScript and production build pass. Vite reports the existing large main-chunk warning.
- Focused navigation, Impact, timeline, and Navbar tests pass (16/16). The full suite reports 121 passing, four failing tests, and one suite with no tests: stale Splash/Hero assertions, ParticleSphere fallback, and the empty Vengeance test file. `npm run lint` exits 0 with existing warnings. Repository-wide `format:check` remains non-zero due to unrelated pre-existing formatting; all modified files pass a targeted Prettier check.
- Desktop/tablet/mobile browser checks showed no mobile horizontal overflow, all four metrics in the viewport, the canvas surviving reverse scroll, and the sticky scene releasing before Work. The tablet navbar uses the compact menu below 1024px to avoid overlap.
