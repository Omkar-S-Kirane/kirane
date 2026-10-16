# KIRANE — Project Instructions

> Personal developer portfolio. React 19 · TypeScript 6 · Vite 8 · Tailwind CSS v4 · Motion

## Architecture

### Stack

- **Framework:** React 19 (function components, hooks only — no class components)
- **Language:** TypeScript 6 with strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`)
- **Build:** Vite 8 with `@vitejs/plugin-react` and `@tailwindcss/vite`
- **Styling:** Tailwind CSS v4 using `@theme` directive in `src/styles/globals.css` (no `tailwind.config.js`)
- **Animation:** Motion library (`motion` package v14+, import from `motion/react` — NOT `framer-motion`)
- **Icons:** Lucide React (`lucide-react`)
- **Linting:** Oxlint (NOT ESLint) with react, typescript, oxc plugins
- **Formatting:** Prettier (semi: false, singleQuote: true, trailingComma: all)
- **Testing:** Vitest + React Testing Library + jsdom
- **Node:** >=22, npm >=10

### Path Aliases

All imports use `@/` which maps to `src/`:

```typescript
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
```

Configured in both `tsconfig.app.json` and `vite.config.ts`. The `defineConfig` import comes from `vitest/config` (not `vite`) to support the `test` property.

### Project Structure

```
src/
├── app/                  # App root — App.tsx, providers.tsx, main entry
├── components/
│   ├── effects/          # Animation wrappers — Reveal (viewport-triggered), Parallax (scroll-linked)
│   ├── layout/           # Navbar, Footer
│   └── ui/               # Reusable primitives — Button, Container, SectionHeading
├── lib/
│   ├── animations/       # Motion variant definitions (motion-variants.ts)
│   └── cn.ts             # Class name join utility (lightweight, no external deps)
├── sections/             # Page-level sections — Hero (more planned)
├── styles/               # globals.css (@theme + base layer), variables.css (CSS custom properties)
└── test/                 # Test setup (imports @testing-library/jest-dom/vitest)
```

### Component Conventions

- **One component per directory** with barrel `index.ts` re-export
- **File naming:** PascalCase matching the component name (`Button/Button.tsx`, `Button/index.ts`)
- **Tests:** Co-located as `ComponentName.test.tsx` in the same directory
- **Props:** Defined as TypeScript interfaces, extending native element props via `ComponentProps<'element'>`
- **No default exports** — all components use named exports
- **Polymorphic elements** use an `as` prop pattern (see Container)

## Design System

### Theme Tokens

Defined via Tailwind CSS v4 `@theme` in `src/styles/globals.css`:

| Token             | Value     | Purpose              |
|-------------------|-----------|----------------------|
| `--color-bg`      | `#09090b` | Primary background   |
| `--color-bg-muted`| `#18181b` | Elevated surfaces    |
| `--color-fg`      | `#fafaf9` | Primary text         |
| `--color-fg-muted`| `#a1a1aa` | Secondary text       |
| `--color-accent`  | `#d4c5a9` | Warm stone accent    |
| `--color-accent-hover` | `#e8dcc6` | Accent hover state |
| `--color-border`  | `#27272a` | Default borders      |
| `--color-border-hover` | `#3f3f46` | Border hover state |

Use these as Tailwind classes: `bg-bg`, `text-fg-muted`, `border-border`, `bg-accent`, etc.

### CSS Custom Properties

Layout and animation tokens in `src/styles/variables.css`:

- **Layout:** `--container-max: 1200px`, `--container-padding: 1.5rem`
- **Timing:** `--duration-fast: 150ms`, `--duration-normal: 300ms`, `--duration-slow: 500ms`
- **Easing:** `--ease-out: cubic-bezier(0.33, 1, 0.68, 1)`, `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`
- **Radii:** `--radius-sm` through `--radius-full`

### Typography

- System font stack: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`
- Monospace: `ui-monospace, 'Cascadia Code', 'Consolas', monospace`
- Body: 16px base, `leading-relaxed` for long-form text
- Headings: `font-medium`, `tracking-tight`
- Eyebrow text: `text-sm`, `font-medium`, `uppercase`, `tracking-widest`, `text-accent`

## Animation

### Motion Library Rules

**Critical:** This project uses the `motion` package. All imports MUST come from `motion/react`:

```typescript
// CORRECT
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { Variants } from 'motion/react'

