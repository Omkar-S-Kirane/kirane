# Developer Universe Cinematic Lock Design

## Goal

Replace the previous natural-scroll transition with a reversible, full-screen Hero-to-Universe transformation. Gestures drive the scene while the viewport remains stationary. Normal page scrolling resumes after the transformation reaches its completed state.

## User-visible behavior

- The initial Hero remains visually unchanged at progress 0.
- Vertical wheel, trackpad, and touch gestures over the journey advance or reverse one shared progress value; progress never moves the document while the transformation is active.
- The golden light and existing sun travel from the right toward the center. As they arrive, the Hero is clipped away from right to left along an irregular, noise-shaped boundary.
- A lightweight Canvas2D particle layer emits golden particles from that moving boundary, bends their paths toward the sun, and fades them into the existing starfield.
- The existing sun typography, sequential planets, orbits, interactions, information cards, and four Impact metrics use the same progress value.
- At completion, the journey releases the document. Work, Experience, Skills, and Contact remain in their normal page flow and are reachable through the navbar and browser scrolling.
- Scrolling upward while the completed journey is at the top reverses the scene. Away from the journey, all wheel and touch input remains native.

## Input and navigation

- A controller attaches a non-passive wheel listener and touch listeners to the journey root only. It consumes input only when the journey is at the top and the gesture points into the available progress range.
- Wheel line/page modes are normalized; each event has a bounded progress step. A spring smooths accumulated input without starting a timer-driven sequence.
- The focused journey region supports Arrow Up/Down, Page Up/Down, Space, Shift+Space, Home, and End. Interactive descendants keep their normal key behavior.
- The document lock class exists only while visual progress is below completion. Navigating to another section completes and releases the journey before the normal anchor scroll. Home resets to the Hero; Impact opens the completed universe.
- A direct non-Home hash begins with the universe complete and the document unlocked. Reduced-motion users see the original Hero first; their first advance/reverse gesture snaps to the corresponding endpoint without animated motion.

## Architecture

- `CinematicJourney` owns the target and spring-smoothed progress, the scoped gesture listeners, the temporary document lock, and the full-screen composition.
- `Hero` receives a dissolve progress MotionValue and applies a deterministic, noise-shaped polygon clip. The clip remains full at the start and removes the Hero completely at the end; this is not a whole-layer opacity fade.
- `HeroParticleBridge` draws deterministic, progress-derived trails on a transparent 2D canvas. It redraws on progress changes and resize; no independent animation clock or new dependency is introduced.
- `EngineeringImpact` becomes a full-screen layer inside the journey and accepts the shared progress. Its metrics retain their data and current directional entrances.
- Later portfolio sections remain regular document sections. Existing navigation calls a small journey handle before scrolling to a destination.

## Accessibility and performance

- Reduced motion keeps the initial Hero visible and turns progress changes into instant endpoint changes. It does not set a document lock.
- Gesture input is localized to the journey and bounded per event; no global wheel or touch listener is added.
- Vertical touch swipes control progress only while the journey is locked. Horizontal planet dragging and taps retain their existing behavior.
- The particle canvas is capped by device pixel ratio and particle count, is pointer-transparent, and has no requestAnimationFrame loop.
- No new dependency is required.

## Verification

- Unit tests cover progress clamping, wheel normalization and bounds, direction-sensitive boundary capture, reversible progress, and the Hero dissolve boundary at start/middle/end.
- Component tests cover temporary document locking, keyboard controls, navigation release, full-screen composition, and preserved Impact metrics.
- Browser checks cover wheel, reverse scroll, touch-sized viewport, sticky/lock boundaries, navbar navigation, reduced motion, Hero dissolution, right-to-center sun travel, metrics, overflow, and console errors.
