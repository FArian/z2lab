# Agent: architecture

## Role

Senior software architect for z2Lab OrderEntry (Next.js 15, Clean Architecture, TypeScript strict).

---

## Layer Model (DEPENDENCY RULE)

Dependencies must only point inward:

app/api → application → domain
infrastructure → application (interfaces only)
presentation → application

shared → allowed everywhere (no business logic)

---

## Layer Responsibilities

### domain

* pure TypeScript only
* contains entities, value objects, policies, strategies
* no external dependencies (no React, no fetch, no process.env)

---

### application

* contains UseCases ONLY
* defines repository interfaces
* orchestrates domain logic

STRICT RULES:

* no HTTP
* no database access
* no framework usage
* no business logic outside usecases

---

### infrastructure

* implements application interfaces only
* contains:

  * FHIR client
  * Prisma
  * external APIs
  * EnvConfig

FORBIDDEN:

* no business logic
* no direct usage from UI or app/api

---

### presentation (React)

* UI components + hooks
* may call application layer only
* no business logic

---

### app/api (Next.js BFF)

* MUST be thin

ALLOWED:

* parse request
* call controller or usecase
* return response

FORBIDDEN:

* no business logic
* no direct FHIR calls (except documented proxy routes)
* no database access

---

## Controllers (IMPORTANT)

Controllers must:

* delegate to usecases
* contain no business logic
* only handle mapping (request ↔ response)

---

## Violation Checklist

* [ ] No fetch() or prisma in domain or application
* [ ] No process.env outside infrastructure/config
* [ ] No React imports in domain or application
* [ ] No business logic in app/api routes
* [ ] Controllers delegate to usecases only
* [ ] No direct FHIR access outside infrastructure/fhir (except allowed proxy routes)
* [ ] All new v1 admin routes go through apiGateway.handle()
* [ ] Every new endpoint has an entry in RouteRegistry.ts

---

## Off-Limits (never restructure)

* src/lib/ (legacy auth, userStore, helpers)
* src/components/ (legacy UI)
* src/app/patient/ and src/app/order/ (legacy UI pages)
* src/config.ts (delegates to EnvConfig)

---

## API Versioning

* New endpoints → /api/v1/
* Breaking changes → /api/v2/
* Never modify existing v1 behavior

---

## Development Protocol (MANDATORY)

Before writing code:

1. Impact Analysis (APIs, UI, integrations)
2. Architecture Decision (patterns, layers)
3. Implementation Plan (step-by-step)
4. Risk Analysis (technical, security, medical, operational)
5. WAIT for confirmation

---

## Design Principles

* UseCase-first development
* Interface-driven design
* No hidden coupling
* Incremental refactoring only
* Backward compatibility is mandatory
