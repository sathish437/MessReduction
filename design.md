# Design System — Hostel Mess Reduction & Management

A locked design system for the Mess Reduction & Hostel Management platform. Every screen and component redesign adheres to this specification to ensure a consistent, anti-AI-slop, high-efficiency institutional operating system.

---

## 1. Genre
**`modern-minimal`** (Academic / Institutional Operating System)
- Direct, dense, and tactile.
- No blurry neon gradients, fake card floats, or non-functional decorative blobs.
- Sharp 1px hairline borders (`--color-rule`), balanced whitespace, and high data legibility.

---

## 2. Macrostructure Family

- **Marketing / Public (`/`, `/login`, `/register`, `/hostel-verification`)**: *Minimal Portal Grid* (Clean asymmetric structural layout, institutional notice cards, high-contrast inputs).
- **Student App (`/student-dashboard`, `/dashboard`)**: *Calendar-Led Stepper & Live Quota Dock* (Interactive month grid, active quota balance calculation dock, 4-stage verification timeline).
- **Staff Workbenches (`/warden`, `/deputy`, `/office`)**: *Workbench / Split Command Hub* (High-density sortable data tables, quick-filter chips, split-panel application inspector, sticky bottom batch-action dock).
- **Admin Control Suite (`/admin/*`)**: *Tabular Control Suite* (Dense data-grids, quick-action sidebars, toggle banks, structured JSON audit log viewers).

---

## 3. Color Tokens (OKLCH Precision)

```css
:root {
  /* Paper (Backgrounds) */
  --color-paper:       oklch(0.985 0.005 247); /* #F8FAFC - crisp canvas */
  --color-paper-2:     oklch(0.960 0.010 247); /* #F1F5F9 - card / table header */
  --color-paper-3:     oklch(0.930 0.015 247); /* #E2E8F0 - hover / active card */

  /* Ink (Typography & Icons) */
  --color-ink:         oklch(0.180 0.025 260); /* #0F172A - primary ink */
  --color-ink-2:       oklch(0.420 0.030 255); /* #475569 - secondary / labels */
  --color-ink-3:       oklch(0.600 0.025 255); /* #94A3B8 - tertiary / placeholders */

  /* Structural Dividers */
  --color-rule:        oklch(0.900 0.010 250); /* #E2E8F0 - hairline borders */
  --color-rule-strong: oklch(0.820 0.015 250); /* #CBD5E1 - emphasis borders */

  /* Brand Accent: Royal Cobalt */
  --color-accent:      oklch(0.550 0.200 255); /* #2563EB - primary action */
  --color-accent-hover:oklch(0.480 0.210 255); /* #1D4ED8 */
  --color-accent-ink:  oklch(0.990 0.000 0);   /* #FFFFFF - text on accent */
  --color-accent-subtle: oklch(0.950 0.040 255); /* #EFF6FF - active chip background */

  /* Semantic Status Tokens */
  --color-success:     oklch(0.580 0.170 145); /* #16A34A - Approved */
  --color-success-subtle: oklch(0.960 0.040 145); /* #F0FDF4 */
  --color-warning:     oklch(0.680 0.160 75);  /* #D97706 - Pending / Review */
  --color-warning-subtle: oklch(0.970 0.040 75);  /* #FFFBEB */
  --color-danger:      oklch(0.570 0.210 27);  /* #DC2626 - Rejected */
  --color-danger-subtle: oklch(0.960 0.040 27);  /* #FEF2F2 */
  --color-info:        oklch(0.580 0.160 230); /* #0284C7 - Forwarded */
  --color-info-subtle: oklch(0.960 0.040 230); /* #F0F9FF */

  /* Focus Ring */
  --color-focus:       oklch(0.550 0.200 255);
}

.dark {
  --color-paper:       oklch(0.140 0.020 260); /* #0B0F17 */
  --color-paper-2:     oklch(0.180 0.025 260); /* #111827 */
  --color-paper-3:     oklch(0.240 0.030 260); /* #1F2937 */
  --color-ink:         oklch(0.980 0.005 250); /* #F8FAFC */
  --color-ink-2:       oklch(0.750 0.020 250); /* #CBD5E1 */
  --color-ink-3:       oklch(0.550 0.020 250); /* #64748B */
  --color-rule:        oklch(0.250 0.025 260); /* rgba(255,255,255,0.08) */
  --color-rule-strong: oklch(0.350 0.030 260);
  --color-accent:      oklch(0.620 0.200 255); /* #3B82F6 */
  --color-accent-hover:oklch(0.550 0.200 255);
  --color-accent-subtle: oklch(0.220 0.050 255);
}
```

---

## 4. Typography

- **UI & Display**: `Inter, system-ui, -apple-system, sans-serif`
  - All display headings are **Roman** (`font-style: normal`). No italic emphasis headers.
  - Headings use tight letter-spacing (`tracking-tight` / `-0.02em`).
- **Data & Administrative Mono**: `JetBrains Mono, SF Mono, Consolas, monospace`
  - Applied to Student Roll Numbers, Room IDs, Leave Dates, Verification Codes, and Monetary / Day counts.

---

## 5. 8-State Component Discipline

Every interactive control (Button, Input, Checkbox, Select, Tab) must support all 8 states:
1. `default`
2. `hover`
3. `:focus-visible` (crisp 2px outline with 2px offset, never browser default blue halo)
4. `:active` (subtle `translateY(1px)` tactile depress)
5. `disabled` (`opacity-50 cursor-not-allowed`)
6. `loading` (inline spinner replacing action label, maintaining fixed dimensions)
7. `error` (subtle red hairline border + alert tooltip)
8. `success` (subtle green validation checkmark)

---

## 6. Layout & Spacing

- 4-point spacing scale: `4px (3xs)`, `8px (2xs)`, `12px (xs)`, `16px (sm)`, `24px (md)`, `32px (lg)`, `48px (xl)`.
- Cards: Flat with 1px border (`border border-[var(--color-rule)] rounded-xl bg-[var(--color-paper)]`).
- Tables: Sticky headers with `bg-[var(--color-paper-2)]`, subtle zebra or hover highlight (`hover:bg-[var(--color-paper-2)]`), fixed column widths for dates and statuses.