// WRONG — never use these
import { motion } from 'framer-motion'           // ← Wrong package
import { motion } from 'motion'                   // ← Wrong entry point
```

**Do not install `framer-motion` as a separate package.** The `motion` package is the successor and includes everything needed.

### Animation Architecture

- **MotionConfig** wraps the entire app via `src/app/providers.tsx` with `reducedMotion="user"` — this automatically respects `prefers-reduced-motion` for all declarative animations
- **Reveal** (`components/effects/Reveal`) — viewport-triggered entrance animations using `whileInView`. Supports variant selection and configurable delay
- **Parallax** (`components/effects/Parallax`) — scroll-linked vertical transforms using `useScroll` + `useTransform`. **Important:** scroll-linked transforms bypass MotionConfig's reduced-motion handling, so Parallax directly checks `useReducedMotion()` and renders a static fallback when motion is reduced
- **Shared variants** live in `src/lib/animations/motion-variants.ts` — `fadeIn`, `fadeInUp`, `staggerChildren`

### Animation Guidelines

- Keep durations context-appropriate; stagger list items by 0.1–0.15s
- Use `cubic-bezier(0.33, 1, 0.68, 1)` (ease-out) for entrances, matching `--ease-out`
- Exit animations should be faster than entrances (~60–70% of enter duration)
- Never animate `width`, `height`, `top`, `left` — use `transform` and `opacity` only
- All scroll-linked or spring-based animations must handle reduced-motion independently of MotionConfig
- Maximum 1–2 animated elements per viewport at once to avoid excessive motion

## Code Quality

### TypeScript

- `strict: true` is non-negotiable — no `any`, no `@ts-ignore`, no `as unknown as`
- Use `type` imports with `verbatimModuleSyntax`: `import type { ReactNode } from 'react'`
- `erasableSyntaxOnly: true` — use `type` keyword for type-only imports/exports, not `enum` or `namespace`
- Props interfaces named `ComponentNameProps` with explicit types (no `Record<string, any>`)
- Prefer `ComponentProps<'element'>` over `React.HTMLAttributes` for extending native props

### Styling

- Tailwind CSS v4 utilities only — no inline `style` attributes except for dynamic Motion values
- Custom theme values via `@theme` directive, not arbitrary Tailwind values where a token exists
- Use the `cn()` utility from `@/lib/cn` for conditional class composition
- Mobile-first responsive design: base styles for mobile, `sm:` / `lg:` for larger breakpoints
- Focus-visible outlines: `2px solid var(--color-accent)` with `2px` offset (set globally in base layer)

### Linting and Formatting

- **Oxlint** (not ESLint): configured in `.oxlintrc.json` with `react/rules-of-hooks: error`
- **Prettier**: semi-free, single quotes — run `npm run format` before committing
- Module-level constants for expressions that would trigger purity warnings (e.g., `const CURRENT_YEAR = new Date().getFullYear()` at module scope, not inside JSX)

### Testing

- Co-located test files: `ComponentName.test.tsx` next to the component
- Vitest globals enabled — `describe`, `it`, `expect`, `vi` available without imports (but explicit imports are preferred for clarity)
- Setup file at `src/test/setup.ts` loads `@testing-library/jest-dom/vitest` matchers
- Use `screen.getByRole` for accessible queries — prefer role-based selectors over test IDs
- `afterEach(cleanup)` in each test file for proper DOM teardown
- `userEvent.setup()` for interaction testing (not `fireEvent`)

## Git Discipline

- **Do not commit** without explicit permission
- **Do not push** to remote — the developer handles authentication and pushes manually
- **Do not use** destructive commands (`reset --hard`, `push --force`, `checkout .`, `clean -f`)
- **Do not disable** lint rules or TypeScript checks to hide errors
- Commit messages: imperative mood, concise description of the change

## Commands

| Command              | Purpose                              |
|----------------------|--------------------------------------|
| `npm run dev`        | Start Vite dev server with HMR       |
| `npm run build`      | TypeScript check + production build   |
| `npm run preview`    | Serve production build locally        |
| `npm run typecheck`  | TypeScript type checking only         |
| `npm run lint`       | Lint with Oxlint                      |
| `npm run test`       | Run tests with Vitest                 |
| `npm run test:watch` | Tests in watch mode                   |
| `npm run format`     | Format with Prettier                  |
| `npm run format:check` | Check formatting without writing    |
| `npm run setup`      | Self-diagnosing environment setup     |

## Safety Rules

- Do not install `framer-motion` alongside `motion`
- Do not add GSAP or Lenis unless explicitly requested
- Do not overwrite existing sections (Hero) or completed design work
- Do not rewrite `package.json` wholesale — make targeted changes only
- Do not force dependency resolution with `--force` or `--legacy-peer-deps`
- Do not fabricate test results or claim checks passed without running them
- Do not disable lint or TypeScript rules to suppress errors — fix the underlying issue
