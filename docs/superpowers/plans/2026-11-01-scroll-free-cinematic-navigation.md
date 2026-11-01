# Scroll-Free Cinematic Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace post-Hero document scrolling with a full-screen cinematic stage journey while preserving all current content and one persistent Universe scene.

**Architecture:** A centralized `useCinematicNavigation` controller owns the ordered stage, Hero handoff, wheel/touch/keyboard input, URL hash, history, and transition lock. A fixed stage host renders the current foreground panel with Motion transitions while `PersistentUniverseBackground` remains mounted behind it; content-heavy stages use responsive selection controls instead of scroll panels.

**Tech Stack:** React 19, TypeScript, Motion, React Three Fiber/Three.js, Vitest, React Testing Library, Vite.

**Spec:** `docs/superpowers/specs/2026-11-01-scroll-free-cinematic-navigation-design.md`

## Global Constraints

- Preserve the existing Hero video, dissolve, sun formation, audio controls, and reverse transition.
- After entering Universe, the document and viewport do not scroll; do not add nested scrollable content panels.
- Preserve every existing localized metric, project detail, role, bullet, skill, link, modal, and action.
- Keep one persistent Developer Universe scene and one active foreground stage.
- Enable planet interaction only in Universe; keep foreground interactions usable in all stages.
- Use existing Motion infrastructure; add no animation dependency.
- Respect reduced motion, safe areas, dynamic viewport sizing, keyboard access, and browser history.
- Do not commit, push, or claim physical-device testing without explicit approval or access.

## Review Focus

- **Wheel/trackpad event bursts:** one intentional gesture changes at most one stage; test a burst, quiet-period re-arm, and a burst during transition in Task 1.
- **Hero/Universe boundary:** forward completion and reverse navigation never release the document into vertical scrolling; test both directions and stage handoff in Task 2.
- **Touch vs. planet drag:** vertical swipes navigate while horizontal planet drags rotate; controls and links retain their native actions; test in Task 4.
- **Direct hashes/history:** valid deep links, Back, and Forward keep the stage, URL, and active navbar item synchronized; test in Task 4.
- **Complete content at narrow sizes/locales:** all role bullets and localized stage content remain present and visible at 320×720; test selectors and browser layout in Tasks 3 and 5.

---

### Task 1: Add the centralized stage navigation controller

**Files:**

- Create: `src/hooks/use-cinematic-navigation.ts`
- Test: `src/hooks/use-cinematic-navigation.test.tsx`
- Modify: `src/hooks/use-section-navigation.ts`, `src/hooks/use-section-navigation.test.tsx` (remove scroll-based ownership and migrate route tests)
- Modify: `src/constants/navbar-constants.ts`, `src/constants/navbar-constants.test.ts` only if stage IDs need a shared source

**Interfaces:**

- Produces `CINEMATIC_STAGE_IDS` in the exact order `home, universe, impact, work, experience, skills, resume, contact` and `CinematicStageId`.
- Produces `useCinematicNavigation(journeyRef)` returning `activeStage`, `isTransitioning`, `navigateTo(stage: CinematicStageId)`, `onUniverseEnteredChange(entered: boolean)`, `onHeroTransitionComplete()`, `onHeroTransitionReset()`, `handleWheel(event: WheelEvent)`, `handleTouchStart(event: TouchEvent)`, `handleTouchMove(event: TouchEvent)`, `handleTouchEnd(event: TouchEvent)`, and `handleKeyDown(event: KeyboardEvent)`.
- Consumes a Journey ref with `adjustProgress(delta: number)`, `completeForNavigation()`, and `reset()` so the controller owns input while the Journey owns the visual Motion timeline.

- [x] **Step 1: Write failing controller tests** for initial hash resolution, one-step forward/reverse ordering, direct stage navigation, input lock during a transition, and malformed hashes.
- [x] **Step 2: Run the focused controller tests and confirm they fail** because the controller and stage transition behavior do not exist.
- [x] **Step 3: Implement the ordered stage model and controller** in `use-cinematic-navigation.ts`; keep stage IDs and transitions centralized rather than in section-specific listeners.
- [x] **Step 4: Write failing wheel burst tests** for normalized deltas, one transition per gesture, and re-arming after the quiet interval.
- [x] **Step 5: Run the wheel tests and confirm the burst currently permits repeated stage changes.**
- [x] **Step 6: Add the gesture accumulator and transition guard** to the controller; a navbar selection may directly replace the current target without queuing intermediate stages.
- [x] **Step 7: Run the focused controller tests** and verify all state, ordering, and burst cases pass.

