Ray Paradis — Token Sheet & Class-name Cheat Sheet
=================================================

Files added:
- `back-office/src/styles/tokens.css` — CSS variables and core helper classes (primary token file).

1) Quick reference — CSS variables (use via var(--name))
- Colors:
  - `--rp-color-primary`: #002d49
  - `--rp-color-surface`: #F7F9FB
  - `--rp-color-accent`: #C9A66B
  - `--rp-color-text`: #25323A
  - `--rp-color-muted`: #58616A
  - `--rp-color-error`: #D34D4D
  - `--rp-color-success`: #A3B18A

- Spacing:
  - `--rp-gap-1` .. `--rp-gap-6` (4px .. 32px)

- Radii:
  - `--rp-radius-sm` (8px), `--rp-radius-md` (12px), `--rp-radius-lg` (16px)

- Typography:
  - `--rp-font-heading` (Playfair Display), `--rp-font-body` (Inter)
  - `--rp-h1` 28px, `--rp-h2` 20px, `--rp-body` 14px

2) Class-name cheat sheet (map UI elements → rp- classes)

- Layout
  - Root layout container: `rp-layout`
  - Sidebar: `rp-sidebar` (states: `rp-sidebar--collapsed`)
  - Topbar: `rp-topbar`, brand → `rp-topbar__brand`, search area → `rp-topbar__search`
  - Page header: `rp-page-header`, title → `.rp-title`, subtitle → `.rp-subtitle`

- Card
  - Generic card: `rp-card`
  - Section card: `rp-card--section`
  - Meta / sidebar card: `rp-card--meta`

- Table
  - Table container: `rp-table`
  - Row: `rp-table__row`, selected: `rp-table__row--selected`
  - Cell: `rp-table__cell`
  - Sticky action column: `rp-table__actions rp-table__actions--sticky`

- Button
  - Primary action: `rp-btn--primary`
  - Secondary / ghost: `rp-btn--ghost`
  - Danger: `rp-btn--danger` (create mapping in tokens.css if needed)

- Input & Controls
  - Text input: `rp-input`
  - Select: `rp-select`
  - Textarea: `rp-textarea`
  - Switch: `rp-switch`

- Media & Gallery
  - Thumbnail: `rp-thumb` (modifiers `--large`, `--small`)
  - Gallery: `rp-gallery`
  - Media tile: `rp-media-item`, selected: `rp-media-item--selected`

- Badges & chips
  - Generic badge: `rp-badge`
  - Status badges: `rp-badge--status--paid`, `--pending`, `--canceled`

- Utilities
  - 2-column grid: `rp-grid-2col`
  - Sticky action bar: `rp-sticky-actions`

3) Short usage notes for developers

- Where to import:
  - Import `back-office/src/styles/tokens.css` at the app root CSS entry (e.g. `back-office/src/main.tsx` or `index.css`) so variables are globally available.

- How to apply safely:
  - Do not modify existing component props, event handlers, hooks, or markup structure.
  - Prefer adding `className="rp-..."` to existing wrappers or the Ant Design `className` prop for components (e.g. `<Card className="rp-card">`).
  - Avoid changing DOM tree structure — use CSS overrides and utility classes.

- Theming Ant Design:
  - Keep Ant Design components unchanged; apply tokens via `className` wrappers and override CSS variables where necessary.
  - For global AntD style tokens, map tokens.css values into the theme variables if a central theming approach is used.

- Progressive rollout:
  - Update one screen at a time (Global layout → Product List → Product Edit → Orders).
  - Keep PRs small: add classes and token mappings first, then refine spacing and visual polish in follow-ups.

- Accessibility:
  - Ensure focus styles remain visible — use `.rp-input:focus` and `.rp-btn--primary:focus` styles provided in tokens.
  - Preserve ARIA attributes and keyboard interactions; CSS should not remove focus outlines.

4) Quick grep mappings (suggested)
- Find old class or selector and add rp- class:
  - `grep -R "className=.*ProductCard" -n` → add `rp-product-card` or `rp-card`
  - `grep -R "Table" src/features | grep product` → add `rp-table` wrapper

5) Next deliverable suggestions
- Provide an SCSS partial (`_tokens.scss`) if the project prefers SCSS variables and mixins.
- Provide a short migration PR example: update `AdminLayout` and `HeaderBar` with `rp-` classes and token import.

--- EOF


