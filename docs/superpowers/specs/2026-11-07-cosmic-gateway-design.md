# KIRANE Cosmic Gateway Design

## Purpose

Turn the Home-to-Universe transition into one continuous cinematic 3D journey. The existing golden particle sphere becomes the portal, the visitor's camera passes through that portal, and the same camera settles into the existing Developer Universe. The experience must remain reversible, respond to intentional navigation, and preserve the current portfolio identity and Universe interactions.

## Current Architecture and Constraint

The current opening and transition spans several independent systems:

- `SplashScreen` overlays the page with the `StormSplash` particle artwork and DOM brand typography. `StormSplash` creates its own raw Three.js renderer, camera, animation loop, and post-processing composers.
- `CinematicJourney` scrubs a Motion value from 0 to 1. That value dissolves the Hero and drives the Universe formation timeline.
- `ParticleSphere` owns a separate React Three Fiber `Canvas`. Its splash-to-Hero transition accelerates rotation and scales the sphere, then positions it beside the Hero through the app-level sphere-stage transform.
- `UniverseScene` owns another R3F `Canvas`, its own camera, and a runtime that forms the Sun, paths, dust, and planets from the scrubbed progress value.

These renderers cannot share a camera or continuous world-space position. Direct navigation to Universe also completes the Hero progress immediately, bypassing the current scrubbed reveal. The design therefore consolidates the splash artwork, Hero sphere, and Universe render layers under one persistent R3F Canvas and gives the full Splash-to-Universe lifecycle a single shared scene/camera host plus a dedicated Home-to-Universe controller.

## Design Decisions

1. **One renderer and camera:** A persistent R3F scene is mounted once for the Hero, transition, and Universe. Portal, tunnel, Sun, paths, and planets share its camera, clock, and render loop.
2. **Reuse the existing sphere:** Extract the existing sphere particle implementation into a scene component that can render inside the shared Canvas. Keep its particle generation, golden shader palette, surface density, halo, and pointer-reactive behavior. Transform its existing particles and group into the portal and travel effects; do not add a second full sphere system.
3. **One transition controller:** A dedicated `CosmicGatewayController` owns lifecycle state and normalized progress. Input handlers request forward travel or reversal. A single R3F frame loop advances progress and writes it to a MotionValue/ref used by both DOM and scene subscribers. Frame updates do not set React state.
4. **Intent-triggered playback:** A deliberate Home-to-Universe gesture starts a bounded timeline. The timeline runs through the portal and reveal phases without requiring continuous scrolling. Small wheel noise does not start it. Opposite navigation during travel reverses toward Home; repeated same-direction input does not restart it.
5. **Stable Universe endpoint:** The existing Sun, orbit paths, planet data, relative planet positions, and orbital motion remain authoritative. Scene transforms and camera motion carry the visitor to the existing endpoint; the design does not regenerate or randomize the solar system.
6. **Navigation compatibility:** Navbar Universe navigation starts the same forward lifecycle. A direct initial load at `#universe` renders the settled endpoint without replaying the opening sequence. Browser history and Home navigation request the reverse lifecycle. Navigation to later sections during the opening is deferred until the Universe reveal completes; it cannot cause an accidental skip.
7. **Reduced-motion and WebGL fallback:** Reduced-motion users receive a short, non-travel handoff with the same endpoint and navigation semantics. Where WebGL is unavailable or context is lost, a lightweight CSS/canvas fallback preserves the golden-to-cosmos sequence without camera travel and keeps navigation usable.
8. **Splash preservation:** Keep the splash DOM component, outline brand typography, copy, animation timings, layering, and reveal callback behavior. Extract the existing `StormSplash` scene and post-processing so it renders through the shared renderer/camera; preserve its visible particle treatment and splash-to-Hero crossfade with the existing Hero sphere. The splash state remains once per browser session as required by App's existing contract. The current implementation discrepancy—`shouldShowSplash()` always returns `true` and `markSplashShown()` is a no-op—must be corrected and covered by session-storage tests.

## Scene and Component Responsibilities