### Task 2: Hand Hero input and viewport ownership to the controller

**Files:**

- Modify: `src/sections/CinematicJourney/CinematicJourney.tsx`
- Modify: `src/sections/CinematicJourney/CinematicJourney.css`
- Modify: `src/app/App.tsx`, `src/app/App.css`, `src/app/App.test.tsx`
- Test: `src/sections/CinematicJourney/CinematicJourney.test.tsx` (create if absent)

**Interfaces:**

- `CinematicJourney` continues to own the Hero’s visual Motion timeline and particle dissolve, but exposes imperative progress operations through its existing ref for the centralized controller.
- Extend `CinematicJourneyHandle` with `adjustProgress(delta: number): void`; signal completed entry and completed reset through explicit callbacks so stage changes occur after the visual handoff.
- Add `onHeroTransitionComplete(): void` and `onHeroTransitionReset(): void` callbacks; the navigation hook changes between `home` and `universe` only after those endpoints settle.
- `App` consumes `useCinematicNavigation`, passes Journey completion callbacks, and attaches all fixed-stage input handlers to the application viewport.

- [x] **Step 1: Add failing Hero handoff tests** for forward completion entering Universe, reverse returning to Hero, and unchanged Hero transition progress behavior.
- [x] **Step 2: Run the focused tests and confirm they fail** on the current independent scroll-lock/input ownership.
- [x] **Step 3: Move wheel, touch, and stage keyboard ownership into the central controller** while preserving the Journey’s visual timeline, audio fade, and particle bridge.
- [x] **Step 4: Keep the document fixed once Universe entry begins** and hand Hero completion to the Universe stage without releasing the browser into a vertical scroll.
- [x] **Step 5: Add assertions that `scrollY` remains unchanged** through Hero completion and reverse navigation.
- [x] **Step 6: Run Journey and App tests** and verify Home reset, Universe entry, and viewport lock behavior.

### Task 3: Refactor foreground content into complete stage panels

**Files:**

- Create: `src/sections/PortfolioSections/PortfolioStageContent.tsx`
- Create: `src/sections/PortfolioSections/ExperienceStage.tsx`
- Modify: `src/sections/PortfolioSections/PortfolioSections.tsx`, `src/sections/PortfolioSections/PortfolioSections.test.tsx`
- Modify: `src/sections/EngineeringImpact/EngineeringImpact.tsx`, `src/sections/EngineeringImpact/EngineeringImpact.test.tsx`
- Modify: `src/sections/Universe/UniverseSection.tsx`

**Interfaces:**

- `PortfolioStageContent({ stage, onOpenResume })` renders one of `work | experience | skills | resume | contact` and preserves the current localized data and actions.
- `ExperienceStage` renders a selector for all five `resume.experience` entries and the complete selected role, including every bullet.
- `EngineeringImpact` and `UniverseSection` become full-screen panel content without depending on document viewport-entry scrolling.

- [x] **Step 1: Add failing content tests** asserting exact stage order, all four Impact metrics, all five roles, and every current role bullet is reachable by selecting that role.
- [x] **Step 2: Run the focused content tests and confirm the stage API is missing** and content assertions fail.
- [x] **Step 3: Split the current section markup into independently renderable stage panels** while keeping translation keys, resume data, external links, metric values, and CV modal action unchanged.
- [x] **Step 4: Implement the accessible role selector** with a complete, non-scrollable detail view for the selected role.
- [x] **Step 5: Remove `whileInView` assumptions from panels** and use stage-entry animation controls so hidden panels do not reveal themselves before activation.
- [x] **Step 6: Run content, locale, and section tests**; verify no item was dropped and each role can be reached.

### Task 4: Build the fixed stage host and connect navigation surfaces

**Files:**

