# ExpenseIQ — Design System v2

Market-standard fintech UI benchmarked against Monarch, Copilot, Stripe and Mercury.

**Last Updated:** 2026-10-18

---

## Core Principles

1. **Colour encodes financial state, never decoration.**
   Green = money in / on track. Red = money out / overspent. Amber = approaching a limit.
   Nothing else may use those hues for visual flair.

2. **Money uses tabular figures.** `font-variant-numeric: tabular-nums` is applied to every
   amount, count and percentage. Columns align and digits never jitter.

3. **One primary action per screen.** Primary buttons are filled indigo; everything else is ghost.

4. **Dark mode is layered charcoal, never pure black.** Elevation is expressed through
   lightness (`--eiq-bg` → `--eiq-surface` → `--eiq-surface-raised`), not shadow alone.

5. **WCAG 2.2 AA defaults are on by default.** 40px minimum touch targets, visible focus rings,
   `prefers-reduced-motion`, `prefers-contrast` and `forced-colors` are all honoured.

---

## Token Reference

| Group | Tokens |
|-------|--------|
| Brand | `--eiq-primary`, `--eiq-primary-hover/-active`, `--eiq-primary-soft`, `--eiq-primary-ring`, `--eiq-primary-grad` |
| Positive | `--eiq-positive`, `--eiq-positive-strong`, `--eiq-positive-soft` |
| Negative | `--eiq-negative`, `--eiq-negative-strong`, `--eiq-negative-soft` |
| Warning | `--eiq-warning`, `--eiq-warning-strong`, `--eiq-warning-soft` |
| Surfaces | `--eiq-bg`, `--eiq-surface`, `--eiq-surface-raised`, `--eiq-surface-sunken`, `--eiq-sidebar-bg` |
| Text | `--eiq-foreground`, `--eiq-muted`, `--eiq-subtle`, `--eiq-faint` |
| Borders | `--eiq-border`, `--eiq-border-strong`, `--eiq-border-subtle` |
| Radii | `--eiq-radius-xs` → `--eiq-radius-2xl`, `--eiq-radius-full` |
| Elevation | `--eiq-shadow-xs` → `--eiq-shadow-lg`, `--eiq-shadow-primary` |
| Layout | `--eiq-sidebar-w`, `--eiq-header-h`, `--eiq-content-max`, `--eiq-bottom-nav-h` |
| Type | `--eiq-font` (Plus Jakarta Sans), `--eiq-font-mono` (JetBrains Mono) |

Legacy aliases (`--eiq-green`, `--eiq-red`, `--eiq-orange`, `--eiq-purple`, etc.) still resolve so
older markup keeps working. **Prefer the semantic names in new code.**

---

## Component Rules

### KPI cards (`eiq-kpi-card`)
- `trendDirection` controls the **arrow**.
- `sentiment` (`positive` | `negative` | `neutral`) controls the **colour**.
- Always pass both when they differ. Expense trending *down* is `sentiment="positive"`.

### Navigation
- Sidebar groups: **Overview** / **Insights** / **Manage**.
- Desktop rail collapses via `eiq-app--rail` on `<body>`, persisted in `localStorage`.
- Mobile uses an off-canvas drawer (`eiq-nav-open`) **plus** a bottom tab bar (5 destinations).
- `NavItem.icon` is an `AppIconName` (a `lucide*` string), so a typo fails the build
  instead of rendering an empty box.

### Iconography (`<eiq-icon>`)
- Single wrapper: `src/app/shared/components/icon.component.ts`. Never paste raw `<svg>`
  for UI icons — the icon set, sizes and stroke widths are centralised there.
- Registry: `src/app/shared/icons/app-icons.ts`. Only the ~67 curated names are
  registered; **add the import + registry entry before using a new icon** so the bundle
  never pulls the full 5,000-icon Lucide set.
- Default stroke width comes from `--eiq-icon-stroke` (1.8) in `styles.css`. Override
  per icon with `[strokeWidth]` (e.g. `2.2` for small, dense glyphs).
- Decorative by default (`aria-hidden="true"`). Pass `label` only when the icon is the
  sole content of an interactive control.

Animation is opt-in via the `anim` input (section 22 of `src/styles.css`):

| Value | Motion | Use for |
|-------|--------|---------|
| `draw` | stroke re-draws on hover | sidebar items, buttons with a label |
| `pop` | scale to 1.14 on hover | icon-only buttons, KPI and category tiles |
| `slide` | nudges right on hover | breadcrumbs, pagination, "view all →" |
| `swing` | gentle rotate on hover | notification bell |
| `spin` | continuous 360° | loaders only |
| `pulse` / `bounce` | continuous | hero art only |

`draw` needs per-shape geometry: `<eiq-icon>` calls `getTotalLength()` after render and
publishes each shape's length as `--dash`, which the `eiq-icon-redraw` keyframes consume.
All motion is neutralised by the `prefers-reduced-motion` block in section 21.

**Keep as inline SVG:** data visualisations (charts, donuts, heatmaps) and third-party
brand marks (the Google and GitHub buttons). Everything else goes through `<eiq-icon>`.

### Tables
- `.eiq-txn-th` is `position: sticky` — long tables keep context while scrolling.
- Amounts live in `.eiq-txn-td--right` with `.eiq-amount--pos` / `.eiq-amount--neg`.

### Charts
- Bar heights must be computed from the data (`chartMax()`), never a hardcoded divisor.
- Gridlines sit at `var(--eiq-border)` so data stays the brightest element.

### Loading
- Use `.eiq-skeleton` (preserves layout) instead of `.eiq-loading` spinners on data screens.

---

## Auth Screens

Login, Register and Forgot-Password share the `.auth-*` shell defined in `src/styles.css`.
Login keeps its own `.login-*` prefix but uses identical tokens and metrics.

**Never add unverifiable trust claims** (user counts, SOC 2, "bank-level encryption").
Only state protections that are actually implemented — bcrypt hashing, HttpOnly cookies,
CSRF signing, rate limiting, input validation.

---

## Landing Page

- **No Three.js.** The hero mesh is pure CSS (`.ld-orb` + `blur()`), removing a ~1.7 MB
  lazy chunk that was destroying LCP.
- GSAP scroll reveals use `fromTo(..., { immediateRender: false })`. A scrub-less trigger
  that never fires can therefore never leave content stuck at `opacity: 0`.
- Under `prefers-reduced-motion`, GSAP is not initialised at all.

---

## Type Scale

| Role | Size |
|------|------|
| Page title | `clamp(1.5rem, 1.2rem + 1.2vw, 1.875rem)` |
| Section title | `0.9375rem` |
| Body | `0.875rem` |
| Meta | `0.8125rem` |
| Caption | `0.6875rem` (11px — the floor, never below) |

---

## Verification

```bash
ng build          # must pass with no budget warnings
ng test           # 67 specs
```

When adding an icon, verify the name is actually registered — an unregistered name only
logs a console warning and renders nothing:

```bash
# names used in src vs. names in the registry; both sets must match
Select-String -Path (Get-ChildItem src -Recurse -Include *.ts,*.html).FullName -Pattern 'lucide[A-Z][A-Za-z0-9]*' -AllMatches |
  ForEach-Object { $_.Matches.Value } | Sort-Object -Unique
```