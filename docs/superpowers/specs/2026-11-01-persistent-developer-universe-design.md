# Persistent Developer Universe Design

Source requirements: user-provided master brief at `/Users/omkarkirane/.codex/attachments/29d5f118-57eb-4dee-b48c-64a2795de565/Pasted text.txt`.

## Goal

Keep one existing Developer Universe scene mounted after the Hero transition and use it as the background for Universe, Impact, Work, Experience, Skills, Resume, and Contact. Preserve the current Hero, cinematic transition, planets, orbit animation, localization, and CV modal.

## Architecture

- `App` owns one `MotionValue<number>` for universe formation and one persistent background host. `CinematicJourney` remains the owner of its scoped input handlers, target/spring progress, and reversible Hero dissolve; it mirrors the progress to the shared value without per-frame React state updates.
- The background host is a fixed, single `DeveloperUniverse` instance. It activates during the transition, remains mounted through later sections, pauses its renderer when the document is hidden, and accepts a separate interaction flag that is true only while Universe is the active section.
- The normal document flow is `home` (Hero/transition), `universe`, `impact`, `work`, `experience`, `skills`, `resume`, `contact`. The Universe section provides a full-screen exploration destination; Impact is a separate foreground section with the existing four source-backed metrics.
- A section-aware dark treatment sits above the scene and below foreground content. It changes only by active section and does not reduce the opacity of the sun/planets independently.
- Resume navigation targets a real Resume section. Its localized professional summary is sourced from the existing locale-specific resume data, and its action opens the existing accessible CV modal.
- Existing Motion APIs provide section reveals and reduced-motion behavior. Existing responsive Universe layout and low-power particle budgets remain in use.

## Constraints

- One DeveloperUniverse component and one WebGL canvas; no scene remount or duplicate animation loop between sections.
- No new animation dependency. Preserve scoped transition input and normal scrolling after transition completion.
- Disable pointer interaction outside the Universe section while allowing foreground links, cards, buttons, and scrolling to work.
- Preserve all existing localized content and metric calculations. Add the Universe nav label to every supported locale.
- Use browser viewport emulation for listed sizes and report that physical device testing was unavailable.

## Acceptance Checks

- Navigation and section order match the user brief; active state and hash follow scroll and navigation.
- The Hero remains the opening view and its current transition completes or reverses; the background is hidden before entry.
- One scene persists through every destination, keeps orbit state, and only accepts planet input inside Universe.
- Impact retains the existing four metrics in a 4-column desktop and 2-by-2 mobile editorial layout.
- Resume section, modal action, contact behavior, localization, reduced motion, visibility pause, and responsive layout work.
- Typecheck, focused tests, full suite, lint/format checks, and production build are reported with actual results.
