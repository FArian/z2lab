---
description: Find Clean Architecture and Clean Code violations across frontend/orderentry/src
---

Scan `frontend/orderentry/src/` for violations of the rules in CLAUDE.md (sections "Clean Architecture" and "Clean Code Rules").

## What to detect

| # | Violation | Where | Pattern |
|---|---|---|---|
| 1 | `process.env` in client/shared code | `src/presentation/**`, `src/shared/**` | `process\.env` |
| 2 | React/Next imports in domain or application | `src/domain/**`, `src/application/**` | `from ["']react["']`, `from ["']next/` |
| 3 | `fetch` or HTTP clients in domain | `src/domain/**` | `\bfetch\(`, `HttpClient`, `axios` |
| 4 | Static `fs`/`path` import at top of file imported by client | any `.ts/.tsx` | `^import .* from ["'](fs\|path)["']` |
| 5 | Imports from `simple/` (dead code) | anywhere | `from ["'].*simple/` |
| 6 | Default exports outside Next.js pages/layouts | not `app/**/page.tsx`, `app/**/layout.tsx` | `^export default ` |
| 7 | Raw `console.log` in `src/infrastructure/**` | `src/infrastructure/**` | `console\.log` |
| 8 | Hardcoded Tailwind colors in new code | `src/**/*.{tsx,ts}` | `bg-(blue\|gray\|red\|green\|yellow)-\d` |
| 9 | German hardcoded in JSX | `src/**/*.tsx` | `>[A-ZÄÖÜ][a-zäöü]{3,}` outside i18n calls — heuristic |
| 10 | `// @ts-ignore` / `as any` / `as unknown` | `src/**/*.{ts,tsx}` | `@ts-ignore`, `as any`, `as unknown` |

## Output

Report findings as a table grouped by violation #:

```
## #1 process.env in client code (3 findings)
- src/presentation/hooks/useFoo.ts:42 — `process.env.SOMETHING`
- ...
```

For each finding include `file_path:line_number` so the user can click to jump.

**Do NOT auto-fix.** Just report.