- **Shared scene host:** Owns the only R3F `Canvas`, responsive renderer configuration, shared camera, and one runtime. It stays mounted across `home` and `universe` so the transition does not remount either scene.
- **Splash scene:** Extracts the current `StormSplash` particle scene from its self-owned renderer and animation loop into scene content rendered by the shared Canvas. Its post-processing output is preserved within the shared renderer. Splash text remains the existing DOM `StrokeFill`/`ScrambleReveal` overlay.
- **`CosmicGatewayController`:** Owns lifecycle state, elapsed timeline progress, direction, completion/cancellation, and reduced-motion timing. Its imperative interface is stable across React renders.
- **Golden sphere / portal component:** Reuses the existing sphere particle generation and shader. It supports Hero idle, portal expansion, passage, and settled/hidden states through uniforms and transforms.
- **Travel particle layer:** Reuses sphere particles where practical and uses a bounded, seeded particle set for directional travel. Geometry and materials are allocated once and disposed with the scene. No post-processing dependency is introduced.
- **Universe scene contents:** Keeps the existing `CentralSun`, orbit paths, planet components, textures, and runtime behavior inside the shared Canvas. It accepts transition visibility/reveal inputs and does not own a second Canvas or camera.
- **DOM Hero and navigation:** Remain DOM layers over the shared scene. Hero layout, video choice/composition, typography, sound preference, Navbar structure, and i18n remain unchanged. Only the Hero-to-Universe dissolve/lighting coordination is modified.

### Shared World Placement

The scene uses the existing camera-facing axis as a continuous path. The portal sphere sits at a stable world-space origin. The Universe is staged farther along the camera's forward travel axis, with its Sun at the Universe group's origin and all planet/orbit coordinates unchanged within that group. The Hero camera starts on the near side of the sphere; it passes through the sphere volume and continues to the Universe endpoint. The endpoint is the current `UniverseControls` camera pose relative to the Universe group. This placement gives the camera a real space between the portal surface and the solar system while preserving all existing local Universe positions.

The Hero sphere's existing screen composition (including its desktop offset and tablet/mobile placement) is reproduced by scene camera framing, not by a second canvas-level transform. The existing splash-to-Hero sphere entrance remains a prelude rendered by the same Canvas. During the existing splash exit, retain the visual crossfade between the StormSplash particle treatment and the Hero particle sphere. The KIRANE outline wordmark, tagline, text timings, splash fade, layout, and splash reveal contract remain unchanged. The new gateway lifecycle begins only when the visitor intentionally leaves Home.

## Lifecycle and Choreography

Lifecycle states are `IDLE`, `INITIATING`, `PORTAL_EXPANDING`, `TRAVELLING`, `UNIVERSE_REVEAL`, and `COMPLETED`. The state is derived from normalized timeline progress; a phase boundary cannot create a second clock. Forward and reverse playback use the same progress domain, so reverse navigation retraces the scene safely.

The standard-motion forward sequence targets approximately 7.25 seconds total, within the brief's 6.5–8.5 second combined range:

| Phase | Target duration | Visual and scene behavior |
| --- | ---: | --- |
| Initiating | 1.25 s | Darken the workspace gradually; preserve the Hero composition; increase existing sphere rotation; add restrained golden pulses and particle escape; begin surrounding orbital energy. |
| Portal expansion | 1.75 s | Expand the same sphere into a layered portal; increase particle-ring motion and subtle shader-based gravitational distortion; keep effects in the existing gold palette. |
| Dimensional travel | 2.5 s | Move the shared camera through the portal along a smooth, bounded path; send seeded particles past the camera to imply depth; transition lighting from warm gold to deep space without flashes or camera shake. |
| Universe reveal | 1.75 s | Reveal the existing Sun, paths, and planets in their existing positions; blend to the existing Universe camera endpoint and restore normal orbital motion. |

The animation clock uses the R3F frame loop while the shared scene is active. Progress can be sampled and written as a MotionValue without per-frame React renders. The camera endpoint is the current Universe framing from `UniverseControls`, including responsive FOV, elevation, insets, and aspect-ratio fit. The camera curve must end with matching position and orientation to avoid a settling jump.

## Input, Navigation, and Interruption Rules

- On Home, aggregate vertical wheel input until the existing intentional-gesture threshold is crossed; then start forward travel once. Ignore tiny incidental deltas and horizontal gestures.
- Touch requires a deliberate vertical movement using the current minimum-distance and direction checks. Keyboard and Navbar activation use the same controller entry points.
- While forward playback is active, duplicate forward requests are ignored. An intentional reverse request moves the same timeline back toward Home rather than starting a competing animation.
- On completion, update navigation state and release the transition input lock. Normal Universe-to-next-section navigation then resumes.
- A request for a later section during the opening is queued and handled after the Universe endpoint is reached.
- Browser Back, Navbar Home, and deliberate upward navigation from the Universe endpoint reverse the same progress. Direct entry to a non-Home hash stays immediate and does not play a cinematic on initial load.
- Resize recomputes camera endpoints and portal screen framing from the current viewport without resetting normalized progress. Context loss cancels GPU animation safely and presents the fallback endpoint.