- Create: `src/components/navigation/CinematicStageHost.tsx`
- Create: `src/components/navigation/CinematicStageHost.test.tsx`
- Modify: `src/components/layout/Navbar/Navbar.tsx`, `src/components/layout/Navbar/Navbar.test.tsx`
- Modify: `src/components/DeveloperUniverse/PersistentUniverseBackground.tsx`, `src/components/DeveloperUniverse/PersistentUniverseBackground.test.tsx`
- Modify: `src/app/App.tsx`, `src/app/App.css`

**Interfaces:**

- `CinematicStageHost({ activeStage, onTransitionComplete, onOpenResume })` renders one active, accessible foreground stage and animates only opacity/transform.
- Navbar items call `navigateTo(stage)` instead of `scrollIntoView`; Resume and Contact remain functional.
- The persistent background receives the active stage and enables planet interaction only for Universe.

- [x] **Step 1: Add failing host tests** for one active panel, inactive panels being inert/hidden, reduced-motion instant changes, and direct destination selection.
- [x] **Step 2: Run the host tests and confirm current stacked section rendering fails** the fixed-stage assertions.
- [x] **Step 3: Implement the fixed viewport host** using the ordered stage and a single Motion transition lifecycle; do not unmount or duplicate the Universe scene.
- [x] **Step 4: Route desktop and mobile navbar actions through `navigateTo`** and remove all section `scrollIntoView` behavior from the portfolio navigation flow.
- [x] **Step 5: Synchronize initial hash, completed stage hash, Back, and Forward** without adding history entries during popstate.
- [x] **Step 6: Add and run tests** for navbar destination, active state, hash, browser-history navigation, modal, and disabled background input outside Universe.

### Task 5: Add responsive no-scroll stage layouts and complete-content verification

**Files:**

- Modify: `src/app/App.css`
- Modify: `src/components/navigation/CinematicStageHost.tsx` (or its stylesheet if extracted)
- Modify: `src/sections/EngineeringImpact/EngineeringImpact.css`
- Modify: `src/sections/PortfolioSections/PortfolioSections.css` (create if needed)
- Modify: `src/components/DeveloperUniverse/developerUniverse.css` only for stage-specific scene/inset coordination

- [x] **Step 1: Add failing layout assertions** for fixed `scrollY`, no document overflow, no nested scroll containers, and all stage controls/content visible at 320×720.
- [x] **Step 2: Run the layout checks and identify overflow/clipping** before adapting the stage panels.
- [x] **Step 3: Fit each panel with responsive grid/stack layouts, dynamic viewport units, and safe-area padding**; do not truncate text or shrink typography excessively.
- [x] **Step 4: Keep all stage panels keyboard and screen-reader accessible**; ensure focus indicators and role selector targets remain usable.
- [x] **Step 5: Verify no horizontal/vertical overflow, no clipped content, no nested scrolling, and no visible document movement** at all 15 specified viewport sizes; include portrait/landscape checks where practical.

### Task 6: Verify the complete journey, gestures, persistence, and production output

**Files:**

- Modify: focused tests from Tasks 1–5 as failures are discovered
- No physical-device-only claim without access to physical hardware

- [x] **Step 1: Exercise the complete journey** Hero → Universe → Impact → Work → Experience → Skills → Resume → Contact, then reverse back to Hero.
- [x] **Step 2: Verify gestures**: mouse wheel, high-frequency trackpad-style bursts, reverse direction, mobile touch swipes, and horizontal Universe planet drag.
- [x] **Step 3: Verify keyboard and navigation**: Arrow keys, Page keys, Home/End, direct navbar jumps, unknown/direct hashes, Back/Forward, focus management, and controls that must not trigger stage changes.
- [x] **Step 4: Verify scene lifecycle and accessibility**: exactly one mounted scene/Canvas, no background flash, planet input only in Universe, reduced-motion stage changes, inactive-stage inertness, and active-stage announcement.
- [x] **Step 5: Browser-emulate all required sizes**: 1920×1080, 1680×1050, 1440×900, 1366×768, 1280×800, 1024×768, 1024×1366, 834×1194, 768×1024, 430×932, 414×896, 390×844, 375×812, 360×800, and 320×720; include landscape rotations where practical.
- [x] **Step 6: Run the full Vitest suite, TypeScript build, Oxlint, Prettier check, and production build**; separate pre-existing failures/warnings from regressions.
- [x] **Step 7: Report each acceptance check as PASSED, FAILED, or NOT TESTED**, and distinguish browser emulation from physical-device testing.
