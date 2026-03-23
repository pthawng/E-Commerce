# Architecture Contract

This document defines the strict architectural rules for the Back-Office project. All contributors must adhere to these guidelines to ensure maintainability, scalability, and consistency.

## 1. API Rules 🌐

- **No Direct API Calls in Components/Pages**: UI components and pages must **never** import `axios` or call API endpoints directly.
- **Entity-Centric Data Access**: All data fetching and mutations must be encapsulated within the `entities` layer (or `features` for specific use cases).
- **Custom Hooks**: Use custom hooks (e.g., `useOrderList`, `useCreateProduct`) to expose data and actions to the UI.
- **DTOs & Adapters**: Transform API responses into domain models within the API layer if necessary, to decouple the UI from backend schema changes.

## 2. UI Rules 🎨

- **No Hardcoded Styles**: Avoid hardcoding hex colors, font sizes, or spacing values in components.
- **Design System Usage**: strict usage of the **Design System** (tokens, variables, common components) found in `src/shared/design-system` or `src/shared/ui`.
- **Ant Design Customization**: Customize Ant Design components via the global `ConfigProvider` theme, not inline styles.
- **No Tailwind Templates**: Do not copy-paste Tailwind code or use utility-first CSS frameworks unless explicitly approved. Stick to CSS Modules or Vanilla CSS with design tokens.

## 3. Feature Rules 🧩

- **Composition over Inheritance**: Build complex UIs by composing smaller, reusable `widgets` and `features`.
- **Page Responsibility**: Pages (`src/pages`) should only orchestrate layout and compose `widgets`/`features`. They should contain **minimal to no business logic**.
- **Widget Independence**: Widgets (`src/widgets`) should be self-contained and ideally not depend on other widgets.

## 4. Permission Rules 🛡️

- **No Role Checks in Components**: Do not check `user.role === 'ADMIN'` directly in JSX or logic.
- **Use `usePermission` Hook**: Access control must be handled via a centralized `usePermission()` hook (e.g., `can('manage_orders')`).
- **Route Guards**: Protect routes using a higher-order component or wrapper that utilizes the permission logic.

## 5. Strict Layer Boundaries 🚧

- **App** -> **Processes** -> **Pages** -> **Widgets** -> **Features** -> **Entities** -> **Shared**
- **Lower layers cannot import from upper layers**. (e.g., `shared` cannot import from `features`).
- **Cross-imports** within the same layer (e.g., `features` to `features`) should be avoided.

## 6. Process & Service Rules ⚙️

- **Processes (`src/processes`)**: Orchestrate complex flows spanning multiple pages. They can import `pages`, `widgets`, `features`.
- **Services (`src/shared/services`)**: Handle API orchestration (calling multiple endpoints). Pure TS logic, no UI.
- **Config (`src/shared/config`)**: Global constants only. No business logic.
- **Permissions**: All role-based logic must reside in `permission/` folders. Do not scatter `if (role === 'admin')` checks.

## 7. Data Fetching Rules 📡

- **Allowed In**:
  - `entities/api` (standard)
  - `features` (rarely, for specific feature-only data)
  - `widgets` (dashboard widgets only)
- **Forbidden In**:
  - `pages` (pages verify data existence or coordinate, but should not fetch raw data)
  - `shared/ui` (dumb components never fetch)
  - `shared/hooks` (unless it's a generic API hook wrapper)

## 8. Complexity & Code Quality Rules 📏

- **Component Size**: If a component exceeds **200 lines**, move logic to a custom hook, feature, or sub-component.
- **Page Size**: If a page exceeds **300 lines**, split it into smaller `widgets`.
- **Refactoring**: "Make it work, then make it right." Do not leave giant files.

## 9. State Management Rules 🧠

- **Server State**: Must use **React Query** (TanStack Query). Do not store API data in Redux/Zustand unless absolutely necessary for global synchronous access.
- **UI State**: Use **Zustand** for complex global UI state (e.g., Sidebar toggle, Theme mode).
- **Form State**: Use **React Hook Form**. Do not use `useState` for complex forms.
- **Local State**: Use `useState` / `useReducer` for isolated component interaction (e.g., modal open/close).
- **Rule**: Do not mix state managers needlessly.
