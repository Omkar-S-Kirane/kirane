# Persistent Developer Universe Implementation Plan

> **Execution:** Implement inline in the current workspace. Do not commit without user approval.

**Goal:** Keep one interactive Developer Universe scene running behind all portfolio sections after the cinematic Hero transition.

**Architecture:** `App` owns a shared MotionValue and one persistent scene host; `CinematicJourney` keeps its scoped transition input and mirrors progress. Normal foreground sections become the requested ordered document flow, while a section-aware shade and interaction flag tune the scene without remounting it.

**Tech Stack:** React 19, TypeScript, Motion, React Three Fiber/Three.js, Vitest, React Testing Library, Vite.

**Spec:** `docs/superpowers/specs/2026-11-01-persistent-developer-universe-design.md`

## Global Constraints

- Preserve the current Hero, cinematic dissolve, sun, planets, orbit state, information cards, and existing localized content.
- Keep one persistent scene and one Canvas after Universe entry; no duplicate renderer or new animation dependency.
- Preserve scoped Hero transition input and normal document scrolling after it completes.
- Enable planet interaction only in Universe; foreground content owns pointer and touch behavior everywhere else.
- Respect reduced motion, visibility pause, responsive layout, safe areas, and existing low-power quality budgets.
- Do not commit, push, or test physical hardware without explicit user authorization or access.

## Review Focus

- Returning to Home must hide the scene and reset the transition without leaving it interactive.
- Direct non-Home hashes must start with a formed scene and a matching active navigation item.
- A hidden tab must stop the R3F loop and resume it without resetting orbital state.
- The no-WebGL fallback must retain its visuals while disabling planet controls outside Universe.
- Compact portrait layouts must keep planets on-screen and retain vertical scrolling and safe-area spacing.

---

### Task 1: Add the section destinations and navigation contract

**Files:** `src/constants/navbar-constants.ts`, `src/constants/navbar-constants.test.ts`, `src/hooks/use-section-navigation.ts`, `src/hooks/use-section-navigation.test.tsx`, `src/i18n/types.ts`, all `src/i18n/locales/*.ts`, `src/components/layout/Navbar/Navbar.tsx`, `src/components/layout/Navbar/Navbar.test.tsx`.

- [x] Test that navigation order is Universe, Impact, Work, Experience, Skills, Resume and that each item resolves to a real section anchor.
- [x] Test direct hashes and active-state routing for `universe` and `resume`.
- [x] Add localized Universe navigation labels and make Resume a section link while retaining the existing Contact action.
- [x] Run focused navigation and locale type checks.

### Task 2: Separate the Universe background and preserve transition progress

**Files:** `src/app/App.tsx`, `src/app/App.css`, `src/sections/CinematicJourney/CinematicJourney.tsx`, `src/sections/CinematicJourney/CinematicJourney.css`, `src/components/DeveloperUniverse/PersistentUniverseBackground.tsx`, `src/components/DeveloperUniverse/PersistentUniverseBackground.test.tsx`.

- [x] Test the ordered section topology and a single persistent scene host.
- [x] Add an app-owned formation MotionValue and mirror the Journey progress into it without per-frame React state.
- [x] Mount one fixed background host, reveal it on first transition entry, keep it mounted through all later sections, and hide/reset it when returning Home.
- [x] Remove Impact from the cinematic Journey; preserve its scoped wheel/touch/key behavior and Hero particle bridge.
- [x] Run App and transition tests.

### Task 3: Make Universe and Impact distinct foreground destinations

**Files:** `src/sections/Universe/UniverseSection.tsx`, `src/sections/Universe/index.ts`, `src/sections/EngineeringImpact/EngineeringImpact.tsx`, `src/sections/EngineeringImpact/EngineeringImpact.css`, `src/sections/EngineeringImpact/EngineeringImpact.test.tsx`, `src/sections/PortfolioSections/PortfolioSections.tsx`, `src/sections/PortfolioSections/PortfolioSections.test.tsx`.

