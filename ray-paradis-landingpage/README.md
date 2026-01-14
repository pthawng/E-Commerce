# Ray Paradis — Landing Page

Author: Lê Phước Thắng

This repository contains the Ray Paradis landing page — a refined, accessible, and performance-minded site built with modern web tooling. It implements a motion system, reusable UI primitives, and editorial copy to deliver a quiet-luxury experience.

## Quick start (local)

Prerequisites:
- Node.js (recommended via nvm)
- npm or pnpm

Commands:

```sh
# 1. Clone
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install
npm install

# 3. Dev server (Vite)
npm run dev

# 4. Build for production
npm run build

# 5. Lint
npm run lint
```

## Project structure

- `public/` — static assets (favicon, manifest, images). Served from site root.
- `src/`
  - `components/` — React components split by purpose (layout, sections, ui, effects).
  - `hooks/` — small reusable hooks (`useOverlapInView`, etc.).
  - `assets/` — images and visual assets used in the UI.
  - `lib/` — small utilities.
  - `pages/` — route pages (index).
  - `main.tsx`, `index.css`, `tailwind.config.ts` — app bootstrap and styling.
- `package.json` — scripts and dependencies.

## Architecture notes

- Motion tokens are centralized (`src/components/effects/motionTokens.ts`) so timing and easing are consistent across the site.
- Section reveal behavior is driven by `useOverlapInView` (IntersectionObserver) to create subtle overlap reveals and respect `prefers-reduced-motion`.
- Visual styles use Tailwind with a small set of custom utilities in `src/index.css` for site-wide rhythm.
- Components follow a “content-first” approach so the page remains usable without JavaScript.

## How to contribute

1. Create a branch from `main` named `feat/your-topic`.
2. Run `npm install` and `npm run dev`.
3. Implement changes; keep UI changes minimal and aligned with the site’s editorial tone.
4. Run `npm run lint` before committing.
5. Open a PR with a clear description and screenshots (if UI).

## Recommended next steps for production readiness

- Add a CI workflow that runs `npm ci`, `npm run lint`, `tsc --noEmit`, and `npm run build`.
- Add unit tests (Vitest + React Testing Library) for critical components.
- Add Storybook for a component catalog and visual review.
- Integrate accessibility checks (axe) in CI.

## Deployment

This project is deployable to any static hosting that supports Vite builds (Netlify, Vercel, GitHub Pages, etc.). The output directory is `dist/` after `npm run build`.

## Contact

Author: **Lê Phước Thắng**
Email: lephuocthang207@gmail.com

--- 
This README is tailored to the current repository; expand sections above as the project matures (tests, CI, deployment specifics).
