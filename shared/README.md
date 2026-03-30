# Shared Contracts (`@ray-paradis/shared`)

## 1. Overview
The `@ray-paradis/shared` module is a universal NPM workspace package acting as the single source of truth for data structures across the entire e-commerce monorepo. It ensures that the Backend, Storefront, and Admin portals speak the exact same topological language, preventing API contract drift and runtime type mismatches. 

## 2. Responsibilities
* **Owns:**
  * Global TypeScript Interfaces (e.g., `IProductVariant`, `IOrderTimeline`).
  * End-to-end Data Transfer Objects (DTOs) definitions.
  * Zod validation schemas for payload assertions.
  * Shared Enums (e.g., `OrderStatus`, `PaymentMethod`).
* **Does NOT Own:**
  * Application state or UI rendering logic.
  * Database abstractions or Prisma schemas.
  * Active business logic or third-party integrations.

## 3. Key Modules / Features
* **`interfaces`**: Pure TypeScript representations of the system entities decoupled from the ORM.
* **`schemas`**: Zod validation trees used simultaneously by the backend for `class-validator` equivalents, and the frontend for `react-hook-form` validation.
* **`enums`**: Strictly defined constants aligning database states with frontend strings.

## 4. Architecture Notes
* **Zero Runtime Overhead (Mostly)**: By heavily preferring TypeScript `type` and `interface` definitions, the compiled JavaScript output of this package is near zero—excluding Enums and Zod schemas.
* **Aggressive Export Strategy**: Uses an `index.ts` barrel export file to guarantee clean sibling imports across the workspace (e.g., `import { OrderStatus } from '@ray-paradis/shared';`).

## 5. External Dependencies
* **Zod**: The singular heavy third-party dependency utilized for cross-boundary payload validation mapping natively into Typescript types.

## 6. Key Flows (Service Perspective)
The module acts as a passive library. A standard modification flow looks like:
1. Engineer adds `CANCELED_BY_ADMIN` to `OrderStatus` enum within `shared`.
2. Engineer rebuilds the `shared` workspace.
3. The TypeScript compiler immediately flags all missing switch blocks or component states across `backend` and `storefront` that fail to handle the new state.

## 7. Environment & Configuration
This module acts as a pure utility and requires **no `.env` initialization**. 
Configuration relies entirely on standard `tsconfig.json` path mappings resolved by the parent workspaces.

## 8. How to Run
Trigger a build of this specific workspace (usually required when types change so consumer apps catch updates):

```bash
npm run build --workspace=@ray-paradis/shared
```

## 9. Notes
* **Assumptions**: Presumes all workspaces are explicitly using this library rather than re-declaring types locally. 
* **Limitations**: Over-saturating this package with heavy utility functions (e.g., complex lodash-style logic) can artificially bloat the bundle size of the Storefront SPA. Keep it strictly to contracts and schemas.
* **Future Improvements**: Transition backend DTO validation fully to Zod to match frontend validation logic, entirely unifying the input-sanitization rulesets.
