# z2Lab OrderEntry — Working Context

## Current Phase
Project is in PRE-PRODUCTION hardening phase.

Focus:
- Clean Architecture enforcement
- Structure cleanup (no breaking changes)
- API consistency
- Security + Auth correctness

---

## Current Task

Goal:
Refine project structure WITHOUT breaking runtime.

Scope:
- Move unused / legacy / experimental files into `_tmp/`
- Keep all active code untouched
- No refactoring of business logic

Already done:
- Legacy folders moved to `_tmp/`
- Auth fixes applied to patient routes
- EnvConfig cleanup partially done

---

## Current Architecture State

Score: ~85% Clean Architecture compliant

Remaining issues:
- 1 legacy route: `/api/patients/[id]/activate`
- Some mixed patterns in routes
- No CI/CD integration yet
- No E2E testing

---

## Next Steps (Short Term)

1. Structure cleanup (safe)
2. Introduce CI (Docker Compose)
3. Introduce CD (Kubernetes)
4. Add E2E testing (Selenium / Playwright later)

---

## Constraints

- NEVER break runtime
- NEVER touch legacy folders:
  - src/lib/
  - src/components/
  - src/app/patient/
  - src/app/order/

- ALWAYS follow CLAUDE.md

---

## Definition of Done (current phase)

- Structure clean
- No dead code in main tree
- CI running
- No architecture violations