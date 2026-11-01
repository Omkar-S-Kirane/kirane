# Developer Universe Natural Scroll Design

## Goal

Make the Hero-to-Impact journey a native-scroll, scroll-linked experience while preserving the current Hero, golden sphere, planet system, and four Impact metrics.

## Current behavior and cause

`App` renders one full-screen section at a time inside an overflow-hidden stage. `useSectionNavigation` prevents wheel defaults, interprets wheel/touch/key gestures, switches sections, and converts wheel deltas into Impact formation progress. The Developer Universe also renders the Hero workspace image again as `.developer-universe__hero-bridge`, fading it over the beginning of the scene. This duplicates the actual Hero image and creates the unwanted intermediate visual.

## Design

- Restore normal document scrolling for the portfolio and retain all existing sections in document flow.
- Replace gesture interception with scroll-position observation for the active section and section progress; use browser anchors for navigation.
- Make Impact a long section with a viewport-height sticky universe stage. Drive formation from Motion `useScroll` progress over a responsive scroll distance, preserving reverse playback and existing scene phases.
- Remove the duplicate `.hero-bridge` image and its opacity/scale mapping. Keep the image asset and its use in Hero.
- Keep the tagline within the universe container, animate it from formation progress, and fade it as the sun and planets form.
- Load Orbitron 600 through the existing Google Fonts link strategy and use it only for the central sun text.
- Animate the four existing metric cards independently with small directional offsets, restrained spring settling, stagger, and reduced-motion behavior. Keep metric data unchanged and preserve the established responsive card layout.
- Keep Lenis from intercepting native wheel input on the main portfolio route. Preserve its existing Aether behavior.

## Constraints

- No new dependencies; no GSAP or ScrollTrigger.
- No wheel, touch, or keyboard scroll interception for section navigation.
- Respect reduced motion, keyboard navigation, native reverse scroll, and mobile touch.
- Do not redesign the Hero, sphere, planets, or metric content.

## Verification

Unit tests cover section observation/anchor navigation, section-progress mapping, bridge removal, tagline placement, card entrance variants, and existing metrics. Then run the full test suite, typecheck, lint, formatting check, and production build. In browser, verify wheel/trackpad/touch and reverse scroll, sticky release, desktop/tablet/mobile layouts, assets/font, reduced motion, no overflow, and no console errors.