- [x] Test section order, Impact independence from the scene component, and the existing four metric values/labels.
- [x] Add the full-viewport Universe anchor and convert Impact to editorial metrics: four columns on desktop and two-by-two on mobile, with restrained stagger and reduced-motion handling.
- [x] Preserve metric source calculations and all existing metric copy.
- [x] Add a section-aware shade between the fixed background and foreground content.
- [x] Run focused section tests.

### Task 4: Add Resume destination and keep foreground actions usable

**Files:** `src/sections/PortfolioSections/PortfolioSections.tsx`, `src/sections/PortfolioSections/PortfolioSections.test.tsx`, `src/app/App.tsx`, `src/components/layout/Navbar/Navbar.tsx`, relevant locale/navigation tests.

- [x] Test that Resume is a real section target and its action opens the existing CV modal.
- [x] Source the visible summary from the current locale's resume data; reuse existing localized labels and modal behavior.
- [x] Add consistent, reduced-motion-safe Motion reveals for section headings and foreground content without delaying reading.
- [x] Verify mobile navigation destinations, focus targets, and no foreground pointer interception.

### Task 5: Gate scene interaction and pause hidden-tab rendering

**Files:** `src/components/DeveloperUniverse/DeveloperUniverse.tsx`, `src/components/DeveloperUniverse/UniverseFallback.tsx`, `src/components/DeveloperUniverse/UniverseScene.tsx`, `src/components/DeveloperUniverse/UniverseControls.tsx`, `src/hooks/use-document-visibility.ts`, `src/hooks/use-document-visibility.test.ts`, relevant Universe tests.

- [x] Test that controls/cards/listeners are inactive outside Universe and resume when Universe becomes active.
- [x] Test document visibility updates and renderer pause/resume without unmounting the scene.
- [x] Keep `active` (render loop) separate from `interactive` (input) and gate the WebGL and fallback paths consistently.
- [x] Run focused Universe lifecycle and interaction tests.

### Task 6: Responsive, accessibility, and production verification

**Files:** All implementation files above and relevant tests.

- [x] Browser-emulate every listed desktop, tablet, and mobile viewport; inspect overflow, clipping, navigation, scene fit, contrast, and content hierarchy.
- [x] Exercise Universe planet selection, foreground navigation/actions, return-to-Home, reverse transition, and normal scroll after transition.
- [x] Check reduced-motion behavior, hidden-tab rendering, console errors, and failed requests.
- [x] Run full Vitest, TypeScript, Oxlint, Prettier checks, and production build; record baseline and remaining failures honestly.
- [x] Record physical-device testing as NOT TESTED if no devices are available.

## Verification Results

- Browser: all 17 requested viewport sizes passed after transitions settled; the dynamic viewport canvas bound prevents the tablet Hero particle layer from widening the emulated layout. One Developer Universe host and one Universe Canvas remained mounted at each tested size.
- Interaction: WebGL orbit movement, drag rotation, keyboard selection and information card, mobile navigation, section scroll, scene persistence, reduced-motion presentation, and a simulated `visibilitychange` pause/resume passed. Touch controls measured at least 44px.
- TypeScript and production build passed. Build reports a 1.58 MB minified entry-chunk advisory; the lazy Universe scene is a separate ~38 KB chunk.
- Focused implementation tests passed: 29 tests across 8 files.
- Full Vitest reports 141 passing tests and 3 pre-existing failures: the App splash `data-exiting` expectation, the ParticleSphere dark-theme selector expectation, and the empty Vengeance test suite.
- Oxlint exits successfully with existing warnings; changed-file Prettier check passes. Repository-wide formatting still flags unrelated existing files.
- Browser console exceptions: none. The local dev server returns 404 for `/favicon.ico`.
- Physical iPhone, Android, and tablet testing: NOT TESTED; viewport emulation only.
