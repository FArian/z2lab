---
description: Run lint, type-check, and tests in frontend/orderentry/
---

Run the full quality gate in `frontend/orderentry/`. Execute these in order; stop at the first failure and report the error verbatim:

1. `cd frontend/orderentry && npm run lint`
2. `cd frontend/orderentry && npx tsc --noEmit`
3. `cd frontend/orderentry && npm test`

If all three pass: report **✓ all green** with the test count.
If any step fails: show the failing output and propose a minimal fix. Do NOT auto-fix unless the user confirms.
