# ExpenseIQ — Landing → Auth → Dashboard (Angular)

Three standalone Angular components that give you the flow you asked for:

**Landing (`/`)** → click "Get started" / "Log in" / "Explore the dashboard"
→ **Auth (`/auth`)** → submit the (dummy) form
→ **Dashboard (`/dashboard`)**, automatically.

No backend is wired up — the auth form accepts anything and routes straight
into the dashboard, exactly as requested. Swap `submit()` in
`auth/auth.component.ts` for your real login/signup call whenever you're ready;
just keep the `this.router.navigate(['/dashboard'])` on success.

## Design

A "ledger, made intelligent" look: ink navy + ledger paper + brass accent,
with a horizontal-rule ledger motif and a red margin tick running through
section dividers. Fraunces for display type, Inter for body, IBM Plex Mono
for every number (amounts, ticker, table figures) so the numbers read like
they're printed in a real ledger.

## Animation

Three GSAP-driven entrance animations, one per screen:

1. **Landing hero** — eyebrow, headline (word by word), subhead, and CTAs
   reveal in sequence, like a line being written into a ledger.
2. **Auth screen** — the ledger side-panel and the form panel slide in from
   opposite sides and meet in the middle, like a ledger book opening.
3. **Dashboard** — stat cards rise in with a stagger, and each headline
   number counts up from zero instead of just appearing.

The hero ticker (scrolling "merchant → category" strip) is a plain CSS
keyframe marquee, not GSAP — no need to spend a tween on something CSS
already does well.

## 1. Install GSAP

```bash
npm install gsap
```

## 2. Copy the files into your project

Copy `landing/`, `auth/`, `dashboard/`, and `styles/` into your `src/app/`
folder (or wherever your feature components live).

## 3. Wire up routing

Merge `app.routes.snippet.ts` into your existing `app.routes.ts`:

```ts
import { LandingComponent } from './landing/landing.component';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent },
  // ...your existing routes
];
```

If your app isn't standalone-component based, drop `standalone: true` and the
`imports: [...]` array from each `@Component` decorator and declare the three
components in an `NgModule` instead — everything else (templates, styles,
GSAP calls) stays the same.

## 4. Fonts

Fonts are pulled in via `@import` at the top of `styles/_tokens.scss`
(Fraunces, Inter, IBM Plex Mono from Google Fonts). If your project blocks
`@import` in component styles or you'd rather load fonts globally, move that
one `@import` line into your root `styles.scss` / `index.html` instead.

## Structure

```
expense-iq-angular/
├── styles/
│   └── _tokens.scss          design tokens (colors, type, radius)
├── landing/
│   ├── landing.component.ts
│   ├── landing.component.html
│   └── landing.component.scss
├── auth/
│   ├── auth.component.ts
│   ├── auth.component.html
│   └── auth.component.scss
├── dashboard/
│   ├── dashboard.component.ts
│   ├── dashboard.component.html
│   └── dashboard.component.scss
└── app.routes.snippet.ts     merge into your existing routes
```

All data (transactions, categories, pricing, trend) is hardcoded dummy data —
replace with real API calls whenever your backend is ready.
