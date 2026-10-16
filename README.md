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

| Category       | Technology                                      |
| -------------- | ----------------------------------------------- |
| Framework      | [React](https://react.dev/) 19                  |
| Language       | [TypeScript](https://www.typescriptlang.org/) 6 |
| Build Tool     | [Vite](https://vite.dev/) 8                     |
| Styling        | [Tailwind CSS](https://tailwindcss.com/) 4      |
| Animation      | [Motion](https://motion.dev/)                   |
| Icons          | [Lucide React](https://lucide.dev/)             |
| Linting        | [Oxlint](https://oxc.rs/)                       |
| Formatting     | [Prettier](https://prettier.io/)                |
| Testing        | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- npm >= 10

### Installation

```bash
git clone https://github.com/Omkar-S-Kirane/kirane.git
cd kirane
npm install
```

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

## Project Structure

```
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

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start development server                     |
| `npm run build`      | Type check and build for production           |
| `npm run preview`    | Preview the production build                  |
| `npm run typecheck`  | Run TypeScript type checking                  |
| `npm run lint`       | Lint with Oxlint                              |
| `npm run test`       | Run tests with Vitest                         |
| `npm run test:watch` | Run tests in watch mode                       |
| `npm run format`     | Format code with Prettier                     |
| `npm run format:check` | Check formatting without writing changes   |

## Deployment

Not yet deployed. The project produces a static build suitable for any static hosting provider such as Vercel, Netlify, or Cloudflare Pages.

## Author

**Omkar Kirane**
[GitHub](https://github.com/Omkar-S-Kirane)

## Licence

This project does not currently include a licence file. All rights are reserved by the author unless a licence is added in the future.
