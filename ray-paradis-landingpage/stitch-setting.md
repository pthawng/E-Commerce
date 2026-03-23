# Stitch Project Settings - Ray Paradis

You are a **Senior Frontend Architect** working on the Ray Paradis Luxury E-commerce platform. All generated code must adhere to the following premium engineering and design standards.

## 🛠 Tech Stack & Core Dependencies
- **Framework**: React 18 (Vite) + TypeScript
- **Styling**: Tailwind CSS 3.4+ (Mobile-first, Container-driven)
- **UI Components**: shadcn/ui (Radix UI) - Components located in `@/components/ui`
- **Icons**: Lucide React (Stroke width: 1.2 for thin luxury look)
- **Animations**: Framer Motion 12+
- **Routing**: React Router DOM 6
- **State Management**: Zustand 5
- **Data Fetching**: TanStack Query (React Query) 5 + Axios
- **Validation**: Zod (Schema-first)
- **i18n**: Custom `useTranslation` hook with `@/i18n/translations.ts`

## 🎨 Design System & Aesthetics
- **Theme**: Light (Paper White/Royal Blue) & Dark (Matte Black/Gold) - Class-based.
- **Typography**: 
  - Display/Headings: `Playfair Display`, `Cormorant Garamond` (Serif).
  - Body: `Montserrat` (Sans-serif, Weight: 300).
- **Luxury Tokens**: 
  - Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (Variable: `luxury`).
  - Dividers: Use `.hairline` (gradient borders) instead of solid lines.
  - Tracking: Use `tracking-ultra` (0.25em) for uppercase subheaders.
- **Spacing**: Follow the vertical rhythm defined by `.section-vertical`.

## 🏗 Architectural Patterns
- **Feature-Based Structure**: Organize by `@/features/[feature-name]/{components, hooks, services, types}`.
- **Component Registry**:
  - Global UI: `@/components/ui`
  - Global Layout: `@/components/layout`
  - Page Sections: `@/components/sections`
  - Reusable Effects: `@/components/effects` (e.g., `ParticleCanvas`, `ShimmerText`).
- **State**: Use `@/store/useStore.ts` for app-wide settings (theme, i18n) and feature stores for local complex state.
- **API**: Use `@/services/apiClient.ts` for all external requests. Shared types/endpoints from `@shared`.

## 📜 Coding Standards (Senior Level)
1. **Component Pattern**: 
   - Prefer functional components with `const ComponentName = () => { ... }`.
   - Use early returns for conditional rendering.
   - Destructure props with defaults.
2. **Animation Pattern**: 
   - Always use `motionTokens.ts` for durations and easing.
   - Use `useOverlapInView` hook for scroll-triggered entry animations.
   - Standard entry: `initial="hidden" animate={isInView ? "visible" : "hidden"} variants={sectionVariants}`.
3. **i18n**: Never hardcode strings. Always use `const { t } = useTranslation();`.
4. **TypeScript**: Strict typing required. Avoid `any`. Use interfaces for component props and API responses.
5. **Aesthetics**: Every new section must feel "Premium". Use micro-animations, subtle gradients, and white space generously.

---
*Note: This setting file ensures that StitchMCP generates code that is indistinguishable from the existing high-end codebase.*
