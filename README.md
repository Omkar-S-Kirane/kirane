# KIRANE

A personal developer portfolio built with React, TypeScript, and Vite. Designed as a premium dark-themed showcase with smooth motion-driven animations and a clean, component-driven architecture.

> **Status:** In active development. The foundational architecture, design system, and Hero section are complete. Additional sections and content are being built.

## Features

**Implemented:**

- Premium dark theme with warm stone accent palette and CSS custom properties
- Responsive layout with mobile-first Tailwind CSS v4 styling
- Animated Hero section with staggered entrance transitions
- Fixed translucent navbar with backdrop blur
- Reusable UI component library (Button, Container, SectionHeading)
- Animation primitives — viewport-triggered Reveal and scroll-linked Parallax effects
- Automatic `prefers-reduced-motion` support via Motion's `MotionConfig`
- Strict TypeScript with path aliases and full type safety
- Component testing with Vitest and React Testing Library

**Planned:**

- About, Projects, and Contact sections
- Project showcase with filtering
- Page transitions and scroll-driven interactions
- SEO metadata and Open Graph tags
- Production deployment

## Tech Stack

| Category   | Technology                                                                            |
| ---------- | ------------------------------------------------------------------------------------- |
| Framework  | [React](https://react.dev/) 19                                                        |
| Language   | [TypeScript](https://www.typescriptlang.org/) 6                                       |
| Build Tool | [Vite](https://vite.dev/) 8                                                           |
| Styling    | [Tailwind CSS](https://tailwindcss.com/) 4                                            |
| Animation  | [Motion](https://motion.dev/)                                                         |
| Icons      | [Lucide React](https://lucide.dev/)                                                   |
| Linting    | [Oxlint](https://oxc.rs/)                                                             |
| Formatting | [Prettier](https://prettier.io/)                                                      |
| Testing    | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- npm >= 10

### Installation

```bash
git clone https://github.com/Omkar-S-Kirane/kirane.git
cd kirane
npm run setup
```

The setup script validates your environment, installs dependencies, runs diagnostics, and verifies that all quality gates pass. If you prefer a manual install, run `npm install` instead.

### Development

```bash
npm run dev
```

Opens a local development server with hot module replacement.

### Production Build

```bash
npm run build
```

Runs TypeScript type checking followed by a Vite production build. Output is written to `dist/`.

### Local Preview

```bash
npm run preview
```

Serves the production build locally for inspection before deployment.

## Setup

The project includes a self-diagnosing setup system that validates your environment, installs dependencies, and runs all quality gates in one command.

```bash
npm run setup
```

### CLI Options

| Option           | Description                                    |
| ---------------- | ---------------------------------------------- |
| `--help`         | Show usage information                         |
| `--skip-tests`   | Skip the test suite during quality gates       |
| `--install-only` | Install dependencies only (skip quality gates) |

```bash
# Example: skip tests during setup
npm run setup -- --skip-tests
```

### What It Checks

The setup pipeline runs five phases in order:

1. **Environment validation** — Node.js >= 22, npm >= 10, OS and architecture detection
2. **Dependency installation** — Prefers `npm ci` for reproducible installs; falls back to `npm install`
3. **Diagnostics** — Peer dependency issues, lockfile health, duplicate packages, disk space
4. **Configuration validation** — Required config files and package scripts
5. **Quality gates** — TypeScript type checking, Oxlint, Vitest, Vite production build

### Troubleshooting

**Node.js version too old**
The project requires Node.js 22 or later. Use a version manager to switch:

```bash
# nvm
nvm install 22 && nvm use 22

# fnm
fnm install 22 && fnm use 22

# volta
volta install node@22
```

An `.nvmrc` file is included so `nvm use` and `fnm use` pick up the correct version automatically.

**npm version too old**
Node.js 22 ships with npm 10. If your npm is older, upgrade it:

```bash
npm install -g npm@latest
```

**Dependency installation fails**
Check your network connection and try again. If the problem persists, delete `node_modules` and `package-lock.json` manually, then run `npm install`:

```bash
rm -rf node_modules package-lock.json
npm install
```

**Quality gate fails**
Review the error output printed by the setup script. Each gate runs the same command you can run individually — `npm run typecheck`, `npm run lint`, `npm run test`, or `npm run build` — to isolate the issue.

## Project Structure

```
scripts/
└── setup/                # Self-diagnosing project setup system
src/
├── app/                  # Application root and providers
├── components/
│   ├── effects/          # Animation components (Reveal, Parallax)
│   ├── layout/           # Layout components (Navbar, Footer)
│   └── ui/               # Reusable UI primitives (Button, Container, SectionHeading)
├── lib/
│   ├── animations/       # Motion variant definitions
│   └── cn.ts             # Class name utility
├── sections/             # Page sections (Hero)
├── styles/               # Global styles and CSS custom properties
└── test/                 # Test setup and configuration
```

## Scripts

| Command                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `npm run setup`        | Validate environment, install deps, run checks |
| `npm run dev`          | Start development server                       |
| `npm run build`        | Type check and build for production            |
| `npm run preview`      | Preview the production build                   |
| `npm run typecheck`    | Run TypeScript type checking                   |
| `npm run lint`         | Lint with Oxlint                               |
| `npm run test`         | Run tests with Vitest                          |
| `npm run test:watch`   | Run tests in watch mode                        |
| `npm run format`       | Format code with Prettier                      |
| `npm run format:check` | Check formatting without writing changes       |

## Deployment

Not yet deployed. The project produces a static build suitable for any static hosting provider such as Vercel, Netlify, or Cloudflare Pages.

## Author

**Omkar Kirane**
[GitHub](https://github.com/Omkar-S-Kirane)

## Licence

This project does not currently include a licence file. All rights are reserved by the author unless a licence is added in the future.
