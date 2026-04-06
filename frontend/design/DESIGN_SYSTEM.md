[← Project Root](../../README.md)

# 🎨 ZetLab Design System

> Living documentation generated from actual source code.
> Source of truth: `src/app/globals.css` · `src/presentation/ui/` · `src/components/`
> Last updated: 2026-04-03

---

## 📦 Contents

1. [Brand & Logo](#brand--logo)
2. [Color Tokens](#color-tokens)
3. [Typography & Spacing](#typography--spacing)
4. [Layout System](#layout-system)
5. [Navigation](#navigation)
6. [UI Primitives](#ui-primitives) — design system components
7. [Feature Components](#feature-components) — presentation layer
8. [Page Patterns](#page-patterns)
9. [Legacy Components](#legacy-components) ⚠️ migration needed
10. [Usage Rules](#usage-rules)
11. [Anti-Patterns](#anti-patterns)
12. [Checklist](#checklist)

---

## Brand & Logo

**File:** `src/components/ZetLabLogo.tsx`

```typescript
export type ZetLabLogoProps = {
  height?:    number | string;  // default: 80
  className?: string;
  ariaLabel?: string;
  title?:     string;
  iconOnly?:  boolean;          // icon square only, no wordmark
  colors?: {
    blue?:      string;  // triangle — default: "#0A63C9"
    lightBlue?: string;  // diagonal + wordmark — default: "#8DB2E6"
    purple?:    string;  // top bar + period — default: "#A85AAE"
  };
};
```

| Element | Color | Hex |
|---|---|---|
| Triangle (Z base) | Brand blue | `#0A63C9` |
| Diagonal stroke (Z middle) | Brand light blue | `#8DB2E6` |
| Top bar (Z top) | Brand purple | `#A85AAE` |
| Wordmark "etLab" | Brand light blue | `#8DB2E6` |
| Period "." | Brand purple | `#A85AAE` |

> These logo colors are **separate** from the UI token system (`--zt-primary` etc.). Never use `#0A63C9` in UI components — use `--zt-primary` (`#185FA5`).

Header usage: `<Image src="/logo.svg" alt="ZetLab logo" width={28} height={28} />` (static SVG, not the React component).

---

## Color Tokens

All tokens are CSS custom properties defined in `src/app/globals.css` and exposed as Tailwind v4 utility classes via `@theme inline`. Dark theme activates when `:root.dark` is added to `<html>`.

### Primary (ZLZ Blue)

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Base | `--zt-primary` | `#185FA5` | `#4A9AE0` | `bg-zt-primary` / `text-zt-primary` / `border-zt-primary` |
| Light | `--zt-primary-light` | `#E6F1FB` | `#1A3A5C` | `bg-zt-primary-light` |
| Border | `--zt-primary-border` | `#B5D4F4` | `#2A5A8A` | `border-zt-primary-border` |
| Hover | `--zt-primary-hover` | `#0C447C` | `#6AB0F0` | `hover:bg-zt-primary-hover` |

### Success (Green — final results, completed orders)

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Base | `--zt-success` | `#3B6D11` | `#6DB33F` | `bg-zt-success` |
| Light | `--zt-success-light` | `#EAF3DE` | `#1E3A0F` | `bg-zt-success-light` |
| Border | `--zt-success-border` | `#C0DD97` | `#4A7A2A` | `border-zt-success-border` |
| Hover | `--zt-success-hover` | `#2C5209` | `#8ACA5A` | `hover:bg-zt-success-hover` |

### Danger (Red — cancelled, revoked, error states)

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Base | `--zt-danger` | `#C63535` | `#E07070` | `bg-zt-danger` |
| Light | `--zt-danger-light` | `#FDEAEA` | `#3A1515` | `bg-zt-danger-light` |
| Border | `--zt-danger-border` | `#F4AAAA` | `#8A3535` | `border-zt-danger-border` |
| Hover | `--zt-danger-hover` | `#A02828` | `#F09090` | `hover:bg-zt-danger-hover` |

### Warning (Amber — pending, on-hold, draft)

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Text | `--zt-warning-text` | `#854F0B` | `#F0C97A` | `text-zt-warning-text` |
| Background | `--zt-warning-bg` | `#FAEEDA` | `#3A2A05` | `bg-zt-warning-bg` |
| Border | `--zt-warning-border` | `#F0C97A` | `#7A5A15` | `border-zt-warning-border` |

### Critical (Crimson — life-threatening lab values)

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Base | `--zt-critical` | `#8B1A2F` | `#F48AA0` | `bg-zt-critical` |
| Light | `--zt-critical-light` | `#FFF0F3` | `#3A0A14` | `bg-zt-critical-light` |
| Border | `--zt-critical-border` | `#F5BAC9` | `#7A2535` | `border-zt-critical-border` |
| Hover | `--zt-critical-hover` | `#6B1224` | `#F8A8BB` | `hover:bg-zt-critical-hover` |

> **`critical` ≠ `danger`** — `critical` = life-threatening lab result (deeper crimson, highest alarm weight). `danger` = UI error / cancelled state. Never swap.

### Urgent (Orange — STAT / time-critical orders)

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Base | `--zt-urgent` | `#B94E00` | `#F4A070` | `bg-zt-urgent` |
| Light | `--zt-urgent-light` | `#FFF3EC` | `#3A1800` | `bg-zt-urgent-light` |
| Border | `--zt-urgent-border` | `#FFBC95` | `#7A3500` | `border-zt-urgent-border` |
| Hover | `--zt-urgent-hover` | `#8F3C00` | `#F8B888` | `hover:bg-zt-urgent-hover` |

### Info (Teal — preliminary results, active orders)

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Base | `--zt-info` | `#0B6577` | `#60C0D0` | `bg-zt-info` |
| Light | `--zt-info-light` | `#E3F5F8` | `#082530` | `bg-zt-info-light` |
| Border | `--zt-info-border` | `#98D5E0` | `#205A70` | `border-zt-info-border` |
| Hover | `--zt-info-hover` | `#084D5A` | `#80D0E0` | `hover:bg-zt-info-hover` |

### Amended (Violet — corrected/amended lab reports)

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Base | `--zt-amended` | `#5B3DA0` | `#A080E0` | `bg-zt-amended` |
| Light | `--zt-amended-light` | `#F0ECFB` | `#1A0A3A` | `bg-zt-amended-light` |
| Border | `--zt-amended-border` | `#C9B8EF` | `#4A2A7A` | `border-zt-amended-border` |
| Hover | `--zt-amended-hover` | `#422D78` | `#C0A0F8` | `hover:bg-zt-amended-hover` |

### Surface & Layout

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Page background | `--zt-bg-page` | `#f4f5f7` | `#0f1117` | `bg-zt-bg-page` |
| Card background | `--zt-bg-card` | `#ffffff` | `#1a1d27` | `bg-zt-bg-card` |
| Muted background | `--zt-bg-muted` | `#f9fafb` | `#252836` | `bg-zt-bg-muted` |
| Border | `--zt-border` | `#e0e0e0` | `#2e3245` | `border-zt-border` |
| Border strong | `--zt-border-strong` | `#c4c4c4` | `#404560` | `border-zt-border-strong` |
| Topbar bg | `--zt-topbar-bg` | `#ffffff` | `#1a1d27` | `bg-zt-topbar-bg` |
| Topbar border | `--zt-topbar-border` | `#e0e0e0` | `#2e3245` | `border-zt-topbar-border` |
| Topbar height | `--zt-topbar-height` | `52px` | — | `style={{ height: "var(--zt-topbar-height)" }}` |

### Text

| Token | CSS Variable | Light | Dark | Tailwind Class |
|---|---|---|---|---|
| Primary | `--zt-text-primary` | `#1a1a1a` | `#f0f0f0` | `text-zt-text-primary` |
| Secondary | `--zt-text-secondary` | `#555555` | `#a0a0b0` | `text-zt-text-secondary` |
| Tertiary | `--zt-text-tertiary` | `#888888` | `#707080` | `text-zt-text-tertiary` |
| Disabled | `--zt-text-disabled` | `#aaaaaa` | `#505060` | `text-zt-text-disabled` |
| On Primary | `--zt-text-on-primary` | `#ffffff` | — | `text-zt-text-on-primary` |
| On Success | `--zt-text-on-success` | `#ffffff` | — | `text-zt-text-on-success` |
| On Danger | `--zt-text-on-danger` | `#ffffff` | — | `text-zt-text-on-danger` |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--zt-shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | `style={{ boxShadow: "var(--zt-shadow-sm)" }}` |
| `--zt-shadow-md` | `0 2px 8px rgba(0,0,0,0.10)` | — |
| `--zt-shadow-lg` | `0 4px 16px rgba(0,0,0,0.12)` | `shadow-[var(--zt-shadow-lg)]` |

---

## Typography & Spacing

### Fonts

| Token | Value | Use |
|---|---|---|
| `--zt-font-sans` | `system-ui, "Segoe UI", Arial, sans-serif` | Body, labels, UI text |
| `--zt-font-mono` | `ui-monospace, "Cascadia Code", "Consolas", monospace` | Patient IDs, order numbers, HL7 values |

`font-feature-settings: "tnum" 1` — globally applied. Ensures lab value columns stay numerically aligned.

### Border Radius

| Token | Value | Use |
|---|---|---|
| `--zt-radius-sm` | `0.25rem` (4px) | Tags, badges |
| `--zt-radius` | `0.375rem` (6px) | Inputs, buttons |
| `--zt-radius-md` | `0.5rem` (8px) | Cards, dialogs |
| `--zt-radius-lg` | `0.75rem` (12px) | Modals |

### Scale used in actual pages

| Context | Class | Description |
|---|---|---|
| Page title | `text-xl font-medium` | Dashboard `<h1>` |
| Section heading | `text-sm font-medium` | Card titles, section labels |
| Body / rows | `text-[13px]` | Row content, list items |
| Label / meta | `text-xs` or `text-[11px]` | Status pills, dates, hints |
| Section caps | `text-[11px] uppercase tracking-wide` | Sidebar section headers |

### Animation

| Class | Keyframe | Use |
|---|---|---|
| `.zt-dropdown-enter` | Fade-in + `-6px` slide, 140ms cubic-bezier(0.16,1,0.3,1) | Dropdown open |

---

## Layout System

### Full-Page Shell

```
┌─────────────────────────────────────────────┐
│  AppHeader  (height: 52px = --zt-topbar-height)  │
├──────────┬──────────────────────────────────┤
│ AppSidebar│  <main> content area             │
│ (220px)   │  overflow-y-auto                 │
│           │  px-8 py-7                       │
└──────────┴──────────────────────────────────┘
```

Outer wrapper:
```tsx
<div className="flex flex-1 overflow-hidden"
     style={{ height: "calc(100vh - var(--zt-topbar-height))" }}>
  <AppSidebar />
  <main className="flex-1 overflow-y-auto px-8 py-7">
    {/* content */}
  </main>
</div>
```

### AppHeader

**File:** `src/components/AppHeader.tsx`

```
[Logo] [|] [Nav: Patienten · Aufträge · Befunde]  ──────  [Refresh] [UserMenu]
```

- Height: `var(--zt-topbar-height)` (52px)
- Background: `bg-zt-topbar-bg`, border: `border-b border-zt-topbar-border`
- Shadow: `boxShadow: var(--zt-shadow-sm)`
- Max width: `max-w-7xl mx-auto px-3 sm:px-4`

### AppSidebar

**File:** `src/components/AppSidebar.tsx`

- Width: `w-[220px] shrink-0`
- Background: `bg-zt-bg-card border-r border-zt-border`
- Scrollable: `overflow-y-auto`

Section header style: `text-[11px] font-medium text-zt-text-tertiary uppercase tracking-wide px-4 pb-1.5`

### Content Grid Patterns (DashboardPage)

| Pattern | Classes |
|---|---|
| 4-column stats row | `grid grid-cols-4 gap-3` |
| 2fr + 1fr split | `grid grid-cols-[2fr_1fr] gap-4` |
| Equal halves | `grid grid-cols-2 gap-4` |
| 3-col quick actions | `grid grid-cols-3 gap-2.5` |

---

## Navigation

### AppHeaderNav

**File:** `src/components/AppHeaderNav.tsx`

Top navigation links. Active = `bg-zt-primary-light text-zt-primary`. Inactive = `text-zt-text-secondary hover:text-zt-text-primary hover:bg-zt-bg-muted`. Uses `aria-current="page"` on active link.

Routes: `/patient`, `/orders`, `/results`

### Sidebar NavItem

**File:** `src/components/AppSidebar.tsx` — internal `NavItem` component

```
Active:   border-l-2 border-l-zt-primary  bg-zt-primary-light  text-zt-primary  font-medium
Inactive: border-l-2 border-l-transparent text-zt-text-secondary hover:bg-zt-bg-page
```

Optional `badge` prop: number bubble `bg-zt-primary text-zt-text-on-primary rounded-full text-[10px]`.

Admin section only visible when `isAdmin === true` (from `useSession()`).

### Nav sections

| Section | Routes |
|---|---|
| Navigation | `/` (Dashboard), `/patients`, `/orders`, `/results` |
| Account | `/profile` |
| Admin | `/admin/users`, `/admin/roles`, `/admin/fhir`, `/admin/api` |

---

## UI Primitives

Import from the barrel:
```typescript
import { Button, Input, Select, Card, Badge, Spinner, PageLoader,
         SkeletonRows, SkeletonBlock, EmptyState, Avatar,
         Dropdown, DropdownItem, DropdownSeparator, DropdownLabel,
         RoleTagInput, theme } from "@/presentation/ui";
```

---

### Button

**File:** `src/presentation/ui/Button.tsx`

```typescript
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   "primary" | "secondary" | "danger" | "ghost";  // default: "secondary"
  size?:      "sm" | "md" | "lg";                            // default: "md"
  loading?:   boolean;                                        // default: false
  icon?:      ReactNode;
  iconAfter?: boolean;                                        // default: false
}
```

| Variant | Token classes |
|---|---|
| `primary` | `bg-zt-primary text-zt-text-on-primary border-zt-primary hover:bg-zt-primary-hover` |
| `secondary` | `bg-zt-bg-card text-zt-text-primary border-zt-border hover:bg-zt-bg-muted` |
| `danger` | `bg-zt-bg-card text-zt-danger border-zt-danger-border hover:bg-zt-danger-light` |
| `ghost` | `bg-transparent text-zt-text-secondary border-transparent hover:bg-zt-bg-muted` |

| Size | Padding | Font |
|---|---|---|
| `sm` | `px-2.5 py-1` | `text-xs` |
| `md` | `px-3.5 py-1.5` | `text-sm` |
| `lg` | `px-5 py-2.5` | `text-base` |

`loading={true}` → shows `<Spinner />`, disables button.

```tsx
<Button variant="primary" onClick={handleSave}>Speichern</Button>
<Button variant="danger" loading={isDeleting}>Löschen</Button>
<Button variant="ghost" icon="↻" size="sm">Aktualisieren</Button>
```

---

### Spinner

**File:** `src/presentation/ui/Button.tsx`

```typescript
function Spinner({ size?: "sm" | "md" | "lg" })
// sm → h-3.5 w-3.5  |  md → h-5 w-5  |  lg → h-6 w-6
```

`role="status" aria-label="Laden…"`. Standalone or inside Button.

---

### Input

**File:** `src/presentation/ui/Input.tsx`

```typescript
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> {
  label?:   string;
  error?:   string;     // red border + role="alert" message
  hint?:    string;     // shown when no error
  prefix?:  ReactNode;  // left icon, absolute at left-2.5
  suffix?:  ReactNode;  // right icon, absolute at right-2.5
}
```

- `required` → red `*` on label (aria-hidden)
- `aria-invalid` set when error truthy
- Normal: `border-zt-border focus:border-zt-primary focus:ring-zt-primary-border`
- Error: `border-zt-danger focus:border-zt-danger focus:ring-zt-danger-border`

```tsx
<Input label="Name" placeholder="Max Mustermann" required />
<Input prefix="🔍" placeholder="Suchen…" />
<Input label="GLN" error="13 Stellen erforderlich" hint="Format: 7601002145985" />
```

---

### Select

**File:** `src/presentation/ui/Select.tsx`

```typescript
export interface SelectOption { value: string; label: string; }

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:       string;
  error?:       string;
  hint?:        string;
  options:      SelectOption[];  // required
  placeholder?: string;         // first <option value="">
}
```

Custom chevron SVG; `appearance-none` removes native arrow. Same error/focus pattern as Input.

---

### Card

**File:** `src/presentation/ui/Card.tsx`

```typescript
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?:        string;
  subtitle?:     string;
  headerAction?: ReactNode;  // right of header
  noPadding?:    boolean;    // default: false
}
```

Base: `rounded-lg border border-zt-border bg-zt-bg-card shadow-sm`
Header: `border-b border-zt-border px-4 py-3` (rendered only when title/subtitle/headerAction present)
Content: `p-4` (or nothing when `noPadding`)

---

### Badge

**File:** `src/presentation/ui/Badge.tsx`

```typescript
export type BadgeVariant =
  | "neutral" | "info" | "success" | "warning"
  | "danger"  | "critical" | "urgent" | "amended";

export interface BadgeProps {
  label:      string;
  variant?:   BadgeVariant;  // default: "neutral"
  icon?:      string;        // emoji before label
  tooltip?:   string;        // hover panel w-64
  className?: string;
}
```

| Variant | Clinical meaning | Token group |
|---|---|---|
| `neutral` | Registered, unknown | `zt-bg-muted / zt-text-secondary` |
| `info` | Active order, preliminary | `zt-info-*` |
| `success` | Final, completed | `zt-success-*` |
| `warning` | Pending, on-hold, draft | `zt-warning-*` |
| `danger` | Cancelled, revoked, error | `zt-danger-*` |
| `critical` | Life-threatening lab value | `zt-critical-*` |
| `urgent` | STAT / time-critical | `zt-urgent-*` |
| `amended` | Corrected/amended report | `zt-amended-*` |

```tsx
<Badge label="Abgeschlossen" variant="success"  icon="✅" />
<Badge label="Kritisch"      variant="critical" icon="⚠️" tooltip="Sofortmassnahme erforderlich" />
<Badge label="STAT"          variant="urgent"   icon="🚨" />
<Badge label="Korrigiert"    variant="amended"  icon="✏️" />
```

---

### Loader Components

**File:** `src/presentation/ui/Loader.tsx`

```typescript
function SkeletonRows({ columns?: number, rows?: number })      // defaults: 5, 6
function SkeletonBlock({ lines?: number, className?: string })  // default: 3
function PageLoader({ label?: string })                         // default: "Laden…"
```

`SkeletonRows` → inside `<tbody>`. `PageLoader` → `role="status"`, min-height 64px.

---

### EmptyState

**File:** `src/presentation/ui/EmptyState.tsx`

```typescript
export interface EmptyStateProps {
  icon?:        string;     // emoji, text-4xl
  title:        string;     // required
  description?: string;     // max-w-xs
  action?:      ReactNode;
  className?:   string;
}
```

`role="status"`. Centered column, `py-16`.

---

### Avatar

**File:** `src/presentation/ui/Avatar.tsx`

```typescript
export interface AvatarProps {
  username:   string;
  imageUrl?:  string;               // renders <img> instead of initials
  size?:      "sm" | "md" | "lg";  // default: "md"
  className?: string;
}
```

| Size | Dim | Font |
|---|---|---|
| `sm` | `h-6 w-6` | `text-[10px] font-semibold` |
| `md` | `h-8 w-8` | `text-xs font-semibold` |
| `lg` | `h-10 w-10` | `text-sm font-semibold` |

Initials from `[\s._@-]+` split — `hans.muster` → `HM`. Background: `bg-zt-primary text-zt-text-on-primary`.

---

### Dropdown

**File:** `src/presentation/ui/Dropdown.tsx`

```typescript
export interface DropdownProps {
  isOpen:    boolean;
  onClose:   () => void;
  trigger:   ReactNode;
  children:  ReactNode;
  align?:    "left" | "right";  // default: "right"
  minWidth?: number;            // default: 200px
}

export interface DropdownItemProps {
  icon?:     ReactNode;
  children:  ReactNode;
  onClick?:  () => void;
  href?:     string;
  variant?:  "default" | "danger";
  disabled?: boolean;
  type?:     "button" | "submit" | "reset";
}
```

Keyboard: `Escape` closes + returns focus. `Tab` closes. Focus moves to first item on open.
Panel: `role="menu" aria-orientation="vertical"`. Animation: `.zt-dropdown-enter`.

```tsx
<DropdownSeparator />               {/* 1px bg-zt-border, role="separator" */}
<DropdownLabel>Aktionen</DropdownLabel>  {/* uppercase text-tertiary */}
```

---

### RoleTagInput

**File:** `src/presentation/ui/RoleTagInput.tsx`

```typescript
export interface RoleTagInputProps {
  value:        string[];
  onChange:     (roles: string[]) => void;
  catalog:      RoleCatalogEntryDto[];
  label?:       string;
  error?:       string;
  placeholder?: string;  // default: "Rolle suchen oder eingeben…"
}
```

Pills: `bg-zt-primary/10 text-zt-primary border-zt-primary/20 rounded-full`.
`Enter` → adds first match or custom. `Backspace` on empty → removes last tag.

---

### theme (TypeScript token object)

**File:** `src/presentation/ui/theme.ts`

```typescript
import { theme } from "@/presentation/ui";
theme.colors.primary     // → "var(--zt-primary)"
theme.colors.critical    // → "var(--zt-critical)"
```

**Only for Canvas/SVG** where CSS classes cannot be applied. For all JSX use Tailwind `zt-*` classes.

---

## Feature Components

### SearchBar

**File:** `src/presentation/components/SearchBar.tsx`

```typescript
interface SearchBarProps {
  placeholder?: string;   // default: "Suchen…"
  value?:       string;
  onChange:     (value: string) => void;
  debounce?:    number;   // default: 350ms
  className?:   string;
  icon?:        string;   // default: "🔍"
}
```

Built-in debounce. Syncs with external `value` changes (reset from parent). ⚠️ Uses legacy `border-gray-300 focus:ring-blue-300` — not yet migrated to `zt-*` tokens.

---

### PatientCard

**File:** `src/presentation/components/PatientCard.tsx`

```typescript
interface PatientCardProps { id: string; display: string; }
```

Compact patient link → `/patient/{id}`. Renders `—` when both props empty. ⚠️ Uses `text-blue-600` — not yet migrated.

---

### PreviewModal

**File:** `src/presentation/components/PreviewModal.tsx`

```typescript
export type ModalState =
  | { type: "pdf"; data: string; title: string }
  | { type: "hl7"; content: string; title: string }
  | null;
```

`PreviewButtons` — compact action buttons (PDF / HL7). Opens `PreviewModal`.
`PreviewModal` — full-screen overlay (`fixed inset-0 z-50 bg-black/50`).
- PDF: `<iframe>` with download link
- HL7: `<pre className="bg-gray-950 text-green-300 font-mono">` ⚠️ hardcoded colors

---

## Page Patterns

### StatCard (DashboardPage)

Internal component. Not exported.

```
┌─────────────────────────┐
│ Label (text-xs secondary)│
│ 42  (text-2xl primary)   │
│ sub text (11px)          │
└─────────────────────────┘
```

Background: `bg-zt-bg-muted rounded-xl px-4 py-3.5`. Sub-text variant: `default` | `up` (success) | `warn` (warning).

### AlertItem (DashboardPage)

Internal component. Border-left accent pattern:

| Variant | Background | Accent bar |
|---|---|---|
| `warn` | `bg-zt-warning-bg` | `border-l-[#854F0B]` |
| `info` | `bg-zt-primary-light` | `border-l-zt-primary` |
| `success` | `bg-zt-success-light` | `border-l-zt-success` |

### Order Status Pill (DashboardPage)

```typescript
// Used inline in DashboardPage — pattern to follow:
draft:     "bg-zt-warning-bg text-zt-warning-text"
active:    "bg-zt-primary-light text-zt-primary"
completed: "bg-zt-success-light text-zt-success"
default:   "bg-zt-bg-page text-zt-text-secondary"
```

`rounded-full text-[11px] font-medium px-2 py-0.5`

### List Row Pattern (DashboardPage)

Clickable rows with hover + bottom divider:

```tsx
<Link className="flex items-center gap-3 py-2.5 hover:bg-zt-bg-page rounded-lg px-1 -mx-1 transition-colors border-b border-zt-border last:border-b-0">
  <div className="w-8 h-8 rounded-full bg-zt-primary-light flex items-center justify-center text-[11px] font-medium text-zt-primary">
    {initials}
  </div>
  <div className="flex-1 min-w-0">
    <div className="text-[13px] font-medium text-zt-text-primary truncate">{title}</div>
    <div className="text-[11px] text-zt-text-secondary truncate">{subtitle}</div>
  </div>
  <span className="text-[11px] text-zt-text-tertiary shrink-0">{meta}</span>
</Link>
```

---

## Legacy Components

⚠️ These components still use hardcoded Tailwind colors (`gray-*`, `blue-*`, `green-*`). They are in `src/components/` (legacy zone — do not restructure). Migrate tokens incrementally.

| Component | File | Violations |
|---|---|---|
| `DataTable` / `DataTableHeaderCell` | `src/components/Table.tsx` | `text-gray-500`, `bg-white/85`, `divide-gray-200`, `odd:bg-white even:bg-gray-50` |
| `SearchBar` | `src/presentation/components/SearchBar.tsx` | `border-gray-300`, `text-gray-800`, `focus:ring-blue-300` |
| `PatientCard` | `src/presentation/components/PatientCard.tsx` | `text-blue-600`, `text-gray-400` |
| `PreviewModal` / `PreviewButtons` | `src/presentation/components/PreviewModal.tsx` | `bg-gray-950 text-green-300`, `border-rose-300 bg-rose-50`, `border-indigo-300 bg-indigo-50` |

Migration target tokens:

| Legacy class | Target `zt-*` token |
|---|---|
| `text-gray-500` | `text-zt-text-secondary` |
| `text-gray-400` | `text-zt-text-tertiary` |
| `text-gray-800` | `text-zt-text-primary` |
| `border-gray-200` / `divide-gray-200` | `border-zt-border` |
| `bg-white` | `bg-zt-bg-card` |
| `bg-gray-50` | `bg-zt-bg-muted` |
| `text-blue-600` | `text-zt-primary` |
| `focus:ring-blue-300` | `focus:ring-zt-primary-border` |

---

## Usage Rules

1. **Always import from the barrel** — `import { ... } from "@/presentation/ui"` — never from individual files
2. **Never use hardcoded Tailwind colors** — `bg-blue-600`, `text-gray-700`, `border-red-300` forbidden in new code
3. **Never use `style={}` to override Tailwind variants**
4. **Semantic Badge variants** — `critical` ≠ `danger`, `urgent` ≠ `warning`, `amended` for corrections
5. **`theme` only for Canvas/SVG** — where CSS classes are unavailable at runtime
6. **`"use client"` required** on all UI components
7. **Dark mode automatic** — add `.dark` to `<html>`; no component changes needed
8. **Monospace for clinical identifiers** — patient IDs, order numbers, HL7 values → `font-mono`
9. **`--zt-topbar-height`** — always reference the CSS var, never hardcode `52px`
10. **Logo colors are separate** — `#0A63C9` / `#8DB2E6` / `#A85AAE` are brand-only; use `--zt-primary` for UI

---

## Anti-Patterns

| ❌ Wrong | ✅ Correct |
|---|---|
| `className="bg-blue-600 text-white"` | `className="bg-zt-primary text-zt-text-on-primary"` |
| `className="text-red-600"` | `className="text-zt-danger"` |
| `className="text-gray-500"` | `className="text-zt-text-secondary"` |
| `className="bg-gray-50"` | `className="bg-zt-bg-muted"` |
| `style={{ color: "#185FA5" }}` | `className="text-zt-primary"` |
| `style={{ height: "52px" }}` | `style={{ height: "var(--zt-topbar-height)" }}` |
| `<Badge variant="info" label="Kritisch" />` | `<Badge variant="critical" label="Kritisch" />` |
| `<Badge variant="danger" label="STAT" />` | `<Badge variant="urgent" label="STAT" />` |
| `import { Button } from "@/presentation/ui/Button"` | `import { Button } from "@/presentation/ui"` |
| `theme.colors.primary` in JSX className | `"bg-zt-primary"` as Tailwind string |

---

## Checklist

Before submitting any UI change:

- [ ] All colors use `zt-*` tokens (no raw Tailwind color names)
- [ ] No `style={}` overriding Tailwind variants (exception: `var(--zt-*)` references)
- [ ] Badge variant matches clinical/semantic meaning
- [ ] Components imported from `@/presentation/ui` barrel only
- [ ] New UI strings in all 5 language files (`de`, `de-CH`, `en`, `fr`, `it`)
- [ ] Patient IDs / order numbers use `font-mono`
- [ ] Loading states use `SkeletonRows` / `PageLoader`, not custom spinners
- [ ] Page layout uses `AppSidebar` + `<main>` pattern with `--zt-topbar-height`
- [ ] No new hardcoded colors added to legacy components

[⬆ Back to top](#-zetlab-design-system)
