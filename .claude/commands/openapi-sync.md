---
description: Verify all v1 routes are documented in openapi.ts + RouteRegistry + CLAUDE.md
---

Per CLAUDE.md "OpenAPI Synchronization" — every v1 endpoint MUST exist in 4 places. Verify all 4 are in sync.

## Steps

1. **Inventory v1 routes** — list all `frontend/orderentry/src/app/api/v1/**/route.ts` files with their HTTP methods (Glob + Grep for `export async function (GET|POST|PUT|DELETE|PATCH)`).

2. **Check each route is documented in:**
   - [`frontend/orderentry/src/infrastructure/api/openapi.ts`](frontend/orderentry/src/infrastructure/api/openapi.ts) — path + method present
   - [`frontend/orderentry/src/infrastructure/api/gateway/RouteRegistry.ts`](frontend/orderentry/src/infrastructure/api/gateway/RouteRegistry.ts) — entry exists
   - [`CLAUDE.md`](CLAUDE.md) — routes table contains the path

3. **Report as a table:**

   | Route | OpenAPI | RouteRegistry | CLAUDE.md |
   |---|---|---|---|
   | `POST /api/v1/orders/number` | ✅ | ✅ | ✅ |
   | `GET /api/v1/foo` | ❌ | ✅ | ❌ |

4. **Do NOT write fixes.** Only report mismatches and quote the exact missing entries the user would need to add.

5. **Also flag the inverse:** entries in OpenAPI/RouteRegistry/CLAUDE.md that have no implementing route.
