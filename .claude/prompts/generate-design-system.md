# Prompt — Regenerate Design System Documentation

Use this prompt to regenerate `frontend/design/DESIGN_SYSTEM.md` after any UI change.

## When to run

- New component added to `src/presentation/ui/` or `src/components/`
- Component props interface changed
- New CSS token group added to `src/app/globals.css`
- Token value changed (light or dark)
- New page layout pattern introduced
- Legacy component partially migrated to `zt-*` tokens

## Files to read (STEP 1)

### CSS tokens
- `frontend/zetlab/src/app/globals.css`

### Design system barrel
- `frontend/zetlab/src/presentation/ui/index.ts`

### UI primitives (all files exported from barrel)
- `src/presentation/ui/Button.tsx`
- `src/presentation/ui/Input.tsx`
- `src/presentation/ui/Select.tsx`
- `src/presentation/ui/Card.tsx`
- `src/presentation/ui/Badge.tsx`
- `src/presentation/ui/Loader.tsx`
- `src/presentation/ui/EmptyState.tsx`
- `src/presentation/ui/Avatar.tsx`
- `src/presentation/ui/Dropdown.tsx`
- `src/presentation/ui/RoleTagInput.tsx`
- `src/presentation/ui/theme.ts`

### Layout & navigation
- `src/components/AppHeader.tsx`
- `src/components/AppHeaderNav.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/ZetLabLogo.tsx`

### Feature components
- `src/presentation/components/SearchBar.tsx`
- `src/presentation/components/PatientCard.tsx`
- `src/presentation/components/PreviewModal.tsx`

### Page patterns
- `src/presentation/pages/DashboardPage.tsx`

### Legacy (audit only — do not restructure)
- `src/components/Table.tsx`

## What to extract (STEP 2)

- All CSS variable names + exact `#hex` values for `:root` (light) and `:root.dark` (dark)
- All TypeScript `interface` definitions verbatim
- All `const VARIANT_CLASSES` keys (exact variant strings)
- All `as const` size/variant maps
- Layout classes, grid patterns, spacing values used in actual pages
- Legacy component violations: list which classes still use raw Tailwind colors

## How to update (STEP 3)

1. Update "Last updated" date at the top
2. Update any changed color token table rows
3. Add/update component sections for new or modified components
4. Update Legacy Components table when violations are fixed
5. Add new page patterns if new layout patterns are introduced
6. Remove sections for deleted components

## Rules

- Use EXACT TypeScript interfaces from source — no simplifying
- Use EXACT CSS variable names and `#hex` values from `globals.css` — no inventing
- Show diff before writing any file
- Wait for confirmation before writing
