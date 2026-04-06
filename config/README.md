# config/ — Shared Configuration

## Status: Placeholder — no runtime logic

## Purpose

This folder will hold shared configuration definitions that are consumed across
multiple packages and services once the monorepo structure is introduced.

## Planned content (Phase 3+)

| File | Purpose |
|---|---|
| `tsconfig.base.json` | Base TypeScript config extended by all packages |
| `eslint.base.mjs` | Shared ESLint rules for packages/ and backend/ |
| `env.schema.json` | Machine-readable schema for all known ENV variables |
| `vitest.base.ts` | Shared Vitest configuration extended by each package |

## Current state

All configuration currently lives inside the frontend app:

| Config | Location |
|---|---|
| TypeScript | `frontend/orderentry/tsconfig.json` |
| ESLint | `frontend/orderentry/eslint.config.mjs` |
| ENV schema | `frontend/orderentry/src/infrastructure/api/controllers/EnvController.ts` |
| Vitest | `frontend/orderentry/vitest.config.ts` |

## Do not add runtime logic here

This folder must never contain code that is imported by the application.
It holds build-time and developer-tooling configuration only.
