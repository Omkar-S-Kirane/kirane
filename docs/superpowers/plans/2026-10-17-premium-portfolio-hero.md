# KIRANE Premium Portfolio Hero Implementation Plan

> **For agentic workers:** Implement the brief inline in this checkout. Use the existing Vitest and React Testing Library setup; do not add dependencies or commit changes.

**Goal:** Replace the placeholder hero with a responsive, translated, professional hero and working section destinations while preserving the splash lifecycle and single golden particle renderer.

**Architecture:** Keep the existing `Hero` as the first viewport, use the shared `Container` and `Button`, and add a compact `PortfolioSections` component to provide factual targets for Work, Experience, Skills, and Contact navigation. Keep `ParticleSphere` mounted once in `App`; apply the sphere-to-hero composition on its outer stage with responsive CSS, without editing the renderer.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Motion for React, Lucide React, Vitest, React Testing Library.

**Spec:** User-attached project brief `5072a885-4f91-4074-9543-1f94c306e12c/Pasted text.txt`.

## Global Constraints

- Do not add a UI, animation, or testing dependency.
- Preserve the splash sequence, persistent sphere instance, renderer, and reduced-motion handling.
- Keep splash visibility independent from browser storage; do not add a fixed dismissal timer.
- Keep all visible copy in the existing translation resources and preserve language switching.
- Use only verified project information; do not invent employers, years, clients, outcomes, or metrics.
- Use the existing `Container`, layout tokens, Motion for React import convention, and section-link behavior.
- Keep changes focused on the hero and the section anchors required to make its navigation and calls to action work.

## Files

- Modify `src/i18n/types.ts` and all five locale files for the updated hero copy and supporting section content.
- Modify `src/components/ui/Button/Button.tsx` and its test to support semantic anchor buttons through the existing primitive.
- Modify `src/sections/Hero/Hero.tsx` and its test for the editorial layout and real CTA targets.
- Create `src/sections/PortfolioSections/PortfolioSections.tsx` and its test for concise, translated section targets grounded in repository facts.
- Modify `src/constants/navbar-constants.ts` and `src/components/layout/Navbar/Navbar.tsx` so visible navigation has real targets and no resume placeholder.
- Modify `src/app/App.tsx` and create `src/app/App.css` to retain one sphere renderer and reposition its outer stage responsively after transition.
- Modify `index.html` only if the browser theme metadata needs to match the updated black palette.

## Review Focus

- Narrow screens and long translated lines remain unclipped and have no horizontal overflow; exercise the 320 px layout.
- Reduced motion makes the hero immediately available and does not wait on a motion completion callback.
- The same sphere remains mounted through splash, handoff, and interactive phases.
- Every internal nav/CTA fragment resolves to a section; external project/contact links use the verified repository profile.
- The hero remains readable over the sphere and below the fixed navbar.

---

### Task 1: Factual portfolio section targets

**Files:** `src/i18n/types.ts`, all `src/i18n/locales/*.ts`, create `src/sections/PortfolioSections/PortfolioSections.tsx`, create `src/sections/PortfolioSections/PortfolioSections.test.tsx`, modify `src/constants/navbar-constants.ts`.

**Interfaces:** Produces the translated section copy, `#work`, `#experience`, `#skills`, and `#contact` targets, and repository-backed links used by the hero.

- [ ] Write tests asserting all four section IDs exist, skills reflect the installed stack, and the project/contact link targets are the repository URLs in `README.md`.
- [ ] Run the focused test and confirm it fails because `PortfolioSections` does not exist.
- [ ] Add the typed translation namespace in English, Hindi, Gujarati, Marathi, and Sanskrit; add the concise sections and verified GitHub links.
- [ ] Run the focused test and then the full test suite.

### Task 2: Responsive editorial hero and semantic CTA links

**Files:** `src/components/ui/Button/Button.tsx`, `src/components/ui/Button/Button.test.tsx`, `src/sections/Hero/Hero.tsx`, `src/sections/Hero/Hero.test.tsx`.

**Interfaces:** Consumes the translated copy and section IDs from Task 1. Produces an anchor-capable shared `Button` and the `#work` / `#contact` calls to action.

- [ ] Add a failing test for the shared Button rendering an anchor with its `href` and variant styles.
- [ ] Implement the semantic anchor variant without changing existing button behavior.
- [ ] Add failing Hero assertions for the single accessible `h1`, translated headline/description, and functional section links.
- [ ] Implement the responsive editorial composition, line reveal, reduced-motion completion, and safe-area `Container` layout.
- [ ] Run focused tests, then the full test suite.

### Task 3: Continuous sphere stage and navigation integration

**Files:** `src/app/App.tsx`, create `src/app/App.css`, `src/components/layout/Navbar/Navbar.tsx`, `src/app/App.test.tsx`.

**Interfaces:** Consumes the existing splash lifecycle and section IDs. Keeps `ParticleSphere` unchanged and mounted exactly once.

- [ ] Add an App assertion that the sphere stage changes composition by phase while only one renderer remains mounted.
- [ ] Move the phase-responsive positioning to the App-level sphere wrapper; use CSS transforms and reduced-motion media rules only.
- [ ] Remove the nonfunctional Resume link and its missing-section comments; ensure existing Work, Experience, Skills, and Contact controls point to present IDs.
- [ ] Run focused tests and the full test suite.

### Task 4: Validation and browser review

**Files:** no additional production files unless a verified defect is found.

- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
- [ ] Inspect the rendered page at desktop, tablet, and narrow mobile widths; check the splash handoff, CTA targets, focus styling, and reduced-motion presentation.
- [ ] Record the production bundle delta against the baseline build; report warnings and do not claim unmeasured performance improvements.
