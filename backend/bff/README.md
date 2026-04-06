# backend/bff — Backend for Frontend (BFF)

## Status: Conceptual placeholder — not yet extracted

## What is the BFF?

The Backend-for-Frontend (BFF) is the server-side layer that sits between the
frontend UI and the underlying services (FHIR, Orchestra, database). It handles:

- Session-aware API composition
- FHIR proxying and response shaping
- Auth enforcement (JWT, session cookies)
- Admin operations (users, env, mail, pool)

## Current location

The BFF is currently implemented as Next.js API routes inside the frontend app:

```
frontend/orderentry/src/app/api/
frontend/orderentry/src/infrastructure/api/controllers/
frontend/orderentry/src/infrastructure/api/gateway/
frontend/orderentry/src/infrastructure/api/middleware/
```

All `/api/v1/` routes go through `ApiGateway.handle()` which provides request ID
injection, structured logging, auth enforcement, and error normalisation.

## Future extraction (Phase 4+)

When the system scales beyond a single Next.js deployment, the BFF will be
extracted into a standalone Node.js service in this folder. At that point:

1. A new `package.json` will be added here
2. Controllers and middleware will move from `frontend/orderentry/src/infrastructure/api/`
3. The Next.js app will become a pure UI that calls this service
4. Shared domain/application logic will be consumed from `packages/`

## Do not add code here yet

This folder is a structural placeholder only. No implementation belongs here
until Phase 4 extraction is confirmed and planned.