## Visual Preservation

The following remain unchanged in content and design: SplashScreen artwork and DOM typography, splash animation/timing and session-based visibility, Home layout and developer-workspace background, Hero video composition and sound toggle, golden sphere identity, Navbar, theme behavior, i18n, Universe Sun appearance, orbital path geometry and planet positions, technology data, hover cards, and later portfolio sections. The transition may adjust scene lighting, sphere transforms, and DOM dissolve timing only while the gateway is active.

No new audio is added. Existing Hero audio remains opt-in and follows the current mute preference. No new runtime dependency, generic loading overlay, full-screen flash, unrelated lens flare, or post-processing stack is introduced.

## Splash Screen Preservation

The existing splash remains visually and functionally unchanged while moving its particle rendering into the shared scene host. Preserve the `StormSplash` golden particle artwork, its particle appearance and pointer response, the `KIRANE | OMKAR` stroke-outline wordmark, translated tagline, current fade/draw/reveal timing, fonts-ready gating, app-shell inert/readiness sequence, and the crossfade into the Hero particle sphere. Keep the splash text and layout as DOM content above the shared Canvas; move only the Three.js scene/rendering ownership.

Preserve the existing timing values: `SPLASH_EXIT_DURATION_MS` is 1900 ms; the text exit is 0.48 seconds; the brand draw is 4 seconds; the tagline starts 360 ms after the brand completes and runs for 2300 ms. Reduced-motion timing remains immediate as it is today.

Splash visibility is specified as once per browser session. The current source contradicts the App comment and this requirement: `shouldShowSplash()` always returns true and `markSplashShown()` does nothing. The migration must make the existing session contract real (shown on first visit in a session, dismissed for the remainder of that session) without changing the appearance or animation for a session in which it appears.

## Performance and Accessibility

- Keep one WebGL context and one R3F frame loop; reuse sphere, orbit, and travel geometry/materials.
- Use shader uniforms and object transforms for frame-level animation; do not update React state each frame.
- Cap device pixel ratio and particle counts using the existing layout tiers. Mobile simplifies tunnel density and distortion while retaining the same phase order and endpoint.
- Keep camera acceleration smooth and bounded. Avoid strong motion blur, camera shake, and high-frequency flashes.
- Under `prefers-reduced-motion`, skip spatial travel and prolonged particle acceleration, then reveal the same Universe endpoint quickly. Keyboard, touch, history, and Navbar navigation remain available.
- Dispose of owned GPU resources on final scene teardown and respond to WebGL context loss without leaving navigation locked.
- Keep one WebGL context for the StormSplash scene, Hero particle sphere, and Universe. Preserve the StormSplash post-processing appearance through the shared renderer without creating another renderer or animation loop.

## Validation and Acceptance

Automated coverage will verify the lifecycle transitions, no duplicate starts, reversal from every active phase, queued later-section navigation, direct-hash endpoint behavior, resize continuity, reduced-motion completion, context-loss fallback, and existing navigation callbacks. Session-storage tests will verify that the splash appears on a fresh session and remains dismissed after it is marked shown for the current session. Scene-level tests will inspect that one shared Canvas/camera is used, the Splash, portal, and Universe render content receive the same camera, the portal and Universe receive the same progress, the camera endpoint matches the existing Universe framing, and planet identities/relative positions remain unchanged.

Browser verification will cover the splash artwork, outline branding, timings, and splash-to-Hero crossfade; session-based splash visibility; desktop, tablet, and mobile viewports; forward Home-to-Universe playback; reversal during travel; browser Back and Navbar navigation; hover cards after reveal; reduced-motion mode; and the WebGL fallback. `npm run build` must pass. The interaction/card tests for the previous hover issue remain part of the regression check.

Acceptance is met when the existing sphere visibly becomes the portal, one camera crosses it and settles into the existing Universe, reverse navigation completes safely, no section can be accidentally skipped during reveal, and existing Home, Universe, interaction, responsive, theme, and reduced-motion behavior remains intact.

## Out of Scope

This design does not redesign the SplashScreen or Hero, replace or reposition Universe planets, change the Universe content or card design, add audio assets, change later-section transitions, add third-party animation dependencies, or retune the existing solar-system orbits.
