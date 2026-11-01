# Scroll-Free Cinematic Navigation Design

## Goal

After the existing Hero-to-Universe transition completes, navigate through Universe, Impact, Work, Experience, Skills, Resume, and Contact as full-screen cinematic stages without moving the document or using nested scroll panels. Preserve all current portfolio content and keep the single Developer Universe scene mounted behind the active stage.

## Current State

- `CinematicJourney` owns the Hero dissolve and temporarily captures wheel, touch, and keyboard input while the dissolve is in progress.
- When the Hero transition completes, the document unlocks and the remaining destinations become vertically stacked sections.
- `useSectionNavigation` uses `IntersectionObserver`, `scrollIntoView`, and hash updates to select destinations.
- `Navbar` delegates section links to that scroll-based navigation.
- `PersistentUniverseBackground` keeps one scene mounted and uses the active section to set background treatment and planet interaction.
- `EngineeringImpact` and `PortfolioSections` currently rely on viewport entry for reveal animations; `PortfolioSections` groups five destinations in one component.

## Selected Architecture

Use a fixed viewport stage controller for the complete journey. A single ordered stage state owns the destination, URL hash, input lock, and active navigation state. Keep the current Hero visual transition and its Motion progress behavior, but route navigation input through the centralized controller instead of allowing browser document scrolling between stages.

The stage order is:

`home → universe → impact → work → experience → skills → resume → contact`

The Hero remains the initial stage. Its existing visual dissolve forms Universe. On completion, the controller enters the Universe stage and retains the fixed viewport. Reverse navigation from Universe returns through the existing Hero transition. Later stages replace one another in the same viewport using opacity and small transform transitions. The fixed Developer Universe remains mounted in the background; its section-aware shade follows the active stage, and planet interaction is enabled only for Universe.

Do not use CSS scroll snapping or a second page overlay over a separately scrolling document. Both retain competing sources of truth or visible document movement.

## Stage Content and Preservation

- Reuse current localized copy, metric data, resume data, links, and the CV modal.
- Refactor the stacked foreground sections into independently renderable stage panels. Do not create a second Universe scene.
- Preserve every currently rendered portfolio detail. No text, metrics, role, bullet, skill, link, or action may be omitted or truncated to fit a viewport.
- Keep foreground content inside the dynamic viewport with safe-area-aware padding. Use responsive columns, hierarchy, and layout changes before reducing type size. Do not add nested scrolling to stage panels.
- Experience presents one selected role at a time, with all five roles available through an accessible role selector. The selected role shows its full title, employer, dates, location, and every current bullet.
- Other dense content may use selectable groups or compact responsive grids, provided all existing content remains reachable without a vertical scroll panel.
- Preserve all seven language variants and keep stage labels localized.

## Navigation Controller

One controller arbitrates input and stage transitions:

- **Wheel and trackpad:** normalize deltas and accumulate one intentional gesture into at most one stage change. Disarm during a transition and re-arm only after the transition and gesture quiet period complete.
- **Touch:** an intentional vertical swipe advances or reverses one stage. Ignore interactive controls. On the Universe stage, vertical swipes navigate while horizontal planet drags remain owned by the Universe controls.
- **Keyboard:** support ArrowDown/ArrowUp, PageDown/PageUp, Home, and End when focus is not in an editable or interactive control. Preserve normal button, link, and form-control behavior.
- **Navbar:** route all links through the controller. A distant destination transitions directly from the current stage to the selected stage without queuing intermediate animations.
- **Browser history:** initialize from a valid section hash; write the active destination to the hash after a completed user transition; respond to Back and Forward without adding another history entry.
- **Focus and semantics:** expose the current stage with a localized heading and an announced active state. Inactive stages are inert and hidden from assistive technology. Keep navbar controls, the CV modal, and external links keyboard-accessible.
- **Gestures and controls:** do not intercept gestures from links, buttons, inputs, selects, editable content, the CV modal, or active planet drags.
- **Reduced motion:** retain all destinations and input methods, but switch stages without animated movement or fades.

## Viewport and Background Behavior

- After Universe entry, keep the viewport fixed and prevent document scroll for the remaining portfolio journey. Do not rely on a global overflow rule before the Hero transition; scope the fixed-stage behavior to the active cinematic journey.
- Use dynamic viewport sizing and safe-area insets, especially on mobile. Stage content must be fully visible at every required viewport without horizontal or vertical overflow.
- Keep one persistent Universe scene and its animation state. Continue animation between stages and adjust only its visual treatment.
- Enable planet hover, selection, information cards, and orbit dragging on Universe. Disable background pointer interaction on Impact through Contact so stage content owns input.
- Keep visible direct navigation to all stages so the experience is not gesture-only.

## Motion

Use the existing Motion infrastructure. Stage transitions animate only opacity and transform, with one active transition at a time. A new input during transition is ignored until the current transition completes. Prefer a short fade with a restrained vertical reveal; do not move the document. Reduced-motion users receive immediate stage changes.

## Failure and Edge Handling

- Unknown hashes resolve to Hero without breaking rendering.
- A direct valid post-Universe hash opens the matching stage with the Hero transition already complete.
- Rapid wheel bursts cannot skip stages or queue multiple transitions.
- Browser Back/Forward changes the stage and active navigation state consistently.
- Browser zoom gestures (`ctrl`/`meta` + wheel) remain browser-controlled.
- If an active stage cannot render, retain navigation and provide an accessible fallback for that stage.

## Verification Requirements

Test the full path and reverse path, direct hash navigation, navbar jumps, browser Back/Forward, wheel and trackpad burst handling, touch swipes, keyboard navigation, modal and link interactions, planet dragging, reduced motion, and persistent-scene continuity.

Browser-emulate each listed viewport from the master requirements:

- Desktop: 1920×1080, 1680×1050, 1440×900, 1366×768, 1280×800, 1024×768.
- Tablet: 1024×1366, 834×1194, 768×1024.
- Mobile: 430×932, 414×896, 390×844, 375×812, 360×800, 320×720.
- Check portrait and landscape where practical.

At every size, verify the viewport/document position stays fixed after Universe, all content is readable and complete, no nested scrollbars appear, controls remain operable, and the background scene does not remount. Report browser emulation separately from physical-device coverage. Run the relevant automated suite, TypeScript, lint, formatting, and production build; report pre-existing failures distinctly.
