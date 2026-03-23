# Folder Structure Architecture (FSD Lite)

This project follows a modified **Feature-Sliced Design (FSD)** methodology.
The structure is designed to strictly separate **Business Logic**, **UI Composition**, and **Shared Utilities**.

## 📂 Root Structure

```bash
src/
├── app/          # (Layer 1) App-wide settings, providers, router
├── processes/    # (Layer 1.5) Complex Business Workflows (Checkout, Import)
├── pages/        # (Layer 2) Full pages (Route components)
├── widgets/      # (Layer 3) Large, standalone UI blocks
├── features/     # (Layer 4) User interactions & specific functionality
├── entities/     # (Layer 5) Business Domain (Data, Types, Stores)
└── shared/       # (Layer 6) Reusable primitives & utilities
```

---

## 🏗️ Detailed Breakdown

### 1. `app/` (The Shell)
**Responsibility**: Initialize the application.
- `providers/`: Context providers (QueryClient, Theme, Auth).
- `router/`: React Router configuration.
- `layout/`: Main AppShell, Sidebar, Topbar.
- `styles/`: Global CSS resets.

### 1.5. `processes/` (Business Workflows) - *[Advanced Layer]*
**Responsibility**: orchestrate multiple pages/steps to complete a major business goal.
- Examples: `checkout-order`, `import-product-flow`, `user-onboarding`.
- Spans multiple pages or complex modal wizards.

### 2. `pages/` (Composition Layer)
**Responsibility**: Compose Widgets/Processes to form a complete screen.
- ❌ **NO Business Logic**: detailed logic belongs in Features/Entities/Processes.
- ✅ **Lazy Loading**: All pages should be lazy loaded.

### 3. `widgets/` (Complex UI Blocks)
**Responsibility**: Combine multiple Entities and Features into a standalone block.
- Examples: `DashboardValues`, `UserTable`, `HeaderSection`.

### 4. `features/` (User Actions)
**Responsibility**: Handle user interactions that trigger business logic.
- Examples: `AuthForm` (Login), `ProductFilter`, `ExportToExcel`.

### 5. `entities/` (Business Domain)
**Responsibility**: core business concepts.
- Examples: `User`, `Order`, `Product`, `Payment`.
- **Structure**:
    - `model/`: Types, Interfaces, Zustand Stores.
    - `api/`: API handlers specific to this entity.
    - `ui/`: Dumb UI cards/items.
    - `config/`: Entity-specific constants (e.g., `ORDER_STATUS` enum). 
    - `permission/`: Entity-specific role rules. 

### 6. `shared/` (The Core)
**Responsibility**: Code used across all layers.
- `api/`: Axios client, React Query base configuration.
- `services/`: API Orchestration service (calling multiple APIs). 
- `config/`: Domain constants (`routes.ts`, `env.ts`, `permissions.ts`). 
- `permission/`: RBAC logic (`AbilityContext`, `rules`). 
- `ui/`: Design System (Buttons, Inputs, Spacing).
- `utils/`: Date formatting, string helpers.
- `hooks/`: Generic hooks.

---

## 🚫 Dependency Rules (Strict)

1. **Unidirectional Flow**:
   - `App` -> `Processes` -> `Pages` -> `Widgets` -> `Features` -> `Entities` -> `Shared`.
   - A layer **cannot** import from a layer above it.

2. **Cross-Slice Imports**:
   - `Features` cannot import other `Features`.
   - `Entities` cannot import other `Entities`.

