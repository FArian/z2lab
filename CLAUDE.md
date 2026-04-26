# z2Lab OrderEntry

> **Single source of truth** for architecture decisions, conventions, and development rules.
> Every AI assistant and contributor must read and follow this file before making changes.

---

## 🧠 Project Memory

Persistent project knowledge lives in [.claude/memory/](.claude/memory/) — committed to the repo so it travels with the code across machines and contributors.

**At session start, read [.claude/memory/MEMORY.md](.claude/memory/MEMORY.md)** — it indexes:

- Ongoing initiatives and project decisions not yet codified in this file
- Recurring user feedback and collaboration preferences
- External references (Spec locations, dashboards, ticket systems)
- Known repo quirks (e.g. path mismatches, deferred decisions)

When you learn something durable that future sessions need, add a memory file under `.claude/memory/` (frontmatter format: `name`, `description`, `type` ∈ {user, feedback, project, reference}) and link it from `MEMORY.md`. Memory files are short, topic-scoped, and updated when they go stale.

**Do not store memory in `~/.claude/projects/.../memory/`** — that location is per-machine and not shared. The project folder is the only authoritative location.

---

## Engineering Standards (MANDATORY — Pre-Production)

> This system is **not yet in production**. Before first deployment every feature MUST meet
> the standards below. These rules override convenience in every trade-off decision.

### Priority Order

**Stability → Auditability → Safety → Predictability**

This is a medical/laboratory system. These four properties are non-negotiable.

---

### Feature Development Standard (12 Steps — Mandatory Order)

Every new feature MUST follow these steps in order. No step may be skipped or reordered:

1. **Problem Definition** — What problem is being solved and why?
2. **Architecture Decision** — Which patterns apply (Factory, Strategy, Adapter, Gateway)?
3. **Domain Layer** — Pure business rules, no infrastructure dependencies
4. **Application Layer** — Use cases and repository interfaces
5. **Infrastructure Layer** — Providers, adapters, concrete implementations
6. **API Implementation** — `/api/v1/` routes ONLY; no new endpoints under `/api/`
7. **API Gateway Integration** — All admin routes go through `apiGateway.handle()`
8. **OpenAPI / Swagger Update** — Spec updated before or alongside implementation
9. **UI Integration** — Validation, help texts, i18n for all 5 languages
10. **ENV Configuration** — All config via environment variables; no secrets in code
11. **Documentation Update** — README + CLAUDE.md + API UI (all four sync targets)
12. **Testing** — Unit tests (domain/application) + integration/API tests

---

### Impact & Risk Analysis (Before Every Implementation)

Before writing any code, document:

#### Impact Analysis

- Affected APIs (list paths and methods)
- Affected UI components
- Affected integrations (FHIR, HL7, Mail, Orchestra, etc.)
- Backward compatibility assessment

#### Version Rule

| Change type | Action |
|---|---|
| Non-breaking (new field, new endpoint) | Extend `/api/v1/` |
| Breaking (field removal, type change, contract change) | Create `/api/v2/` — never modify v1 |

#### Risk Analysis

For each risk category identify **prevention**, **detection**, and **fallback**:

| Category | Examples |
|---|---|
| Technical | data loss, race condition, migration failure |
| Security | auth bypass, secret exposure, injection |
| Operational | downtime, config drift, deployment failure |
| Medical/business | incorrect lab result, audit gap, nDSG violation |

---

### Release Management (Every Feature)

Every feature must define:

- **Version** — `v1.x.x` (non-breaking) or `v2.x.x` (breaking)
- **Change type** — `feature` / `fix` / `breaking`
- **Deployment target** — Docker / Vercel / both
- **Rollback strategy** — how to revert if deployment fails
- **Migration steps** — DB migrations, ENV changes, data transforms (if any)
- **Release notes** — what changed, impact on operators/users, required actions

---

### Post-Implementation Audit (Every Feature)

After every feature, validate all eight areas before considering the work done:

| Area | Checklist |
|---|---|
| **Architecture** | Clean Architecture respected; domain has no infrastructure imports |
| **API** | All new endpoints under `/api/v1/`; gateway used; no legacy paths added |
| **OpenAPI / Swagger** | Spec fully updated; matches implementation exactly |
| **Documentation** | README updated; CLAUDE.md updated; RouteRegistry updated; API UI updated |
| **Configuration** | All config via ENV; no production defaults baked into code |
| **Security** | No secrets in code; logs never include credentials; auth enforced |
| **Medical compliance** | No external provider defaults; all actions auditable |
| **Deployment** | Docker-compatible; Vercel-compatible; health checks pass |

---

### Global Rules (Non-Negotiable)

- **Never implement without impact analysis** — no exceptions
- **Never change an API contract without versioning** — extend v1 or create v2
- **Never skip OpenAPI/Swagger updates** — spec and implementation are always in sync
- **Never skip documentation updates** — all four sync targets must be updated together
- **Never introduce breaking changes without a new version prefix**
- **Always use API Gateway** as the single entry point for all `/api/v1/` admin routes
- **Always fail-fast on misconfiguration** — no silent fallbacks for required ENV vars

---

### Expected Behavior for Every Request

For every feature request, the response follows this order:

1. Impact Analysis
2. Architecture Decision
3. Implementation Plan
4. Risk Analysis
5. Release Plan
6. **Wait for explicit confirmation before writing any code**

---

## Project Overview

**z2Lab OrderEntry** (z2Lab = ZLZ + ZetLab) is a laboratory order entry system (Auftragserfassung) for a Swiss clinical laboratory group. The product is developed by **ZLZ Zentrallabor AG** (Hauptlabor, [zlz.ch](https://www.zlz.ch)) and operated under the umbrella of **ZetLab AG** (Tochtergesellschaft, [zetlab.ch](https://zetlab.ch)). Clinicians search patients, browse lab test catalogs sourced from a FHIR server, and submit diagnostic orders (ServiceRequests) against those patients.

The UI language is **German** (Swiss context). All user-facing strings, labels, error messages, and breadcrumbs must be in German.

---

## Repository Layout

```
OrderEntry/
├── frontend/
│   └── orderentry/               # Next.js 15.5 app — all frontend code lives here
│       ├── Dockerfile
│       ├── vitest.config.ts
│       ├── vitest.setup.ts
│       ├── jest.config.ts        # legacy — inactive, superseded by vitest.config.ts
│       ├── jest.setup.ts         # legacy — inactive
│       ├── src/
│       │   ├── app/              # Next.js App Router (pages, layouts, API routes)
│       │   ├── domain/           # Pure business rules — NO framework dependencies
│       │   ├── application/      # Use cases, services, repository interfaces
│       │   ├── infrastructure/   # FHIR adapters, HTTP clients, concrete repos
│       │   ├── presentation/     # React hooks, page-level components, design system
│       │   ├── shared/           # Framework-agnostic utilities and config
│       │   ├── components/       # Legacy global components (AppHeader, Table, etc.)
│       │   ├── lib/              # Legacy helpers (auth, fhir.ts, localAuth)
│       │   └── messages/         # i18n JSON files (de, de-CH, en, fr, it)
│       └── tests/
│           ├── unit/             # Fast, no I/O — domain, application, strategies
│           ├── integration/      # Real object graphs, no HTTP mocks — mappers, repos
│           ├── e2e/              # (future) Playwright browser tests
│           └── mocks/            # Shared in-memory repository implementations
├── backend/
│   └── orchestra/                # OIE Juno configuration and FHIR seed resources
│       └── fhir/
│           ├── masterdata/       # ActivityDefinition/SpecimenDefinition/ObservationDefinition bundles
│           │   └── generated/    # Auto-generated by generate_fhir_resources.mjs (4218 tests)
│           ├── MapingCode/       # CodeSystem, ValueSet, ConceptMap (terminology)
│           └── organizations/    # Organization, Location, OrganizationAffiliation, Practitioner JSON
├── devops/
│   └── docker/                   # Production Docker Compose stack
│       ├── docker-compose.yml    # 7 services: traefik, portainer, postgres, hapi, orchestra, orderentry, watchtower
│       ├── .env                  # Environment variables (never commit secrets)
│       └── data/                 # Service config (hapi/application.yaml, prometheus, grafana, traefik)
├── Documentation/
│   └── Installation/
│       ├── Setup-Guide.md        # 7-phase setup guide
│       ├── MasterData/           # Architecture docs (01_Organization … 05_Testkatalog)
│       └── fhir-resources/       # Ready-to-upload FHIR JSON (01_terminologie … 05_testkatalog)
└── simple/                       # DEAD CODE — never import from it, never modify it, never reference it
```

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 15.5 (App Router, Turbopack dev) |
| Language | TypeScript (strict mode) |
| React | 19.1 |
| Styling | Tailwind CSS v4 (PostCSS plugin) |
| Node | 20.x (`.nvmrc`) |
| Testing | Vitest 4 + React Testing Library 16 + jest-dom 6 |
| Linting | ESLint flat config (`next/core-web-vitals` + `next/typescript`) |
| Metrics | prom-client 15 — Prometheus text exposition (`GET /api/metrics`) |
| Tracing | OpenTelemetry (`@opentelemetry/sdk-node`, OTLP/HTTP exporter) — opt-in via `ENABLE_TRACING` |

---

## Commands

All commands run from `frontend/orderentry/`:

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without emitting

npm test             # Run all tests once
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report (thresholds: branches 70%, functions/lines/stmts 80%)
```

> A `predev` / `prebuild` / `prestart` hook runs `scripts/write-version.mjs` which writes `NEXT_PUBLIC_APP_VERSION` into `.env.local` from git metadata.

---

## CI

GitHub Actions (`frontend/orderentry/.github/workflows/ci.yml`) runs on every push and PR:
`npm ci` → `lint` → `tsc --noEmit` → `build`

Tests are not yet added to CI — add `npm test` after the `build` step when ready.

---

## Docker Build

Run from `frontend/orderentry/`:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) \
  --build-arg GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD) \
  --build-arg GIT_COUNT=$(git rev-list --count HEAD) \
  --build-arg NEXT_PUBLIC_LAB_ORG_ID=zlz \
  -t farian/orderentry:v0.1.0 \
  -t farian/orderentry:latest \
  --push \
  -f docker/Dockerfile \
  .
```

**`NEXT_PUBLIC_*` variables are baked into the client bundle at build time** — they cannot be changed via docker-compose environment at runtime for the browser bundle. Always pass them as `--build-arg`. The docker-compose `environment:` section for `NEXT_PUBLIC_*` vars serves only as server-side SSR fallback.

---

## Clean Architecture

### Layer Rules — the ABSOLUTE rules

```
domain ← application ← infrastructure
                     ← presentation
                     ← app (Next.js)
shared ← everything
```

1. **Domain** (`src/domain/`) — pure TypeScript. No React, no `fetch`, no `process.env`. Contains entities, value objects, use cases, and factory interfaces.
2. **Application** (`src/application/`) — orchestrates domain. Defines repository interfaces (`IResultRepository`, `IOrderRepository`). No HTTP, no DOM.
3. **Infrastructure** (`src/infrastructure/`) — implements interfaces. Contains FHIR mappers, HTTP clients, concrete repositories, config (`EnvConfig`). May import `process.env` and Node.js APIs.
4. **Presentation** (`src/presentation/`) — React hooks and feature-level components. Wires domain/application via `ServiceFactory`. Contains the design system (`ui/`).
5. **Shared** (`src/shared/`) — pure utilities and client-safe config. No React, no Node-only APIs.
6. **App** (`src/app/`) — Next.js App Router. Thin wrappers that import from `presentation/`. API routes are FHIR proxies.

**Violation examples (never do these):**
- Importing from `infrastructure/` inside `domain/`
- Calling `fetch` inside a domain use case
- Reading `process.env` inside `presentation/` or `shared/config/`
- Importing React inside `domain/` or `application/`

### Source Layout (detailed)

```
src/
├── domain/
│   ├── entities/
│   │   ├── Result.ts          # ResultStatus union type + Result interface
│   │   └── Order.ts           # OrderStatus union type + Order interface
│   ├── valueObjects/
│   │   ├── OrderNumber.ts     # Immutable, self-validating, equals(), toString()
│   │   └── Identifier.ts      # FHIR system+value, toToken() → "system|value"
│   ├── useCases/
│   │   ├── GetResults.ts      # Delegates to IResultRepository.search()
│   │   ├── SearchResults.ts   # Normalises query (trim, min page 1, max pageSize 100)
│   │   ├── GetOrders.ts       # Delegates to IOrderRepository.list()
│   │   └── CreateOrder.ts     # Delegates to IOrderRepository.create()
│   └── factories/
│       ├── ResultFactory.ts   # create(partial) + createEmpty(overrides)
│       └── OrderFactory.ts    # create(partial) + createDraft(patientId)
│
├── application/
│   ├── interfaces/
│   │   └── repositories/
│   │       ├── IResultRepository.ts   # search(query) + getById(id)
│   │       └── IOrderRepository.ts    # list, getById, create, delete
│   ├── services/
│   │   ├── ResultService.ts   # Orchestrates GetResults + SearchResults
│   │   └── OrderService.ts    # Orchestrates GetOrders + CreateOrder
│   └── strategies/
│       └── PatientSearchStrategy.ts  # PatientIdStrategy, PatientNameStrategy, Selector
│
├── instrumentation.ts         # Next.js 15 OpenTelemetry startup hook (ENABLE_TRACING guard)
│
├── infrastructure/
│   ├── api/
│   │   ├── controllers/
│   │   │   ├── ResultsController.ts   # GET /api/diagnostic-reports
│   │   │   ├── OrdersController.ts    # GET/DELETE /api/service-requests[/{id}]
│   │   │   ├── PatientsController.ts  # GET /api/patients
│   │   │   ├── LaunchController.ts    # POST /api/launch (Orchestra JWT → session)
│   │   │   └── EnvController.ts       # GET/POST /api/env, GET /api/env/schema
│   │   ├── middleware/
│   │   │   └── JwtGuard.ts            # Verifies Orchestra JWT (iss, claims, exp)
│   │   ├── dto/
│   │   │   ├── ResultDto.ts           # ListResultsQueryDto, ResultResponseDto, …
│   │   │   ├── OrderDto.ts            # OrderResponseDto, ListOrdersResponseDto, …
│   │   │   ├── PatientDto.ts          # ListPatientsQueryDto, PatientResponseDto, …
│   │   │   ├── LaunchDto.ts           # LaunchRequestDto, LaunchResponseDto
│   │   │   └── EnvDto.ts              # EnvResponseDto, EnvSchemaEntryDto, EnvSchemaResponseDto
│   │   ├── openapi.ts                 # OpenAPI 3.0 spec (single source of truth)
│   │   └── HttpClient.ts              # Client-side fetch wrapper (get, post, delete)
│   ├── fhir/
│   │   ├── FhirClient.ts      # Server-side FHIR HTTP; instruments via PrometheusService
│   │   ├── FhirTypes.ts       # Shared FHIR types + helpers: FhirBundle<T>, FhirOperationOutcome, buildOperationOutcome(), buildPaginationLinks(), extractPaginationFromBundle()
│   │   ├── DiagnosticReportMapper.ts  # FhirDiagnosticReport → Result
│   │   └── ObservationMapper.ts       # FHIR Observation → Analysis entity
│   ├── logging/
│   │   └── Logger.ts          # Structured JSON logger; createLogger(ctx) factory; getActiveTraceId() via lazy require("@opentelemetry/api"); file logging via lazy require("fs") (server-only guard)
│   ├── metrics/
│   │   └── PrometheusService.ts       # prom-client wrapper; prefix zetlab_; fhir_requests_total + fhir_request_duration_seconds; recordFhirRequest()
│   ├── repositories/
│   │   ├── FhirResultRepository.ts    # IResultRepository via /api/diagnostic-reports
│   │   └── FhirOrderRepository.ts     # IOrderRepository via /api/service-requests
│   ├── config/
│   │   └── EnvConfig.ts       # Server-side env vars (fhirBaseUrl, authSecret, tracingUrl, monitoringUrl, metricsToken, …)
│   └── ServiceFactory.ts      # DI root: resultService(repo?), orderService(repo?)
│
├── presentation/
│   ├── hooks/
│   │   ├── useResults.ts      # search(filters), setPage(n), reload()
│   │   └── useOrders.ts       # list, delete via ServiceFactory
│   ├── components/
│   │   ├── ResultList.tsx     # ResultList, DiagnosticReportStatusBadge, PreviewButtons
│   │   ├── SearchBar.tsx      # Controlled input with internal debounce (350ms default)
│   │   ├── PatientCard.tsx    # Compact patient link → /patient/[id]
│   │   └── PreviewModal.tsx   # ModalState type, PreviewButtons, PreviewModal
│   ├── pages/
│   │   ├── ResultsPage.tsx    # Full CA-wired results page
│   │   └── OrdersPage.tsx     # Full CA-wired orders page
│   └── ui/                    # Design System — see section below
│
├── shared/
│   ├── utils/
│   │   ├── formatDate.ts      # formatDate(date?) → DD.MM.YYYY
│   │   └── base64.ts          # b64toDataUrl(b64, mime), decodeB64Utf8(b64)
│   └── config/
│       └── AppConfig.ts       # Client-safe config (NEXT_PUBLIC_* only)
│
├── app/                       # Next.js App Router
│   ├── page.tsx               # Home (links to /results and /orders)
│   ├── results/               # Results feature entry point
│   │   ├── page.tsx           # → import ResultsPage
│   │   └── layout.tsx         # Sets metadata title
│   ├── orders/page.tsx        # Legacy orders page (intact)
│   ├── patient/               # Patient pages (intact)
│   ├── order/                 # Order entry (intact)
│   └── api/                   # Server-side FHIR proxies
│
├── components/                # Legacy global components (do not restructure)
│   ├── AppHeader.tsx
│   ├── Table/
│   ├── AllergyMenu.tsx
│   └── ZetLabLogo.tsx
│
├── lib/                       # Legacy helpers (do not restructure)
│   ├── auth.ts                # HMAC-SHA256 session cookies
│   ├── userStore.ts           # thin wrapper over PrismaUserRepository (no breaking changes)
│   ├── localAuth.ts           # Browser localStorage auth fallback
│   └── fhir.ts                # fhirGet, fhirPost, Bundle types
│
└── messages/                  # i18n translation files
    ├── de.json
    ├── de-CH.json             # falls back to de.json for missing keys
    ├── en.json
    ├── fr.json
    └── it.json
```

---

## Design Patterns

### Factory Pattern

`ResultFactory` and `OrderFactory` provide safe entity construction:

```typescript
ResultFactory.create(partial)        // safe defaults for every field
ResultFactory.createEmpty(overrides) // alias for create({...overrides})
```

- Every field has a default (`""`, `0`, `null`, `[]`, `"unknown"`)
- `toStatus(raw)` validates against a `VALID_STATUSES` array; unknown values → `"unknown"`
- Non-numeric `resultCount` → `0`
- `basedOn` is always coerced to an array

### Strategy Pattern

`PatientSearchStrategy` determines whether user input is a patient ID or a name:

```typescript
patientSearchSelector.resolve("12345")      // → { patientId: "12345" }
patientSearchSelector.resolve("Müller Hans")// → { patientName: "Müller Hans" }
patientSearchSelector.resolve("")           // → {}
```

- `PatientIdStrategy` matches `/^\d{5,}$/` (5+ digits) and UUID format
- `PatientNameStrategy` is the fallback (always matches)
- UI calls `patientSearchSelector.resolve(input)` — never implement this heuristic inline

### Repository Pattern

All data access goes through interfaces:

```typescript
interface IResultRepository {
  search(query: ResultSearchQuery): Promise<PagedResults>;
  getById(id: string): Promise<Result | null>;
}
```

Never call `fetch` or `HttpClient` directly from hooks or pages. Use a repository.

### Dependency Injection

`ServiceFactory` is the DI root. Inject a mock repository in tests:

```typescript
// Production
const service = ServiceFactory.resultService();

// Tests
const service = ServiceFactory.resultService(new MockResultRepository());
```

### Adapter Pattern

`DiagnosticReportMapper` and `ObservationMapper` translate FHIR resources into domain entities. All FHIR-specific field knowledge is isolated inside these mapper classes. No FHIR field names should appear outside `infrastructure/fhir/`.

---

## Clean Code Rules

1. **DRY** — `formatDate` lives in `shared/utils/formatDate.ts`. `b64toDataUrl` and `decodeB64Utf8` live in `shared/utils/base64.ts`. Never define these inline in page files.
2. **SRP** — one class/module = one responsibility. Factories create entities. Use cases coordinate. Services orchestrate use cases. Hooks manage React state.
3. **No magic values** — all status strings come from union types (`ResultStatus`, `OrderStatus`). No raw `"final"` comparisons outside domain.
4. **Validation at boundaries** — value objects (`OrderNumber`, `Identifier`) throw on invalid input. Do not add defensive checks in callers.
5. **Immutable value objects** — value objects have no setters. Re-create them instead of mutating.
6. **No speculative abstractions** — do not create helpers for code used only once. Prefer three clear lines over a premature utility.
7. **German labels** — all user-visible strings must come from the i18n system (`useTranslations` / `messages/*.json`). Never hardcode German text in JSX.
8. **TypeScript strict** — no `any`, no `as unknown`, no `@ts-ignore`. If the type is hard to express, model it correctly.
9. **No `console.log`** — use `createLogger(ctx)` from `infrastructure/logging/Logger.ts` everywhere inside `infrastructure/`. Remove all raw `console.log` before committing.
10. **No empty catch blocks** — every catch must re-throw, log, or return a typed error. Silent failures are forbidden.
11. **Always `await` Promises** — never leave floating promises. If a Promise is intentionally unawaited, comment why.
12. **`async/await` over Promise chains** — no `.then().catch()` chains. Use `await` and `try/catch`.
13. **No static Node.js built-in imports in shared modules** — never `import fs from "fs"` or `import path from "path"` at the top level of any module that is also imported by client components. Use lazy `require()` inside the function body, guarded by `typeof window !== "undefined"`. Violation causes a Webpack build error (`Module not found: Can't resolve 'fs'`).

### Naming Conventions

13. **Be explicit, no abbreviations** — `user` not `usr`, `calculateResult` not `calcRes`, `orders: Order[]` not `arr`
14. **Boolean naming** — `is`/`has`/`can`/`should` prefix: `isLoading`, `isAdmin`, `hasResults`, `canDelete`
15. **Function naming** — verb + noun: `fetchUserData`, `getPatientList`, `validateOrderNumber`, `buildFhirRequest`
16. **Constants** — `UPPER_SNAKE_CASE` for module-level: `MAX_PAGE_SIZE`, `DEFAULT_STATUS`

### Functions

17. **Max function length: 20 lines** — extract responsibilities into smaller named functions. Each function does ONE thing.
18. **Max parameters: 3** — more than 3 → use an options object (`SearchQuery`, not 4 loose params).
19. **No boolean parameters** — use separate functions: `hardDeleteOrder(id)` / `softDeleteOrder(id)` not `deleteOrder(id, true)`.
20. **Early return — no deep nesting** — max 2 levels. Use guard clauses: `if (!order) return null;`
21. **Pure functions preferred** — domain functions: same input = same output, no side effects. Side effects only in `infrastructure/`.

### React / Components

22. **Max component size: 80 lines** — extract sub-components or move logic into a custom hook.
23. **No logic in JSX** — extract filtered/mapped data into named variables before the return statement.
24. **No anonymous functions in JSX event handlers** — extract as named `handleX` functions.
25. **Custom hooks for all stateful logic** — never put `useState` + `useEffect` + fetch directly in a page. Always extract to `presentation/hooks/`.

### Imports & Exports

26. **No default exports except Next.js pages** — named exports everywhere except `src/app/**/page.tsx` and `src/app/**/layout.tsx`.
27. **Import order** — ESLint-enforced: (1) Node built-ins, (2) external packages, (3) `@/*` aliases, (4) relative. Blank line between groups.
28. **No barrel re-exports in `domain/` or `application/`** — explicit paths only: `@/domain/entities/Result`, never `@/domain`.

### Async / Promises

29. **Parallel fetches with `Promise.all`** — independent async calls must run in parallel, never sequentially with `await`.

---

## Config Architecture

### Server-side — `infrastructure/config/EnvConfig.ts`

Use this for anything that runs in Node.js (API routes, server components, FHIR client):

```typescript
import { EnvConfig } from "@/infrastructure/config/EnvConfig";
EnvConfig.fhirBaseUrl    // ORDERENTRY_FHIR__BASE_URL with fallback
EnvConfig.authSecret     // ORDERENTRY_AUTH__SECRET with fallback
EnvConfig.allowLocalAuth // ORDERENTRY_AUTH__ALLOW_LOCAL (boolean)
```

### Client-side — `shared/config/AppConfig.ts`

Use this for browser code (`"use client"` components, hooks):

```typescript
import { AppConfig } from "@/shared/config/AppConfig";
AppConfig.appVersion        // NEXT_PUBLIC_APP_VERSION
AppConfig.forceLocalAuth    // NEXT_PUBLIC_FORCE_LOCAL_AUTH
AppConfig.defaultPageSize   // 20
AppConfig.searchDebounceMs  // 350
```

**Rule:** Server-only env vars (read via `EnvConfig`) must **never** appear in `shared/` or `presentation/`. Only `NEXT_PUBLIC_*` variables are safe client-side.

`src/config.ts` (legacy) is imported by `lib/fhir.ts` and other legacy routes. It delegates to `EnvConfig` internally — do not add direct `process.env` reads there.

---

## Routing

```
/                  → Home: links to Anfordern (order) and Aufträge (orders list)
/login             → Login page
/signup            → Signup page
/patient           → Patient search list with pagination
/patient/[id]      → Patient detail (demographics + orders)
/order/[id]        → Order entry screen (main workflow)
/orders            → Global orders list (ServiceRequests)
/results           → Global DiagnosticReport results list
/api/docs              → Swagger UI (API documentation)
/api/openapi.json      → OpenAPI 3.0 specification (machine-readable)
/api/application.wadl  → WADL description (XML, for PIS/LDAP connectors)
/admin/users           → Admin: User management (CRUD + FHIR sync)
/admin/api             → Admin: API documentation page (Swagger + connection guide)
/settings/mail         → Admin: Mail server configuration + connection test
```

### API Routes (`src/app/api/`) — all server-side FHIR proxies

| Route | Controller | Purpose |
|---|---|---|
| `GET /api/patients` | `PatientsController.list()` | Patient search (name, pagination, active/all filter); org-scoped for external users |
| `GET /api/patients/[id]` | — (FHIR proxy) | Single patient |
| `GET /api/patients/[id]/service-requests` | — (FHIR proxy) | Orders for a patient |
| `GET /api/patients/[id]/diagnostic-reports` | — (FHIR proxy) | Results for a patient |
| `GET /api/practitioners` | — | Practitioner search for order form; filtered by patient org or user org |
| `GET /api/service-requests` | `OrdersController.list()` | Global orders list; org-scoped for external users |
| `GET /api/service-requests/[id]` | — (FHIR proxy) | Single order |
| `PUT /api/service-requests/[id]` | — (FHIR proxy) | Update order |
| `DELETE /api/service-requests/[id]` | `OrdersController.delete()` | Hard or soft delete |
| `GET /api/diagnostic-reports` | `ResultsController.list()` | DiagnosticReport list (patientId, patientName, orderNumber, status, page) |
| `GET /api/openapi.json` | — | OpenAPI 3.0 spec (JSON) |
| `GET /api/docs` | — | Swagger UI |
| `GET /api/application.wadl` | — | WADL description (XML) |
| `GET /api/users` | `UsersController.list()` | Paginated user list (admin only) |
| `POST /api/users` | `UsersController.create()` | Create user (admin only) |
| `GET /api/users/[id]` | `UsersController.getById()` | Single user (admin only) |
| `PUT /api/users/[id]` | `UsersController.update()` | Update user role/status/profile (admin only) |
| `DELETE /api/users/[id]` | `UsersController.delete()` | Delete user (admin only) |
| `POST /api/users/[id]/sync` | `UsersController.syncToFhir()` | Sync user → FHIR Practitioner (admin only) |
| `POST /api/login` | — | Login |
| `POST /api/signup` | — | Signup |
| `GET /api/me` | — | Current session |
| `POST /api/logout` | — | Logout |
| `POST /api/launch` | `LaunchController.launch()` | Orchestra → OrderEntry session (JWT-secured) |
| `GET /api/env` | `EnvController.get()` | Current ENV values (whitelisted, admin only) |
| `POST /api/env` | `EnvController.set()` | Write `.env.local` (Docker/local only — 405 on Vercel) |
| `GET /api/env/schema` | `EnvController.getSchema()` | Full ENV variable catalog with descriptions (admin only) |
| `GET /api/metrics` | `PrometheusService` | Prometheus text metrics (METRICS_TOKEN or admin auth) |
| `GET /api/admin/mail/status` | `MailController.getStatus()` | Mail config status — no secrets (admin only) |
| `POST /api/admin/mail/test` | `MailController.test()` | SMTP verify + optional test send (admin only) |
| `GET /api/v1/admin/mail/status` | `MailController.getStatus()` | Same — **v1, via ApiGateway** (preferred) |
| `POST /api/v1/admin/mail/test` | `MailController.test()` | Same — **v1, via ApiGateway** (preferred) |
| `POST /api/v1/orders/number` | `NumberPoolController.generateOrderNumber()` | Generate order number (Orchestra → Pool fallback) |
| `GET /api/v1/admin/org-rules` | `OrgRulesController.list()` | List org rules (admin) |
| `POST /api/v1/admin/org-rules` | `OrgRulesController.create()` | Create org rule (admin) |
| `GET /api/v1/admin/org-rules/:id` | `OrgRulesController.getById()` | Get org rule (admin) |
| `PUT /api/v1/admin/org-rules/:id` | `OrgRulesController.update()` | Update org rule (admin) |
| `DELETE /api/v1/admin/org-rules/:id` | `OrgRulesController.delete()` | Delete org rule (admin) |
| `GET /api/v1/admin/number-pool` | `NumberPoolController.listPool()` | List pool numbers + stats (admin) |
| `POST /api/v1/admin/number-pool` | `NumberPoolController.addNumbers()` | Add numbers to pool (admin) |
| `DELETE /api/v1/admin/number-pool/:id` | `NumberPoolController.deleteNumber()` | Delete pool number (admin) |
| `GET /api/v1/admin/number-pool/thresholds` | `NumberPoolController.getThresholds()` | Get pool alert thresholds (admin) |
| `PUT /api/v1/admin/number-pool/thresholds` | `NumberPoolController.updateThresholds()` | Update pool alert thresholds (admin) |
| `GET /api/v1/config/service-types` | — (inline handler) | Active order service types: ENV override → FHIR ActivityDefinition.topic (5-min cache) → fallback (admin) |

---

## Mandantentrennung (Org-Filter-Regel)

Patienten, Aufträge, Befunde und Practitioners werden nach Organisation gefiltert. Die **Route** entscheidet, ob der Filter gesetzt wird — nicht der Controller.

| User-Rolle | Verhalten | Betroffene Routes |
|---|---|---|
| `admin` | Kein Org-Filter — sieht alle Daten | `/api/patients`, `/api/service-requests`, `/api/diagnostic-reports`, `/api/practitioners` |
| `user` mit `orgFhirId` im Profil | Org-Filter aktiv (externer Auftraggeber) | Alle oben genannten |
| `user` ohne Profil-Org | Kein Filter (Fallback) | Alle oben genannten |

**Warum:** Admins (ZLZ/ZetLab-Mitarbeiter) haben ihre eigene Lab-Org im Profil (`orgFhirId: "zlz"`). Das ist kein Mandanten-Filter — sie sollen alle Daten sehen. Nur externe Auftraggeber (Praxen, Spitäler) werden auf ihre Org eingeschränkt.

**Practitioners-Sonderregel:** Der Org-Filter für `/api/practitioners` kommt bevorzugt aus dem Query-Parameter `?orgFhirId=` (= `Patient.managingOrganization` des zu bestellenden Patienten). Das Auftragsformular (`useOrderForm.ts`) setzt diesen Parameter automatisch. Fallback: User-Profil-Org (für externe User ohne Patientenkontext).

### Implementierung

```typescript
// In jeder betroffenen Route (patients, service-requests, diagnostic-reports):
const isInternalUser = sessionUser.role === "admin";
const result = await controller.list({
  ...(!isInternalUser && sessionUser.orgFhirId && { orgFhirId: sessionUser.orgFhirId }),
  ...(!isInternalUser && sessionUser.orgGln    && { orgGln:    sessionUser.orgGln }),
});
```

---

## FHIR Integration

- **Base URL:** `EnvConfig.fhirBaseUrl` (server), `src/config.ts` (legacy)
- **Helper:** `src/lib/fhir.ts` — `fhirGet`, `fhirPost`, typed Bundle/Resource
- **Shared FHIR types:** `src/infrastructure/fhir/FhirTypes.ts` — `FhirBundle<T>`, `FhirOperationOutcome`, `buildOperationOutcome()`, `buildPaginationLinks()`, `extractPaginationFromBundle()`. Import from here for all controller/repository FHIR typing.
- **Content type:** `application/fhir+json` on all requests and responses
- **Cache:** `cache: "no-store"` on all FHIR fetch calls
- **Key resources:** `Patient`, `ServiceRequest`, `DiagnosticReport`, `ActivityDefinition`, `SpecimenDefinition`, `ObservationDefinition`, `ValueSet`, `AllergyIntolerance`
- **DiagnosticReport search params:** `subject=Patient/{id}`, `subject:Patient.name={name}`, `based-on:ServiceRequest.identifier={orderNumber}`, `status={status}`
- **Attachments:** `presentedForm` array; `application/pdf` → `pdfData`/`pdfTitle`, `text/hl7v2+er7` → `hl7Data`/`hl7Title`
- **Dates:** `effectiveDateTime` → `issued` → `meta.lastUpdated` (cascade)

### LIS Catalog — MASTERDATA_fromLIS.xml Field Mapping

Source: `backend/orchestra/fhir/masterdata/MASTERDATA_fromLIS.xml` (4218 entries, all `status=1`)

| XML Field | FHIR Usage | Meaning |
|---|---|---|
| `code` | `ActivityDefinition.code.coding.code` | ZLZ LIS internal test code (e.g. `#AAUG`) — **not** LOINC |
| `specimen_additionalinfo` | `Specimen.type` + barcode | ZLZ LIS material code (e.g. `16`) — **not** SNOMED |
| `specimenname.de` | `Specimen.type.text` | Material display name (German) |
| `shorttext.de` | `ActivityDefinition.code.coding.display` | Test display name (German) |
| `status` | Filter: only `1` = active | Inactive tests (`0`) are excluded from FHIR |
| `moddt` | `ActivityDefinition.date` | Activation date (format: `YYYYMMDD`) |
| `evademecum` | `ActivityDefinition.relatedArtifact` | Public URL to test detail page |

### LIS Barcode Format

**Rule:** `Auftrags-Barcode = Auftragsnummer + " " + specimen_additionalinfo`

```
Auftragsnummer: 7004003000
Material-Code:  16
→ Barcode:      7004003000 16
```

The LIS scanner identifies both order and specimen from this combined barcode. Without correct format, the barcode cannot be scanned. This value must appear in HL7 ORM messages (SPM/OBR segment) and on the Begleitschein PDF.

### Terminology Files

| File | Location | Content |
|---|---|---|
| `CodeSystem_zlz-lis-test-codes.json` | `MapingCode/` | 4218 LIS test codes |
| `CodeSystem_zlz-material-codes.json` | `MapingCode/` | 107 material codes |
| `ConceptMap_zlz-snomed-zu-material.json` | `MapingCode/` | 106 material codes → SNOMED CT (`subsumes`) |
| `ConceptMap_zlz-loinc-zu-lis.json` | `MapingCode/` | LOINC → LIS (stub, 3 entries — needs full mapping table) |

---

## Orchestra Integration (Launch Flow)

Orchestra (OIE Juno) launches OrderEntry by calling a single secured endpoint.
OrderEntry handles **no SOAP** — Orchestra is responsible for all SOAP and
non-FHIR REST communication upstream.

### Entry Point

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/launch` | JWT (Bearer) | Receive context from Orchestra, create session, return redirect URL |

### Request Body

```json
{
  "patientId":      "Patient/p-123",
  "practitionerId": "Practitioner/prac-456",
  "organizationId": "Organization/org-789",
  "token":          "<signed JWT from Orchestra>"
}
```

### JWT Contract

| Field | Value |
|---|---|
| Algorithm | `HS256` |
| Secret env var | `ORCHESTRA_JWT_SECRET` |
| Issuer (`iss`) | `orchestra` |
| Required claims | `sub`, `patientId`, `practitionerId`, `organizationId`, `exp`, `iss` |
| Max expiry (`exp`) | 5 minutes from issuance |

`JwtGuard` rejects tokens where `iss !== "orchestra"`, any required claim is absent,
or `exp` is in the past. All three conditions return `401`.

### Flow

1. Route (`src/app/api/launch/route.ts`) — thin: parse body → delegate to `LaunchController`
2. `LaunchController` — validate token via `JwtGuard`, create session, return `{ redirectUrl }`
3. `JwtGuard` (`src/infrastructure/api/middleware/JwtGuard.ts`) — verifies JWT signature,
   expiry, and required claims (`patientId`, `practitionerId`, `organizationId`)

### Response — success (`200`)

```json
{ "redirectUrl": "/order/new?patientId=Patient%2Fp-123" }
```

### Response — error (RFC 7807 Problem Details)

```json
{
  "type":   "https://tools.ietf.org/html/rfc7807",
  "title":  "Unauthorized",
  "status": 401,
  "detail": "JWT signature invalid or expired"
}
```

### Rules

- **No business logic in the route** — route only parses the request and calls `LaunchController`.
- **JWT validation in `JwtGuard`** — never inline token verification in the route or controller.
- **No SOAP in OrderEntry** — Orchestra translates SOAP → REST before calling `/api/launch`.
- **Session on success** — a standard HMAC-SHA256 session cookie (see Authentication section)
  is set so the user lands on the redirected page already authenticated.
- **RFC 7807 errors** — all error responses from `/api/launch` must use Problem Details shape.

---

## z2Lab Bridge (Local Network Companion)

The **z2Lab Bridge** is the local-network daemon (separate Go binary, planned)
that bridges the cloud (OrderEntry / Orchestra / HAPI) and on-premise systems
in a clinic, practice, or laboratory. It moves HL7 (ADT, ORU) and prints
Begleitscheine + barcode labels locally — without inbound firewall openings.

> **Naming rule (CRITICAL):** „Bridge" in this codebase always refers to the z2Lab
> Bridge product. **Never** confuse it with Claude Code sub-agents under
> `.claude/agents/`. The product was renamed from „ZetLab Local Agent" to
> „z2Lab Bridge" on 2026-04-26 — see `.claude/memory/bridge_naming.md`.

### Architecture principles

| # | Principle | Reason |
|---|---|---|
| 1 | **Cloud does not parse HL7** | OrderEntry is a pure proxy. Orchestra is the only HL7↔FHIR converter. |
| 2 | **Outbound-only** | The Bridge initiates every connection. No port-forwarding, no firewall changes. |
| 3 | **Polling, not push** | The Bridge polls `/api/v1/bridge/jobs` every few seconds. Cloud never opens a connection. |
| 4 | **GLN-routed** | Each Bridge has its own API key → mapped to a FHIR Organization (GS1-GLN). Print jobs are dispatched per clinic. |
| 5 | **No HL7 logic in the Bridge either** | The Bridge transports HL7 files only — it never parses, validates, or rewrites them. |

### Bridge API (cloud-side, implemented)

| Method | Path | Purpose |
|---|---|---|
| `GET`    | `/api/v1/bridge/status` | Connectivity check — Bridge verifies token + HL7-proxy availability |
| `POST`   | `/api/v1/bridge/token` | Issue Bearer token (alias for `/auth/token`) |
| `POST`   | `/api/v1/bridge/register` | Admin: register a new Bridge → returns plaintext API key (shown ONCE) |
| `GET`    | `/api/v1/bridge/jobs` | Bridge polls pending print/ORU jobs (filtered by `orgId`, optional `locationId`) |
| `POST`   | `/api/v1/bridge/jobs` | Create a print job (called automatically by `OrderCreatePage` after submission) |
| `POST`   | `/api/v1/bridge/jobs/{id}/done` | Bridge confirms job completed |
| `GET`    | `/api/v1/admin/bridges` | Admin: list all registered Bridges |
| `PATCH`  | `/api/v1/admin/bridges/{id}` | Admin: revoke a Bridge (status → `revoked`) |
| `DELETE` | `/api/v1/admin/bridges/{id}` | Admin: delete Bridge registration |

### HL7 Proxy (used by the Bridge)

| Method | Path | Direction |
|---|---|---|
| `POST` | `/api/v1/proxy/hl7/inbound` | Bridge → OrderEntry → Orchestra (ADT) |
| `GET`  | `/api/v1/proxy/hl7/outbound` | Orchestra → OrderEntry → Bridge (ORU polling) |

### Routing — orgId + locationId

```
/api/v1/bridge/jobs?orgId=XYZ                  → returns broadcast-only jobs
/api/v1/bridge/jobs?orgId=XYZ&locationId=ABC   → returns location-targeted + broadcast jobs
```

A print job created with `locationId` set is delivered only to Bridges in that
department; without `locationId` it is broadcast to all Bridges of the org.

### File map (cloud-side)

| Layer | Files |
|---|---|
| Domain | `domain/entities/BridgeJob.ts` |
| Application | `application/interfaces/repositories/IBridgeJobRepository.ts`, `IBridgeRegistrationRepository.ts` |
| Infrastructure — Prisma | `infrastructure/repositories/PrismaBridgeJobRepository.ts`, `PrismaBridgeRegistrationRepository.ts` |
| Infrastructure — Controllers | `infrastructure/api/controllers/BridgeJobController.ts` (incl. ZPL generator), `BridgeRegistrationController.ts` |
| Infrastructure — DTOs | `infrastructure/api/dto/BridgeJobDto.ts`, `BridgeRegistrationDto.ts` |
| Routes | `app/api/v1/bridge/{status,token,jobs,register}/`, `app/api/v1/admin/bridges/` |
| UI | `app/admin/bridges/page.tsx` → `presentation/pages/BridgesPage.tsx` |
| DB Schema | `prisma/schema.prisma` (models `BridgeJob`, `BridgeRegistration`) |
| DB Migrations | `flyway/migrations/{sqlite,postgresql,sqlserver}/V3__create_bridge_jobs.sql`, `V8__create_bridge_registrations.sql` (sqlite only) |

### Architecture spec (full)

[`Documentation/Bridge/README.md`](Documentation/Bridge/README.md) — 600+ lines covering data flows,
deployment models (Cloud-only / Bridge-Standard / Hybrid), ENV variables
(`BRIDGE_*` namespace), Go package selection, security, resilience, audit log.

### Rules

- **New endpoint paths use `bridge/`, never `agent/`.** The old folders no longer exist.
- **Never let the Bridge parse HL7.** The Bridge writes/reads files; Orchestra parses.
- **Never bake auth into the Bridge code.** API keys are issued via `POST /api/v1/bridge/register` (admin-only) and stored as bcrypt hashes server-side.
- **Print jobs are auto-created** in `OrderCreatePage.tsx` after order submission — fire-and-forget; failure falls back silently to browser print.
- **ZPL format** — barcode is `{orderNumber} {materialCode}` (CODE128) — required by the LIS scanner. Do not change without LIS coordination.
- **DB nuke history (2026-04-26):** During the rename refactor, the local SQLite
  DB was deleted (Option B — clean migration history, no `Agent*` traces).
  Run `npm run db:migrate:sqlite` after pulling these changes to recreate it.

---

## Authentication

Dual auth system:

1. **Server-side (primary):** HMAC-SHA256 signed session cookies (`src/lib/auth.ts`), user store via `src/lib/userStore.ts` → `PrismaUserRepository` (SQLite default, switchable to PostgreSQL/MSSQL via `DB_PROVIDER`), `crypto.scrypt` for password hashing.
2. **Client-side fallback:** localStorage-based auth (`src/lib/localAuth.ts`) with browser SHA-256 hashing, enabled by `NEXT_PUBLIC_FORCE_LOCAL_AUTH` and `ALLOW_LOCAL_AUTH`.

Session secret via `ORDERENTRY_AUTH__SECRET` env var (default: `"dev-secret-change-me"` — change in production).

---

## Design System (`src/presentation/ui/`)

See [frontend/design/DESIGN_SYSTEM.md](frontend/design/DESIGN_SYSTEM.md) for the full living documentation (color token tables with light/dark values, component interfaces, usage examples, anti-patterns, checklist).

To regenerate after component changes: use the prompt in [.claude/prompts/generate-design-system.md](.claude/prompts/generate-design-system.md).

### Components

All components are Tailwind-only, accessible (ARIA labels, `aria-invalid`, `htmlFor`), and export from `src/presentation/ui/index.ts`.

| Component | Key Props / Notes |
|---|---|
| `Button` | `variant`: primary/secondary/danger/ghost; `size`: sm/md/lg; `loading` state with inline `Spinner` |
| `Input` | `label`, `error` (aria-invalid), `hint`, `prefix`/`suffix` icons |
| `Select` | `SelectOption[]`, `placeholder`, `label`, `error`, `hint` |
| `Card` | `title`, `subtitle`, `headerAction` slot, `noPadding` flag |
| `Badge` | 8 semantic variants: neutral/info/success/warning/danger/critical/urgent/amended; `icon`, hover `tooltip` |
| `Loader` | `SkeletonRows` (table placeholders), `SkeletonBlock` (text), `PageLoader` (centered spinner) |
| `EmptyState` | `icon`, `title`, `description`, action slot; `role="status"` |
| `Spinner` | Re-exported from `Button.tsx` |
| `Avatar` | `username` (auto-initials), `imageUrl`, `size`: sm/md/lg |
| `Dropdown` | `trigger`, `isOpen`, `onClose`, `align`: left/right; includes `DropdownItem`, `DropdownSeparator`, `DropdownLabel` |
| `RoleTagInput` | Tag-based multi-select for PractitionerRoles; filters catalog by code/display |

Import from the barrel: `import { Button, Badge, Card } from "@/presentation/ui";`

### Theme System

All colors are defined as CSS custom properties in `src/app/globals.css` and exposed as
Tailwind v4 utilities via `@theme inline`. There are **no hardcoded hex values** in any component.

| Token group | CSS var prefix | Tailwind class example |
|---|---|---|
| Primary (ZLZ blue) | `--zt-primary*` | `bg-zt-primary`, `text-zt-primary`, `border-zt-primary-border` |
| Success (green) | `--zt-success*` | `bg-zt-success`, `bg-zt-success-light`, `border-zt-success-border` |
| Danger (red) | `--zt-danger*` | `bg-zt-danger`, `bg-zt-danger-light`, `border-zt-danger-border` |
| Warning (amber) | `--zt-warning*` | `bg-zt-warning-bg`, `text-zt-warning-text` |
| Critical (crimson) | `--zt-critical*` | `bg-zt-critical-light`, `text-zt-critical`, `border-zt-critical-border` |
| Urgent (orange) | `--zt-urgent*` | `bg-zt-urgent-light`, `text-zt-urgent`, `border-zt-urgent-border` |
| Info (teal) | `--zt-info*` | `bg-zt-info-light`, `text-zt-info`, `border-zt-info-border` |
| Amended (violet) | `--zt-amended*` | `bg-zt-amended-light`, `text-zt-amended`, `border-zt-amended-border` |
| Surface | `--zt-bg-*` | `bg-zt-bg-page`, `bg-zt-bg-card`, `bg-zt-bg-muted` |
| Border | `--zt-border*` | `border-zt-border`, `border-zt-border-strong` |
| Text | `--zt-text-*` | `text-zt-text-primary`, `text-zt-text-secondary`, `text-zt-text-tertiary` |
| Topbar | `--zt-topbar-*` | `bg-zt-topbar-bg`, `border-zt-topbar-border` |

**Rules:**
- Never use hardcoded Tailwind color names (`bg-blue-600`, `text-gray-700`) in new code — always use `zt-*` token classes.
- `critical` ≠ `danger`: `critical` = life-threatening lab value (crimson); `danger` = cancelled/error state. Never swap.
- `urgent` = STAT/time-critical orders; `warning` = pending/on-hold. Never swap.
- Dark theme is ready: adding `.dark` to `<html>` activates `:root.dark` overrides — no component changes needed.
- TypeScript token object: `import { theme } from "@/presentation/ui"` — use only for canvas/SVG that cannot use CSS classes.

**Usage rules:**
- Use design system components in all new UI code.
- Never override Tailwind variants with inline `style={}`.
- Do not add one-off wrapper components for single use cases.

---

## i18n

- 5 languages: `de` (primary), `de-CH`, `en`, `fr`, `it`
- Files in `src/messages/*.json`
- `de-CH` falls back to `de` for missing keys (configured in `localesConfig.ts`)
- Access via `useTranslations(namespace)` hook (Next-intl or equivalent)
- Key namespaces: `nav`, `home`, `patient`, `orders`, `results`, `befunde`, `order`, `auth`, `common`
- All new UI must add keys to **all 5** language files simultaneously (`de`, `de-CH`, `en`, `fr`, `it`)
- Key format: `namespace.camelCaseKey` (e.g., `results.noResults`)

---

## Testing

See [.claude/TESTING_GUIDE.md](.claude/TESTING_GUIDE.md) for the full testing guide.

Quick reference:
- Runner: Vitest (not Jest)
- Unit tests: `tests/unit/` — no I/O, no HTTP
- Integration tests: `tests/integration/` — real objects, `vi.fn()` as fetchFn
- Coverage: branches 70%, functions/lines/stmts 80%

---

## Key Patterns (App Router)

- **`"use client"`** — required on all interactive pages and hooks
- **`export const dynamic = "force-dynamic"`** — on root layout; disables static optimization
- **Date formatting** — `formatDate()` from `shared/utils/formatDate.ts` → `DD.MM.YYYY`; no date libraries
- **Path alias** — `@/*` → `./src/*`
- **No external state management** — `useState` / `useEffect` throughout; `useResults` / `useOrders` for domain data
- **Skeleton loading** — `SkeletonRows` from design system; show during data fetch
- **Debounce** — `SearchBar` debounces 350ms by default; never add redundant debounce in hooks

---

## Environment Variables

### Frontend (`frontend/orderentry/`)

**Naming convention:** `<APP_NAME>_<SERVICE>__<KEY>` (default prefix: `ORDERENTRY`).
Set `APP_NAME=YOURAPP` once to rename every variable automatically.

**Framework exceptions (cannot be renamed):** `NEXT_PUBLIC_*` (Next.js), `DATABASE_URL` (Prisma), `NODE_ENV` (Node.js).

| Variable | Side | Purpose |
|---|---|---|
| `APP_NAME` | Server | App prefix for all namespaced variables (default: `ORDERENTRY`) |
| `ORDERENTRY_AUTH__SECRET` | Server | HMAC signing key for session cookies (≥32 chars in production) |
| `ORDERENTRY_AUTH__ALLOW_LOCAL` | Server | Allow `localSession` cookie (browser-only auth fallback) |
| `ORDERENTRY_AUTH__SESSION_IDLE_TIMEOUT` | Server | Auto-logout after inactivity in minutes (0 = disabled) |
| `ORDERENTRY_FHIR__BASE_URL` | Server | FHIR R4 server base URL |
| `ORDERENTRY_FHIR__AUTH_TYPE` | Server | Outbound FHIR auth: `none` \| `bearer` \| `basic` \| `apiKey` \| `oauth2` \| `digest` |
| `ORDERENTRY_FHIR__SYSTEM_GLN` | Server | FHIR system URI for GS1 GLN identifiers |
| `ORDERENTRY_FHIR__SYSTEM_AHV` | Server | FHIR system URI for Swiss AHV/AVS SSN |
| `ORDERENTRY_FHIR__SYSTEM_VEKA` | Server | FHIR system URI for Swiss VeKa card number |
| `ORDERENTRY_FHIR__SYSTEM_ZSR` | Server | FHIR system URI for santésuisse ZSR |
| `ORDERENTRY_FHIR__SYSTEM_UID` | Server | FHIR system URI for Swiss UID / CHE-number |
| `ORDERENTRY_FHIR__SYSTEM_BUR` | Server | FHIR system URI for Swiss BUR (BFS) |
| `ORDERENTRY_FHIR__SYSTEM_CATEGORY` | Server | FHIR system URI for `ActivityDefinition.topic` service-category codings |
| `ORDERENTRY_ORCHESTRA__JWT_SECRET` | Server | Shared HS256 secret for `/api/launch` JWT validation from Orchestra |
| `ORDERENTRY_ORCHESTRA__HL7_BASE` | Server | Orchestra HL7 API base URL. Empty = HL7 proxy disabled |
| `ORDERENTRY_ORCHESTRA__ORDER_API_URL` | Server | Orchestra order number API URL. Empty = pool fallback only |
| `ORDERENTRY_ORCHESTRA__ORDER_TIMEOUT_MS` | Server | HTTP timeout for Orchestra order number requests in ms (default: `3000`) |
| `ORDERENTRY_DB__PROVIDER` | Server | Database engine: `sqlite` (default) \| `postgresql` \| `sqlserver` |
| `DATABASE_URL` | Server | DB connection string — Prisma reads this name directly (cannot rename) |
| `BOOTSTRAP_ADMIN_USER` | Server | Admin username on first boot (legacy — read by `src/lib/userStore.ts`) |
| `BOOTSTRAP_ADMIN_PASSWORD` | Server | Admin password on first boot — change immediately (legacy) |
| `ORDERENTRY_LOG__LEVEL` | Server | `debug` \| `info` \| `warn` \| `error` \| `silent` (default: `info`) |
| `ORDERENTRY_LOG__FILE` | Server | Absolute path for persistent log file. Empty = console only |
| `ORDERENTRY_TRACING__ENABLED` | Server | Set `true` to activate OpenTelemetry distributed tracing (default: `false`) |
| `ORDERENTRY_TRACING__URL` | Server | OTLP/HTTP collector base URL (e.g. `http://jaeger:4318`). Required when tracing enabled |
| `ORDERENTRY_TRACING__LABEL` | Server | Display name for tracing system (e.g. `Jaeger`, `Tempo`) |
| `ORDERENTRY_MONITORING__URL` | Server | Monitoring dashboard URL shown in Settings (display-only link) |
| `ORDERENTRY_MONITORING__LABEL` | Server | Display name for monitoring system (e.g. `Grafana`, `Prometheus`) |
| `ORDERENTRY_METRICS__TOKEN` | Server | Static Bearer token for Prometheus scraper at `GET /api/metrics`. If unset, admin auth is used |
| `ORDERENTRY_SASIS__API_BASE` | Server | SASIS/OFAC VeKa card lookup API base URL (via Orchestra). Empty = disabled |
| `ORDERENTRY_REFDATA__SOAP_URL` | Server | RefData SOAP endpoint for GLN partner lookups |
| `ORDERENTRY_ORDER__SERVICE_TYPES` | Server | Comma-separated override for active service types. Empty = FHIR auto-discovery |
| `ORDERENTRY_ORDER__MI_PREFIX` | Server | Prefix for MIBI order numbers (default: `MI`) |
| `ORDERENTRY_ORDER__MI_START` | Server | Starting digit after prefix for MIBI numbers (default: `4`) |
| `ORDERENTRY_ORDER__MI_LENGTH` | Server | Total length of MIBI number including prefix (default: `10`) |
| `ORDERENTRY_ORDER__ROUTINE_LENGTH` | Server | Total digit count for ROUTINE order numbers (default: `10`) |
| `ORDERENTRY_ORDER__POC_PREFIX` | Server | Prefix for POC order numbers (default: `PO`) |
| `ORDERENTRY_ORDER__POC_LENGTH` | Server | Total length of POC number including prefix (default: `7`) |
| `ORDERENTRY_POOL__INFO_THRESHOLD` | Server | Pool size for Info email alert (default: `30`) |
| `ORDERENTRY_POOL__WARN_THRESHOLD` | Server | Pool size for Warn email alert (default: `15`) |
| `ORDERENTRY_POOL__ERROR_THRESHOLD` | Server | Pool size for Error email alert (default: `5`) |
| `ORDERENTRY_POOL__NOTIFICATION_EMAIL` | Server | Recipient email for pool threshold alerts |
| `NEXT_PUBLIC_APP_VERSION` | Client | Auto-generated by `write-version.mjs` |
| `NEXT_PUBLIC_FORCE_LOCAL_AUTH` | Client | Force browser-only auth |
| `NEXT_PUBLIC_SASIS_ENABLED` | Client | Feature flag: SASIS insurance lookup UI |
| `NEXT_PUBLIC_GLN_ENABLED` | Client | Feature flag: GLN lookup UI |
| `NEXT_PUBLIC_LAB_ORG_ID` | Client | GLN of the lab for FHIR catalog filter (default: `7601009336904`). Pass as Docker `--build-arg`. |
| `NEXT_PUBLIC_LAB_NAME` | Client | Display name of the laboratory (e.g. `ZLZ Zentrallabor AG`). Pass as Docker `--build-arg`. |
| `NEXT_PUBLIC_ORDER_SERVICE_TYPES` | Client | Comma-separated service types as initial UI default. Updated at runtime via `/api/v1/config/service-types`. Pass as Docker `--build-arg`. |

### Backend (`infrastructure/docker/.env`)

| Variable | Purpose |
|---|---|
| `BASE_DOMAIN` | Base domain — all service domains are derived from it (e.g. `z2lab.ddns.net`) |
| `TRAEFIK_DOMAIN` | Traefik dashboard domain |
| `HAPI_DOMAIN` | HAPI FHIR domain |
| `ORCHESTRA_DOMAIN` | Orchestra Monitor UI domain |
| `ORCHESTRA_API_DOMAIN` | Orchestra API domain |
| `ORDERENTRY_DOMAIN` | OrderEntry app domain |
| `PORTAINER_DOMAIN` | Portainer domain |
| `ACME_EMAIL` | Email for Let's Encrypt certificate expiry notifications |
| `TRAEFIK_AUTH` | BasicAuth for Traefik dashboard. Generate: `htpasswd -nB admin \| sed 's/\$/\$\$/g'` |
| `ORDERENTRY_AUTH__SECRET` | Session cookie signing key — generate: `openssl rand -hex 32` |
| `ORDERENTRY_AUTH__ALLOW_LOCAL` | Enable browser-only auth fallback (default: `false`) |
| `ORDERENTRY_FHIR__BASE_URL` | Internal Docker URL to HAPI FHIR (e.g. `http://hapi-fhir:8080/fhir`) |
| `POSTGRES_DB` | PostgreSQL database name for HAPI FHIR |
| `POSTGRES_USER` | PostgreSQL user |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `ORCHESTRA_RT_DB_USER` | OIE Juno runtime Derby DB user (encrypted token) |
| `ORCHESTRA_RT_DB_PASSWORD` | OIE Juno runtime Derby DB password (encrypted token) |
| `ORCHESTRA_AR_DB_USER` | OIE Juno archive Derby DB user (encrypted token) |
| `ORCHESTRA_AR_DB_PASSWORD` | OIE Juno archive Derby DB password (encrypted token) |
| `ORDERENTRY_SASIS__API_BASE` | SASIS/OFAC insurance card lookup API via Orchestra |
| `NEXT_PUBLIC_SASIS_ENABLED` | `true` to show VeKa card lookup in UI |
| `NEXT_PUBLIC_GLN_ENABLED` | `true` to show GLN lookup in UI |
| `NEXT_PUBLIC_LAB_ORG_ID` | GLN for FHIR catalog filter (default: `7601009336904`). Pass as `--build-arg` |
| `NEXT_PUBLIC_LAB_NAME` | Display name of laboratory (e.g. `ZLZ Zentrallabor AG`). Pass as `--build-arg` |
| `ORDERENTRY_ORCHESTRA__JWT_SECRET` | Shared HS256 secret for `/api/launch` JWT validation. Generate: `openssl rand -hex 32` |
| `ORDERENTRY_LOG__LEVEL` | Log level: `debug` \| `info` \| `warn` \| `error` \| `silent` (default: `info`) |
| `ORDERENTRY_LOG__FILE` | Absolute path for persistent log file in container (default: `/app/logs/zetlab.log`) |
| `ORDERENTRY_TRACING__ENABLED` | Set `true` to activate OpenTelemetry distributed tracing (default: `false`) |
| `ORDERENTRY_TRACING__URL` | OTLP/HTTP collector base URL (e.g. `http://jaeger:4318`). Required when tracing enabled. |
| `ORDERENTRY_MONITORING__URL` | Monitoring dashboard URL displayed in Settings. Display-only link. |
| `ORDERENTRY_MONITORING__LABEL` | Display name for monitoring system (e.g. `Grafana`). |
| `ORDERENTRY_TRACING__LABEL` | Display name for tracing system (e.g. `Jaeger`, `Tempo`). |
| `ORDERENTRY_METRICS__TOKEN` | Bearer token for Prometheus scraper (`GET /api/metrics`). Generate: `openssl rand -hex 32` |
| `ORDERENTRY_DB__PROVIDER` | Database engine: `sqlite` (default) \| `postgresql` \| `sqlserver` |
| `DATABASE_URL` | OrderEntry DB connection string — Prisma reads this name directly |
| `BOOTSTRAP_ADMIN_USER` | Admin username on first boot (legacy — `src/lib/userStore.ts`) |
| `BOOTSTRAP_ADMIN_PASSWORD` | Admin password on first boot — change immediately after login (legacy) |
| `UID` / `GID` | Optional — run containers as non-root user |

---

## Environment Configuration

### Runtime behaviour

- Environment variables are **loaded once at process startup** — neither Next.js nor Node.js re-reads them while the process is running.
- Editing `.env.local` via the Settings GUI writes the file to disk immediately, but the running process is **not affected** until it is restarted.
- **No hot-reload of environment variables is implemented or planned.**

### Docker specifics

- In Docker, environment variables are injected at container startup (via `docker-compose.yml` or `--env-file`).
- `.env.local` is bind-mounted or baked into the image depending on the deployment mode; in either case a **container restart** is required for changes to take effect.
- Never attempt to `exec` into a running container to patch env vars — restart the container instead.

### Cross-environment compatibility (Vercel + Docker)

The application MUST remain compatible with both Vercel (serverless) and Docker (container). These constraints are enforced in `EnvController.ts`:

| Operation | Vercel | Docker / local dev |
|---|---|---|
| `GET /api/env` | Reads `process.env` — always correct | Reads `process.env` — always correct |
| `POST /api/env` | Returns `405` — filesystem is read-only | Writes `.env.local` to disk |

**Rules (never break these):**

- `GET /api/env` MUST read from `process.env`, **never** parse `.env.local` at runtime.
  `process.env` is the authoritative source in all environments: Vercel injects vars via
  its dashboard; Docker via `docker-compose`; local dev via Next.js startup merge.
- `POST /api/env` MUST check `process.env.VERCEL` and return `405` if truthy.
  On Vercel, vars are immutable at runtime and must be managed via the Vercel dashboard.
- The UI MUST detect a `405` response and switch to a read-only informational view.
  The Save button and edit inputs are hidden; a blue info banner is shown instead.
- `fs` (Node.js filesystem API) is only called in the POST path, which is already
  guarded by the Vercel check — safe for serverless bundling.

### GUI editing (`GET /api/env`, `POST /api/env`)

- Only a **whitelisted subset** of variables is exposed or writable via the API (see `EnvController.ts`).
- Secrets (`AUTH_SECRET`, anything matching `SECRET`, `PASSWORD`, `TOKEN`, `PRIVATE`) are **never** returned or modified by the API.
- After a successful POST the UI shows: *"Changes saved. Please restart the application or container to apply them."*
- A persistent amber warning banner is always visible in the env editor (Docker/local).
- On Vercel a blue info banner replaces the editor: *"Not available in this environment."*

### Adding a new editable variable

1. Add `envKey("SERVICE__KEY")` to `ALLOWED_SERVER_KEYS` in `src/infrastructure/api/controllers/EnvController.ts`.
2. Add the variable to `ENV_SCHEMA` in the same file using `envKey("SERVICE__KEY")` as the `key` field.
3. Add the corresponding `EnvConfig` getter in `src/infrastructure/config/EnvConfig.ts` using `env("SERVICE__KEY")`.
4. Document it in the **Environment Variables** reference table above.
5. Verify it does not match any `BLOCKED_PATTERNS` (SECRET, PASSWORD, TOKEN, PRIVATE).

> **Note — `ORDERENTRY_ORCHESTRA__JWT_SECRET`:** Already present in `EnvConfig` as `orchestraJwtSecret`.
> It must **not** be in `ALLOWED_SERVER_KEYS` — matches `BLOCKED_PATTERNS` (`SECRET`) and must never
> be exposed or modified via the env editor API.

### Runtime Config Override Layer (`GET /api/config`, `POST /api/config`)

A three-tier priority chain for GUI-editable config — distinct from the `.env`/`.env.local` layer:

```
const value = configOverride[key] ?? process.env[key] ?? DEFAULT[key]
```

- Overrides are stored in `data/config.json` (gitignored; writable in Docker / local dev).
- Changes take effect **immediately** on the next request — **no restart required**.
- Supported keys: `FHIR_BASE_URL`, `LOG_LEVEL`, `LOG_FILE`, `TRACING_ENDPOINT`, `METRICS_DASHBOARD_URL`
- On Vercel: POST returns `405` (ephemeral filesystem); GET still resolves via env / defaults.
- `.env` and `.env.local` files are **never modified** by this layer.
- Implementation: `RuntimeConfig.ts` (resolver) + `ConfigController.ts` (HTTP) + `ConfigDto.ts` (contract).

---

## Docker & Deployment

### Requirements

- The app MUST run identically in Docker and locally (dev)
- No hardcoded ports, hostnames, or paths — always via ENV vars
- All services defined in `infrastructure/docker/docker-compose.yml`

### Services (docker-compose)

| Service | Image | Port | Purpose |
|---|---|---|---|
| `traefik` | `traefik:v3.3` | 80 / 443 | Reverse proxy, HTTPS termination, Let's Encrypt, security headers |
| `watchtower` | `containrrr/watchtower:latest` | — | Auto-updates `orderentry` daily at 03:00 |
| `portainer` | `portainer/portainer-ce:latest` | 9000 | Container management Web UI |
| `postgres` | `postgres:15-alpine` | 5432 | PostgreSQL database for HAPI FHIR |
| `hapi-fhir` | `hapiproject/hapi:latest` | 8080 | FHIR R4 server (internal only, behind Traefik) |
| `orchestra` | `farian/oie-juno:4.10.1.1` | 8090 / 8019 | OIE Juno — Monitor UI / API (linux/amd64) |
| `orderentry` | `farian/orderentry:latest` | 3000 | Next.js frontend (auto-update via Watchtower) |

Keycloak / SMART on FHIR is reserved at the bottom of `docker-compose.yml` (commented out, ready to activate).

**Domains** (all derived from `BASE_DOMAIN` in `infrastructure/docker/.env`):

| Domain variable | Service | Example |
|---|---|---|
| `TRAEFIK_DOMAIN` | Traefik dashboard | `traefik.z2lab.ddns.net` |
| `HAPI_DOMAIN` | HAPI FHIR | `hapi.z2lab.ddns.net` |
| `ORCHESTRA_DOMAIN` | Orchestra Monitor UI | `orchestra.z2lab.ddns.net` |
| `ORCHESTRA_API_DOMAIN` | Orchestra API | `api-orchestra.z2lab.ddns.net` |
| `ORDERENTRY_DOMAIN` | OrderEntry App | `orderentry.z2lab.ddns.net` |
| `PORTAINER_DOMAIN` | Portainer | `portainer.z2lab.ddns.net` |

### Dockerfile Rules

- Base image: `node:20-alpine`
- Multi-stage build: `builder` → `runner`
- `NEXT_PUBLIC_*` vars must be passed as build args (baked at build time)
- Server-only vars (`FHIR_BASE_URL`, `AUTH_SECRET`) injected at runtime via docker-compose
- Never bake secrets into the image

### Health Checks

All services define `healthcheck` in `docker-compose.yml`:

| Service | Check | Notes |
|---|---|---|
| `traefik` | `traefik healthcheck --ping` | Requires `--ping=true` in `command` (not labels) |
| `postgres` | `pg_isready -U $POSTGRES_USER` | 5 retries, 20s start |
| `hapi-fhir` | `GET /fhir/metadata` → `200` | 60s start period (JVM warm-up) |
| `orchestra` | `GET /Orchestra/default/RuntimeHealthMetrics/` | 180s start period (2–3 min startup) |
| `orderentry` | `GET /api/me` → `200` or `401` | Both are healthy; `500` is not |
| `portainer` | `wget http://localhost:9000` | — |

### Security

Healthcare-grade security applied via Traefik middleware:

- **`secure-headers@docker`** — applied to all service routers: HSTS (1 year, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, removes `Server` and `X-Powered-By` headers
- **`ratelimit@docker`** — applied to `orderentry` only: 100 req/s average, burst 50
- **`dashboard-auth@docker`** — BasicAuth on Traefik dashboard via `TRAEFIK_AUTH`
- **HTTP → HTTPS redirect** — permanent redirect at entrypoint level (all services)
- **Let's Encrypt** — HTTP-01 challenge; certificates stored in named volume `traefik-certs`

### Networking

- All services on a single bridge network: `zetlab-net`
- Inter-service communication via service name (e.g. `http://hapi-fhir:8080`)
- Never use `localhost` inside containers

### Restart Policy

- All services: `restart: unless-stopped`

### Rules

- Never use `docker run` directly — always `docker-compose` from `infrastructure/docker/`
- Never commit `.env` files — copy and edit `.env` locally, never push secrets
- Container restart required after ENV changes (see Environment Configuration)
- Build multi-arch: `linux/amd64` + `linux/arm64`

---

## Data Directory

## Data Directory

`frontend/orderentry/data/` — gitignored, never commit:

| File | Purpose |
|---|---|
| `data/orderentry.db` | SQLite database (default) — created automatically on first start |
| `data/config.json` | Runtime config overrides (optional, written by `POST /api/config`) |

For PostgreSQL/MSSQL the data resides in the external DB server. See `src/infrastructure/db/README.md` for full DB documentation.

## Database Layer

User persistence is backed by **Prisma 5** ORM with a switchable provider:

| Provider | Default | Connection |
|---|---|---|
| `sqlite` | ✅ Yes | `file:./data/orderentry.db` — embedded, no extra service |
| `postgresql` | No | `postgresql://user:pwd@host:5432/db` |
| `sqlserver` | No | `sqlserver://host:1433;database=db;...` |

**Migrations:** Flyway SQL files in `flyway/migrations/{sqlite,postgresql,sqlserver}/`.  
SQLite migrations run automatically at startup. PostgreSQL/MSSQL require Flyway Docker service to run first.

**Key files:**
- `src/infrastructure/db/` — DB layer (config, runner, Prisma client)
- `src/infrastructure/repositories/PrismaUserRepository.ts` — IUserRepository implementation
- `src/lib/userStore.ts` — public API (thin wrapper, backward-compatible)
- `scripts/migrate-users-json.mjs` — one-time import from legacy users.json → SQLite

**Password reset:** `POST /api/auth/reset-password/request` → email with token → `POST /api/auth/reset-password/confirm`

See [src/infrastructure/db/README.md](frontend/orderentry/src/infrastructure/db/README.md) for full documentation, SQL clients, and commands.

---

## Safe Refactoring Rules

1. **Read before editing.** Never modify a file without reading its current state first.
2. **One responsibility per PR / session.** Do not refactor and add features simultaneously.
3. **Mechanical substitutions first.** When moving a function to a shared location, replace all call sites with imports in the same commit. Leave no duplicate.
4. **Legacy code is off-limits for restructuring** — `src/lib/`, `src/components/`, `src/config.ts`, `src/app/patient/`, `src/app/order/`. Only add imports; never reorganize.
5. **Preserve all existing routes and API contracts.** Routing renames break bookmarks and integrations.
6. **No `--no-verify` / skip hooks.** If a pre-commit hook fails, fix the underlying problem.
7. **Test after every structural change** — run `npm run lint && npx tsc --noEmit` before committing.
8. **Do not add speculative abstractions.** Only create helpers, utilities, or base classes when they are used in at least two places.
9. **Do not add error handling for impossible cases.** Trust TypeScript types; add validation only at system boundaries (API routes, user input).
10. **Never import from `simple/`** — it is dead code and will be removed.

---

## Documentation System

The project maintains a hierarchical README tree — every significant folder has a `README.md`.

### Structure

```
OrderEntry/README.md                          ← root (project + architecture overview)
frontend/orderentry/src/README.md                 ← CA layer map
├── domain/README.md + subfolders
├── application/README.md + subfolders
├── infrastructure/README.md + subfolders
├── presentation/README.md + subfolders
├── shared/README.md + subfolders
├── app/README.md
└── messages/README.md
frontend/orderentry/tests/README.md + subfolders
```

### Rules

1. **Update on every structural change** — new file, new class, new folder, or responsibility shift.
2. **Impacted folders** — update the local README, parent README, and root README as needed.
3. **Max ~25 lines per README** — purpose + structure + rules only. No duplication.
4. **Show diffs before writing** — propose README changes and wait for confirmation.
5. **Tree consistency** — root README must reflect the project structure; folder READMEs must match actual files.
6. **Do not leave outdated documentation** — remove or update stale entries when files are deleted or renamed.

### Documentation Style

Every README must follow the GitHub-optimized visual format:

- **Breadcrumb at top** — `[← Parent](../README.md) | [↑ Grandparent](../../README.md)`
- **Emoji section headers** — `## 📦 Structure`, `## ⚙️ Rules`
- **Structure links** — child folders and key files linked with emoji icons
- **Back to top** at the bottom — `[⬆ Back to top](#)`
- **Root README** — shields.io badges + navigation table

#### Icon Convention

| Icon | Layer / Use |
|---|---|
| 🎯 | Domain |
| 📋 | Application |
| 🔧 | Infrastructure |
| 🎨 | Presentation |
| 🗂️ | Shared |
| 🖥️ | App (Next.js) |
| 📝 | Messages (i18n) |
| 🧪 | Tests |
| 📄 | Individual file |
| 📁 | Subfolder |

---

## API-First Architecture

### Principle

"If it is not documented in OpenAPI, it does not exist."

Every data operation is exposed as an HTTP endpoint and described in the OpenAPI spec. The UI exclusively consumes the API — no direct FHIR calls from the browser.

### Layer Stack

```
HTTP Request
  → Next.js API Route (thin: parse params, return NextResponse)
      → Controller (business logic, FHIR URL building, error handling)
          → DTO (typed request/response contract)
```

### File Locations

```
src/infrastructure/api/
├── controllers/
│   ├── ResultsController.ts    # GET /api/diagnostic-reports
│   ├── OrdersController.ts     # GET/DELETE /api/service-requests[/{id}]
│   ├── PatientsController.ts   # GET /api/patients
│   └── LaunchController.ts     # POST /api/launch (Orchestra JWT → session)
├── middleware/
│   └── JwtGuard.ts             # Verifies Orchestra JWT (iss, claims, exp) → 401 on failure
├── dto/
│   ├── ResultDto.ts            # ListResultsQueryDto, ResultResponseDto, PagedResultsResponseDto
│   ├── OrderDto.ts             # OrderResponseDto, ListOrdersResponseDto, DeleteOrderResponseDto
│   └── PatientDto.ts           # ListPatientsQueryDto, PatientResponseDto, PagedPatientsResponseDto
└── openapi.ts                  # OpenAPI 3.0 spec (single source of truth for API contract)

src/app/api/
├── openapi.json/route.ts       # GET /api/openapi.json → serves spec as JSON
└── docs/route.ts               # GET /api/docs → Swagger UI (CDN, no npm package)
```

### Controller Design Rules

1. **Constructor injection** — accept `fhirBase: string` and `fetchFn: typeof fetch` for testability.
2. **No NextResponse** — controllers return typed values; routes wrap them in `NextResponse`.
3. **FHIR responses** — list endpoints return `FhirBundle<T>` (pass-through from HAPI + pagination `link[]`). Errors return `FhirOperationOutcome`. Both types come from `FhirTypes.ts`. Routes set `Content-Type: application/fhir+json`.
4. **`httpStatus` field** — `FhirOperationOutcome` carries an internal `httpStatus?: number` so routes can set the HTTP status code. It is stripped before the JSON body is sent.
5. **Module-level singleton** — each controller exports a `const xyzController = new XyzController()` for route use.

```typescript
// Route (thin) — FHIR endpoint pattern
import { resultsController } from "@/infrastructure/api/controllers/ResultsController";
const FHIR_CT = "application/fhir+json";
export async function GET(request: Request) {
  const result = await resultsController.list(parseQuery(request));
  const { httpStatus: _, ...body } = result as unknown as Record<string, unknown>;
  return NextResponse.json(body, { status: (result as { httpStatus?: number }).httpStatus ?? 200, headers: { "content-type": FHIR_CT } });
}

// Test (injectable)
const controller = new ResultsController("http://fhir-test", mockFetch);
const result = await controller.list({ orgFhirId: "org-1", patientId: "p-123" });
// result is FhirBundle<FhirDiagnosticReport> | FhirOperationOutcome
```

### OpenAPI Spec (`src/infrastructure/api/openapi.ts`)

Exported as a TypeScript `const` with `as const` for full type inference. Contains:
- All endpoint paths, methods, parameters, request bodies, response schemas
- Reusable `$ref` component schemas for all DTOs
- `sessionCookie` security scheme

Add new endpoints here **before** writing the route handler.

### Swagger UI

- **URL:** `GET /api/docs`
- **Spec source:** `GET /api/openapi.json`
- Rendered via Swagger UI CDN (no npm dependency)
- `withCredentials: true` so session cookies are sent with "Try it out" requests

### DTO Rules

- Request DTOs (`Query*Dto`) are **plain TypeScript interfaces** with all fields optional and documented defaults.
- List response bodies are `FhirBundle<T>` (not custom DTOs). Error response bodies are `FhirOperationOutcome`.
- `httpStatus?: number` is an internal field — never exposed in OpenAPI response body schemas.

### API Test Rules

- Controller tests live in `tests/integration/infrastructure/api/`.
- Inject a `vi.fn()` mock as `fetchFn` — no real FHIR server required.
- Assert FHIR Bundle format: `bundle.entry[0].resource.id`, `bundle.total`, `bundle.resourceType === "Bundle"`.
- Assert errors via OperationOutcome: `result.resourceType === "OperationOutcome"`, `result.issue[0].details.text`, `result.httpStatus`.
- List controllers that require an org filter (`PatientsController`, `ResultsController`, `OrdersController`) must receive `orgFhirId` or `orgGln` in every test call, otherwise a 403 OperationOutcome is returned immediately.

---

## Error Handling

Two error formats are used depending on the route family. Never return raw error strings,
stack traces, or ad-hoc `{ error: string }` shapes.

### FHIR routes → FHIR OperationOutcome

All routes under `/api/fhir/**`, `/api/patients`, `/api/service-requests`, and
`/api/diagnostic-reports` return **FHIR OperationOutcome** on errors. Use
`buildOperationOutcome()` from `FhirTypes.ts`.

```typescript
// Shape (from FhirTypes.ts)
interface FhirOperationOutcome {
  resourceType: "OperationOutcome";
  issue: Array<{
    severity: "error" | "warning" | "information" | "fatal";
    code:     string;
    details?: { text?: string };
  }>;
  httpStatus?: number; // internal — stripped before JSON response
}
```

```json
{
  "resourceType": "OperationOutcome",
  "issue": [{ "severity": "error", "code": "exception", "details": { "text": "FHIR 503" } }]
}
```

### Non-FHIR routes → RFC 7807 Problem Details

`/api/launch` and other non-FHIR endpoints return **RFC 7807 Problem Details**.

```typescript
interface ProblemDetails {
  type:      string;  // "about:blank" or a URI
  title:     string;
  status:    number;
  detail:    string;
  instance:  string;  // e.g. "/api/launch"
}
```

### Rules

- **No raw strings** — never `return NextResponse.json({ error: "something" })` in new code.
- **`httpStatus` is internal** — stripped from the response body before sending (see Controller Design Rules).
- **Orchestra endpoint** — `/api/launch` must return `ProblemDetails` so Orchestra can parse structured errors.
- **OpenAPI** — error response schemas reference either `FhirOperationOutcome` or `ProblemDetails` component schemas; never inline `{ error: string }`.

---

## API Documentation System

### Principle

The API documentation layer follows the same API-First rule: **OpenAPI is the single source of truth**. No endpoint exists unless it is documented there.

### Routes

| URL | Purpose |
|---|---|
| `GET /api/openapi.json` | OpenAPI 3.0 spec (JSON) — machine-readable |
| `GET /api/docs` | Swagger UI (CDN, no npm) — human-readable interactive docs |
| `GET /api/application.wadl` | WADL (XML) — for legacy SOAP/WS-* toolchains and PIS connectors |
| `GET /admin/api` | Admin → API management page (embedded Swagger + connection guide) |

### Admin API Page (`/admin/api`)

Located at `src/presentation/pages/ApiDocsPage.tsx`. Follows the same AppSidebar layout as all other admin pages.

Contains six sections:
1. **Swagger UI** — embedded iframe (`/api/docs`) with show/hide toggle
2. **API Overview** — base URL, content-type, endpoint catalogue by group
3. **Authentication** — HMAC-SHA256 session cookie flow with cURL examples
4. **Connection Guide** — cURL examples for list users, create user, sync FHIR, list results
5. **FHIR Integration** — visual flow diagram and User→Practitioner/PractitionerRole/Organization mappings
6. **WADL & OpenAPI** — download links

### WADL (`GET /api/application.wadl`)

Generated statically in `src/app/api/application.wadl/route.ts` from the same resource model as the OpenAPI spec. Returns `application/xml`. Updated manually whenever endpoints are added to the OpenAPI spec.

### Rules

- **Never duplicate API docs.** OpenAPI is the source; Swagger and WADL consume it.
- **Add to OpenAPI before adding the route.** The spec documents the contract; the route implements it.
- The Admin API page is **read-only** — no editing of API config through the UI.
- WADL is a static template; update it alongside `openapi.ts` when adding endpoints.
- Swagger UI uses CDN (`unpkg.com/swagger-ui-dist`) — no npm dependency required.

---

## Observability

z2Lab OrderEntry ships three observability layers: structured JSON logging (always on), Prometheus metrics (opt-in), and OpenTelemetry distributed tracing (opt-in).

### Structured Logging

All server-side code uses `createLogger("ContextName")` to emit one-line JSON entries to stdout (and optionally to a log file). Four levels: `debug` / `info` / `warn` / `error`. Default level is `info`; can be changed at runtime via `POST /api/v1/config` (`LOG_LEVEL` key) **without a server restart** — the `ConfigController` calls `refreshLogLevel()` after a successful save and the new level is picked up on the next log call.

Full guide with provider-by-provider examples and the `/admin/logs` viewer: [Documentation/Operations/Logging.md](Documentation/Operations/Logging.md).

### Prometheus Metrics (`GET /api/metrics`)

| File | Purpose |
|---|---|
| `src/infrastructure/metrics/PrometheusService.ts` | prom-client singleton; prefix `zetlab_`; FHIR counters + histograms |
| `src/app/api/metrics/route.ts` | Prometheus scrape endpoint |

**Metrics exposed:**

| Metric | Type | Labels |
|---|---|---|
| Node.js default metrics (GC, heap, event loop, …) | various | — |
| `zetlab_fhir_requests_total` | Counter | `resource`, `method`, `status` |
| `zetlab_fhir_request_duration_seconds` | Histogram | `resource`, `method`, `status` |

**Auth:** If `METRICS_TOKEN` is set, the endpoint requires `Authorization: Bearer <token>`. Otherwise, standard admin session auth is used (safe for internal Prometheus scrapes without a token).

**Prometheus scrape config example:**
```yaml
- job_name: z2lab
  static_configs:
    - targets: ["orderentry:3000"]
  metrics_path: /api/metrics
  bearer_token: "<METRICS_TOKEN>"
```

### OpenTelemetry Tracing

| File | Purpose |
|---|---|
| `src/instrumentation.ts` | Edge-safe entry point — only conditionally imports `instrumentation.node` |
| `src/instrumentation.node.ts` | Node.js-only — all OTel + DB migration startup code |

- Activated only when `ENABLE_TRACING=true` **and** `TRACING_URL` is set.
- Uses `resourceFromAttributes()` (not deprecated `new Resource()`).
- `fs` and `dns` auto-instrumentations are disabled (too noisy in lab context).
- Trace IDs are injected into structured log lines via `getActiveTraceId()` in `Logger.ts` (lazy `require("@opentelemetry/api")` — browser-safe).
- Compatible with **Jaeger** (`http://jaeger:4318`), **Tempo** (`http://tempo:4318`), and any OTLP/HTTP collector.
- Graceful shutdown on `SIGTERM`/`SIGINT`.

### ⛔ Vercel Edge / OTel — KRITISCHE REGELN (nie brechen)

Diese Regeln wurden am 2026-04-04 nach 4 fehlgeschlagenen Deployments festgelegt.
**Vor jeder Änderung an `instrumentation.ts` oder `next.config.mjs` diese Regeln lesen.**

#### Korrekte Struktur (die EINZIGE die funktioniert)

```ts
// instrumentation.ts — Edge-safe, minimal
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}
```

```ts
// instrumentation.node.ts — statische Top-Level Imports, kein export register()
import { NodeSDK } from "@opentelemetry/sdk-node";
// ... weitere statische Imports direkt hier
if (process.env.ENABLE_TRACING === "true") { /* sdk.start() */ }
```

```js
// next.config.mjs — NUR serverExternalPackages, KEIN webpack() Block
serverExternalPackages: ["@opentelemetry/api", "@opentelemetry/sdk-node", ...]
// webpack() Funktion ist VERBOTEN — isServer === true gilt für BEIDE Runtimes
```

#### Warum es funktioniert

Next.js hat ein eingebautes webpack-Plugin das `*.node.ts` Dateien **physisch** aus dem Edge-Bundle entfernt. Vercels `__vc__ns__` esbuild-Bundler respektiert diese Konvention. Kein anderer Mechanismus erreicht dasselbe.

#### Verbotene Ansätze (alle gescheitert, nie wieder versuchen)

| Ansatz | Warum er scheitert |
|---|---|
| `/* webpackIgnore: true */` | esbuild ignoriert webpack-Kommentare |
| Dynamische imports in `register()` | esbuild folgt string-literalen statisch |
| Leere `instrumentation.ts` | DB-Migrations + OTel laufen dann nicht |
| `webpack()` Funktion mit `isServer` | Läuft auch für Edge, fügt `commonjs` Externals ins Edge-Bundle ein → selber Fehler |
| Webpack alias für Edge | `__vc__ns__` ignoriert webpack-Konfiguration |
| Intermediate-Files (initTelemetry.ts) | `__vc__ns__` folgt static re-exports |

### ENV Variables (Observability)

| Variable | Default | Notes |
|---|---|---|
| `ENABLE_TRACING` | `false` | Set `true` to start the OTel SDK |
| `TRACING_URL` | — | OTLP/HTTP base URL (required when tracing enabled) |
| `MONITORING_URL` | — | Dashboard link shown in Settings (display-only) |
| `METRICS_TOKEN` | — | Bearer token for Prometheus scraper; unset = admin auth |

---

## API Versioning

All new API endpoints MUST be placed under `/api/v1/`. The unversioned `/api/*` paths
are maintained for backward compatibility only.

### Rules

1. **New endpoints → `/api/v1/` only.** Never add a new endpoint directly to `/api/` without a corresponding `/api/v1/` entry.
2. **Re-export pattern for stable routes.** A v1 route that is identical to its unversioned counterpart uses a one-liner re-export:
   ```typescript
   // src/app/api/v1/my-endpoint/route.ts
   export const dynamic = "force-dynamic";
   export { GET, POST } from "@/app/api/my-endpoint/route";
   ```
3. **Adapter Pattern for breaking changes (v2+).** When a new version changes field names, nesting, or removes fields, implement:
   - `src/application/adapters/I<Resource>Adapter.ts` — generic interface
   - `src/application/adapters/<Resource>AdapterV1.ts` — v1 shape
   - `src/application/adapters/<Resource>AdapterV2.ts` — v2 shape
   - `src/infrastructure/api/dto/<Resource>Dto.ts` — TypeScript response types per version
   - A shared controller that returns the **domain entity** and receives the adapter as a parameter
   - The v2 route at `src/app/api/v2/<endpoint>/route.ts` injects the V2 adapter

   ```
   Request → Controller.lookup(params, "v2", adapterV2)
                  → domain logic → DomainEntity
                  → adapterV2.adapt(entity) → V2Response
   ```

4. **Gateway-wrapped routes for new admin endpoints.** New admin routes in v1 go through `ApiGateway.handle()` — not the re-export pattern.
5. **RouteRegistry is mandatory.** Every new v1 and v2 route must have an entry in `src/infrastructure/api/gateway/RouteRegistry.ts`.
6. **OpenAPI must be updated simultaneously.** A route without an OpenAPI entry does not officially exist. For v2, add both the path (`/v2/endpoint`) and a component schema (`<Resource>ResponseV2`).
7. **Version bump policy.** Breaking changes (field removal, type change, structural nesting) require a new version prefix (`/api/v2/`). The v1 paths remain frozen forever.
8. **Logging version explicitly.** Controllers log the API version: `log.debug("API v2 → /endpoint", { ... })`.
9. **Tests for every adapter.** Unit tests in `tests/unit/application/adapters/<Resource>Adapter.test.ts` must verify:
   - Both v1 and v2 shapes for NAT/JUR or equivalent domain variants
   - A cross-version compatibility check (field present in v1 but absent in v2 and vice versa)

### Version policy table

| Path prefix | Status | Use case |
|---|---|---|
| `/api/v1/` | ✅ Current stable | All external clients, new integrations |
| `/api/v2/` | 🔄 Breaking changes | New integrations requiring structural changes |
| `/api/` | ⚠️ Legacy | Existing internal callers only — do not extend |

### Checklist — every new endpoint (mandatory)

| Step | Action |
|---|---|
| 1 | Implement logic in `src/app/api/<endpoint>/route.ts` |
| 2 | Create `src/app/api/v1/<endpoint>/route.ts` — re-export |
| 3 | Add entry to `RouteRegistry.ts` |
| 4 | Add path + schema to `openapi.ts` |
| 5 | If breaking change → add adapter + v2 route + v2 schema |

### Reference implementation: GLN Lookup

| File | Purpose |
|---|---|
| `domain/entities/GlnLookupResult.ts` | Canonical domain entity |
| `application/adapters/IGlnAdapter.ts` | Generic adapter interface |
| `application/adapters/GlnAdapterV1.ts` | Flat v1 response shape |
| `application/adapters/GlnAdapterV2.ts` | Nested v2 response shape |
| `infrastructure/api/dto/GlnDto.ts` | TypeScript types per version |
| `infrastructure/api/controllers/GlnLookupController.ts` | Shared controller (version-agnostic) |
| `app/api/gln-lookup/route.ts` | Legacy path → v1 adapter |
| `app/api/v1/gln-lookup/route.ts` | Stable v1 path → re-export |
| `app/api/v2/gln-lookup/route.ts` | v2 path → v2 adapter |
| `tests/unit/application/adapters/GlnAdapter.test.ts` | 26 tests |

---

## API Gateway

The API Gateway is a **handler-wrapper pattern** implemented in
`src/infrastructure/api/gateway/ApiGateway.ts`. It is NOT a separate process.

### What it provides (per request)

| Concern | Detail |
|---|---|
| Request ID | `crypto.randomUUID()` — returned as `x-request-id` response header |
| Structured logging | `→ METHOD /api/v1/path`, `✓ STATUS (ms)`, `✗ STATUS (ms)` via Logger |
| Auth enforcement | `auth: "admin"` → `checkAdminAccess(req)` → `401`/`403` on failure |
| Error normalisation | Uncaught throws from the handler → RFC 7807 Problem Details `500` |

### Usage

```typescript
export async function POST(req: NextRequest) {
  return apiGateway.handle(
    req,
    { version: "v1", endpoint: "/admin/mail/test", auth: "admin" },
    async () => {
      const result = await myController.doWork();
      return NextResponse.json(result);
    },
  );
}
```

### Rules

1. **All new v1 admin routes use `apiGateway.handle()`** — no manual auth checks in the route body.
2. **No business logic in routes** — routes are thin: parse body → call gateway → return response.
3. **Logs never include credentials** — never log `MAIL_PASSWORD`, `AUTH_SECRET`, OAuth tokens, or any secret ENV value.
4. **`ApiGateway` is server-only** — never import it from a client component or shared module.

---

## RBAC (Role-Based Access Control)

### Phase 1 — Static role → permission mapping (current)

Fine-grained permissions are checked on every protected request. No DB changes, no breaking changes.

#### Layer layout

```
domain/valueObjects/Permission.ts          ← PERMISSIONS constants + Permission union type
domain/policies/IPolicy.ts                 ← PolicyContext + IPolicy interface
domain/policies/RolePermissionMap.ts       ← static role → Set<Permission> map (pure, no I/O)
application/useCases/CheckPermission.ts    ← checkPermission(role, permission) → boolean (pure)
infrastructure/api/middleware/
  RequirePermission.ts                     ← HTTP guard: Bearer → cookie → deny; returns PermissionResult
app/api/v1/me/permissions/route.ts         ← GET /api/v1/me/permissions → { role, permissions[] }
```

#### Permission constants

| Permission | Admin | User |
|---|---|---|
| `order:create` | ✅ | ✅ |
| `order:read` | ✅ | ✅ |
| `order:edit` | ✅ | ❌ |
| `patient:read` | ✅ | ✅ |
| `patient:edit` | ✅ | ❌ |
| `gln:read` | ✅ | ✅ |
| `gln:sync` | ✅ | ❌ |
| `user:manage` | ✅ | ❌ |
| `admin:access` | ✅ | ❌ |

#### Usage pattern

```typescript
// In any API route (not gateway-wrapped)
import { requirePermission } from "@/infrastructure/api/middleware/RequirePermission";
import { PERMISSIONS }       from "@/domain/valueObjects/Permission";

export async function GET(req: NextRequest) {
  const perm = await requirePermission(req, PERMISSIONS.GLN_READ);
  if (!perm.ok) return perm.response; // 401 or 403 RFC 7807
  // perm.sub / perm.username / perm.role available here
}
```

#### ApiGateway integration

`ApiGateway.handle()` with `auth: "admin"` internally calls
`requirePermission(req, PERMISSIONS.ADMIN_ACCESS)`. No manual `checkAdminAccess` calls needed in gateway-wrapped routes.

#### Phase 2 (deferred — see Pending Work)

Replace `ROLE_PERMISSION_MAP` with a `IPermissionRepository` backed by a DB table.
`CheckPermission` use case stays pure — only the data source changes.

---

## Mail System

Provider-agnostic outbound email delivery for notifications, password resets, and
(with HIN) encrypted lab report delivery per nDSG.

### Architecture

```
domain/entities/MailMessage.ts          ← what a message contains (no delivery logic)
application/interfaces/IMailService.ts  ← contract: isConfigured / verify / send
infrastructure/mail/
  types/MailConfig.ts                   ← MailProvider union + PROVIDER_AUTH_MATRIX
  mailEnvConfig.ts                      ← ENV → MailConfig builder
  MailServiceFactory.ts                 ← DI root, mailService singleton
  NodemailerMailService.ts              ← concrete impl (nodemailer) + NullMailService
infrastructure/api/controllers/
  MailController.ts                     ← getStatus() + test() — no secrets exposed
app/api/v1/admin/mail/
  test/route.ts                         ← POST /api/v1/admin/mail/test  (gateway-wrapped)
  status/route.ts                       ← GET  /api/v1/admin/mail/status (gateway-wrapped)
```

### Provider rules

| Provider | `MAIL_PROVIDER` | Production? | Notes |
|---|---|---|---|
| Generic SMTP | `smtp` | ✅ | Primary — hospital relay, Exchange |
| HIN | `hin` | ✅ | Required for patient data (nDSG) |
| SMTP + OAuth2 | `smtp_oauth2` | ✅ | Office 365 / Exchange Online |
| Google Workspace Relay | `google_workspace_relay` | ✅ | Org must have Workspace |
| Gmail | `gmail` | ❌ Dev only | Never in production — not nDSG compliant |

### Mail API endpoint (versioned)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET`  | `/api/v1/admin/mail/status` | admin | Current config (no secrets) |
| `POST` | `/api/v1/admin/mail/test`   | admin | SMTP verify + optional test send |

Full documentation: [Documentation/Deployment/Mail.md](Documentation/Deployment/Mail.md) — provider matrix, full ENV reference, Gmail/HIN/Office 365/Workspace setup, troubleshooting

---

## OpenAPI Synchronization

### Rule: "If it is not in OpenAPI, it does not exist."

Every API change MUST trigger updates to ALL four of these:

1. **`src/infrastructure/api/openapi.ts`** — the authoritative spec
2. **`Documentation/<Feature>/README.md`** (e.g. `Documentation/Deployment/Mail.md`, `Documentation/Bridge/README.md`) — developer docs
3. **`CLAUDE.md`** — architecture section for the affected feature
4. **`src/infrastructure/api/gateway/RouteRegistry.ts`** — v1 route list

Failing to update all four is a documentation violation.

### Spec location

| URL | Purpose |
|---|---|
| `GET /api/v1/openapi.json` | Machine-readable spec (v1 server entry is first) |
| `GET /api/v1/docs` | Swagger UI |
| `GET /api/openapi.json` | Legacy spec URL (same content) |
| `GET /api/docs` | Legacy Swagger UI URL |

### Server entries in spec

```typescript
servers: [
  { url: "/api/v1", description: "API v1 — stable, the only documented server" },
],
```

**Only `/api/v1` is documented.** The previous spec listed an unversioned
`/api` legacy entry as a second server — this caused Swagger UI to issue
requests against paths like `/api/bridge/jobs` (404) instead of
`/api/v1/bridge/jobs`. Removed 2026-04-26.

Unversioned `/api/*` routes still exist in the codebase (login, me, launch,
etc.) and remain reachable, but they are intentionally **not** documented
in OpenAPI. New endpoints MUST be created under `/api/v1/`.

---

## Order Number Engine

Organisation-dependent order number assignment with Orchestra API integration and pre-reserved pool fallback.

### Architecture

```
domain/strategies/IOrderNumberStrategy.ts    ← Strategy interface + ServiceType enum (MIBI/ROUTINE/POC)
domain/strategies/MibiStrategy.ts            ← MI4XXXXXXXX format (ENV-configurable)
domain/strategies/RoutineStrategy.ts         ← 10-digit numeric
domain/strategies/PocStrategy.ts             ← POXXXXX format
domain/strategies/OrderNumberStrategyRegistry.ts  ← singleton, ENV-driven strategy lookup

app/api/v1/config/service-types/route.ts     ← GET /api/v1/config/service-types
presentation/hooks/useServiceTypes.ts        ← client hook: fetches from API, falls back to AppConfig
domain/entities/OrgRule.ts                   ← org-specific HL7 + prefix config
domain/entities/ReservedOrderNumber.ts       ← pool entry entity
domain/valueObjects/PoolThreshold.ts         ← validates infoAt/warnAt/errorAt; levelFor(n)

application/interfaces/repositories/
  IReservedNumberRepository.ts              ← pool CRUD + threshold config
  IOrgRuleRepository.ts                     ← org rule CRUD
application/interfaces/services/
  IOrchestraOrderService.ts                 ← requestNumber(orgGln, serviceType) → counter | null
  IPoolNotificationService.ts               ← checkAndNotify(remaining)
application/useCases/
  GenerateOrderNumberUseCase.ts             ← Orchestra → Pool → OrderBlockedError
  ReserveOrderNumberUseCase.ts              ← admin bulk import + validation

infrastructure/repositories/
  PrismaOrgRuleRepository.ts               ← Prisma CRUD
  PrismaReservedNumberRepository.ts        ← Prisma pool + threshold singleton upsert
infrastructure/services/
  OrchestraOrderService.ts                 ← HTTP stub (returns null until Orchestra implements)
  PoolNotificationService.ts               ← anti-spam email via mailService
infrastructure/api/controllers/
  OrgRulesController.ts                    ← CRUD controller
  NumberPoolController.ts                  ← pool list/add/delete/thresholds + generateOrderNumber
```

### Request Flow

```
POST /api/v1/orders/number
  → NumberPoolController.generateOrderNumber()
      → GenerateOrderNumberUseCase
          1. OrchestraOrderService.requestNumber(orgGln, serviceType)
             → HTTP POST ORCHESTRA_ORDER_API_URL (3s timeout)
             → returns { counter } or null (if not configured / error)
          2. If null → PrismaReservedNumberRepository.findNext(serviceType)
             → marks used atomically
             → PoolNotificationService.checkAndNotify(remaining)
          3. If pool empty → 503 OrderBlockedError
```

### Admin Pages

| Page | Path | Purpose |
|---|---|---|
| Org Rules | `/admin/org-rules` | CRUD for organisation-specific HL7 + prefix rules |
| Number Pool | `/admin/number-pool` | Pool stats, threshold config, bulk add, delete entries |

### Pool Threshold Alerts

- Three levels: **Info** (yellow), **Warn** (orange), **Error** (red)
- Configured via `PUT /api/v1/admin/number-pool/thresholds`
- Anti-spam: one email per level per refill cycle (tracked in `PoolNotificationLog` table)
- `poolRefilled=true` resets anti-spam state when admin adds new numbers

### Dynamic Service Types (`GET /api/v1/config/service-types`)

Service types (MIBI, ROUTINE, POC, …) are resolved dynamically at runtime — **never hardcoded in UI code**.

**Resolution priority:**

| Priority | Source | Condition |
|---|---|---|
| 1 | `ORDER_SERVICE_TYPES` env var | Set and non-empty → returned immediately, no FHIR call |
| 2 | FHIR `ActivityDefinition.topic.coding.code` | Fetched fresh from FHIR, then cached 5 min in-process |
| 3 | Built-in fallback `["MIBI", "ROUTINE", "POC"]` | FHIR unavailable or returns empty list |

**Client-side (`useServiceTypes` hook):**
- Initial value from `AppConfig.serviceTypes` (from `NEXT_PUBLIC_ORDER_SERVICE_TYPES`, default `MIBI,ROUTINE,POC`)
- Fetches `GET /api/v1/config/service-types` on mount and updates all dropdowns
- No rebuild required when adding new service types to FHIR

**ENV vars (both writable via `/api/env`):**
- `ORDER_SERVICE_TYPES` — server-side explicit list (restart required)
- `FHIR_SYSTEM_CATEGORY` — system URI for topic codings (default: `https://www.zetlab.ch/fhir/category`)
- `NEXT_PUBLIC_ORDER_SERVICE_TYPES` — client bundle initial default (build-time only)

### TODO — Orchestra API (not yet implemented on Orchestra side)

Orchestra must implement: `POST /api/orders/number` with body `{ orgGln, serviceType }` → `{ counter, serviceType }`.
Until then, `OrchestraOrderService` returns `null` and the pool fallback is always active.

---

## Pending Work (Deferred)

| Item | Reason deferred |
|---|---|
| Apply design system to existing pages | Non-breaking; do incrementally |
| Migrate `app/orders/page.tsx` to `presentation/pages/OrdersPage.tsx` | Low risk; existing page works |
| Add `npm test` to CI pipeline | After first full test pass |
| E2E tests (Playwright) | After unit/integration coverage is stable |
| WADL for HL7/OIE Juno integration | Endpoint exists at /api/application.wadl; extend if OIE requires specific schema |
| `ConceptMap_zlz-snomed-zu-material.json` | ✅ Fertig — 106 Material-Codes auf SNOMED CT gemappt (generator: `backend/orchestra/fhir/masterdata/generate_conceptmap.mjs`) |
| `ConceptMap_zlz-loinc-zu-lis.json` | Nur 3 Placeholder — wartet auf vollständige LOINC→LIS Test-Code-Mapping-Liste |
| `Account_test-001.json` | Referenced by `Encounter_test-001`; not blocking for first upload tests |
| GLN → FHIR Practitioner sync | ✅ Fertig — `profile.gln` → `Practitioner.identifier` mit System `https://www.gs1.org/gln` in `PractitionerMapper.buildIdentifiers()` |
| `NEXT_PUBLIC_LAB_ORG_ID` als Docker `--build-arg` | ✅ Fertig — `ARG NEXT_PUBLIC_LAB_ORG_ID=zlz` in `docker/Dockerfile` Stage 2; wird in `.env.local` geschrieben vor `npm run build` |
| Orchestra Order Number API | TODO — Orchestra muss `POST /api/orders/number` implementieren; `OrchestraOrderService` gibt aktuell `null` zurück → Pool-Fallback immer aktiv |
| RBAC Phase 2 — DB-backed permissions + Keycloak | Phase 1 fertig (statische role→permission Map). Phase 2: Tabelle `permissions`, Admin-UI `/admin/permissions`, optionaler Keycloak Role Mapper. Erst nach Go-Live angehen. |
| Error Monitoring via Loki + Grafana | Grafana ist bereits im Einsatz; native Erweiterung: 2 Container (`grafana/loki` + `grafana/promtail`) im `infrastructure/docker/docker-compose.yml`, Promtail-Config liest `orderentry.log`, in Grafana Datasource „Loki" hinzufügen. Strukturierte JSON-Logs sind bereits da → `\| json \| level="error"` reicht. Empfohlen über GlitchTip/Sentry weil keine neue UI nötig. Doku-Stub: `.claude/memory/error_monitoring_plan.md`. |
