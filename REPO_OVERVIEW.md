# ZetLab OrderEntry — Complete Repository Overview

> Generated for use by external AI assistants (ChatGPT, etc.) as a source of truth.
> Based on actual code inspection. Last updated: 2026-04-02.

---

## 1. Project Tree

```
OrderEntry/
├── CLAUDE.md                          # Master dev rules & architecture doc (single source of truth)
├── README.md                          # Root README with shields.io badges + nav table
├── REPO_OVERVIEW.md                   # This file
├── .gitignore
│
├── LIS/                               # Reference / specification files (not deployed)
│   └── Hl7/
│       ├── ORM/
│       │   ├── EXAMPLE_ORM.hl7        # Real HL7 ORM^O01 sample from ZLZ LIS
│       │   ├── NTE_TEST_AUFTRAG.hl7   # ORM with NTE notes
│       │   ├── CLAUDE.md
│       │   └── README.md
│       └── 7401010575-2.dif           # Labsoft field mapping config for ZLZ LIS
│
├── backend/
│   ├── README.md
│   ├── README_ArchitectureMismatch.md # Known issue: OIE Juno amd64-only on ARM hosts
│   ├── docker/
│   │   ├── docker-compose.yml         # Full production stack (7 services)
│   │   ├── .env                       # Environment secrets (never commit real values)
│   │   └── data/
│   │       ├── hapi/config/
│   │       │   └── application.yaml   # HAPI FHIR R4 config (PostgreSQL, subscriptions, CORS)
│   │       ├── traefik/letsencrypt/
│   │       │   └── acme.json          # Let's Encrypt TLS certificates
│   │       ├── prometheus/
│   │       │   └── prometheus.yml
│   │       ├── grafana/provisioning/  # Grafana dashboards (Docker + Node)
│   │       ├── orc/                   # Orchestra OIE Juno runtime data (logs, DB, deployments)
│   │       ├── orderentry/data/       # Next.js persistent data volume mount
│   │       └── pgadmin/config/
│   │           └── servers.json
│   └── orchestra/
│       ├── Runtime/
│       │   └── sc_OrderEntry_Middleware.psc  # Orchestra scenario (deployed to OIE Juno)
│       ├── Designer/                  # Orchestra Designer project files
│       └── fhir/
│           ├── FHIR_to_HL7_ORM_Mapping.md   # Complete FHIR→HL7 field mapping spec
│           ├── Bundle/
│           │   └── Bundle_allResourceTypeForOrderentry.json  # Full FHIR seed bundle
│           ├── Patient/Bundle.json
│           ├── ServiceRequest/ServiceRequest.json
│           ├── Subscription/
│           │   ├── ServiceRequest_Subscription.json  # HAPI→Orchestra webhook
│           │   └── UpdateOverID.json
│           └── masterdata/            # Lab test catalog seed (ActivityDefinition etc.)
│               ├── *.json             # One file per test panel
│               └── StammdatenAusLIS.xml
│
└── frontend/
    └── zetlab/                        # All frontend code lives here
        ├── Dockerfile
        ├── next.config.mjs            # output: "standalone" (Docker) or undefined (Vercel)
        ├── package.json               # React 18.2, Next.js 14.2, Tailwind v4, Vitest 4, Jest 29
        ├── tsconfig.json              # Strict TypeScript, @/* → ./src/* alias
        ├── jest.config.ts             # Jest 29 + ts-jest (partially superseded by Vitest)
        ├── vitest.config.ts           # Active test runner (npm test → vitest run)
        ├── postcss.config.mjs         # @tailwindcss/postcss plugin
        ├── eslint.config.mjs
        ├── .nvmrc                     # Node 20.x
        ├── scripts/
        │   └── write-version.mjs      # Writes NEXT_PUBLIC_APP_VERSION from git at build
        ├── public/
        │   └── logo.svg
        ├── data/                      # Runtime-writable, gitignored
        │   ├── users.json             # Flat-file user store (scrypt hashed passwords)
        │   └── config.json            # GUI config overrides (RuntimeConfig layer)
        ├── logs/                      # Persistent log output (bind-mounted in Docker)
        ├── design/                    # HTML wireframe reference files
        ├── tests/
        │   ├── unit/
        │   │   ├── domain/
        │   │   │   ├── useCases/      # GetResults, SearchResults, GetOrders, CreateOrder
        │   │   │   ├── factories/     # ResultFactory, OrderFactory
        │   │   │   └── valueObjects/  # OrderNumber, Identifier
        │   │   └── application/
        │   │       └── strategies/    # PatientSearchStrategy
        │   ├── integration/
        │   │   └── infrastructure/    # DiagnosticReportMapper, controller tests
        │   └── mocks/
        │       ├── MockResultRepository.ts
        │       └── MockOrderRepository.ts
        └── src/
            ├── app/                   # Next.js App Router (thin wrappers only)
            │   ├── globals.css        # CSS design tokens (--zt-*) + Tailwind v4 @theme inline
            │   ├── layout.tsx         # Root layout: AppHeader + children; force-dynamic
            │   ├── page.tsx           # Home page: 3 links (patients/orders/results)
            │   ├── login/page.tsx
            │   ├── signup/page.tsx
            │   ├── results/page.tsx   # → imports ResultsPage from presentation/
            │   ├── orders/page.tsx    # Legacy orders page (not yet migrated to CA)
            │   ├── settings/          # Settings UI (env editor + config editor)
            │   ├── profile/           # User profile + GLN lookup
            │   ├── patient/           # LEGACY — off-limits for restructuring
            │   │   ├── page.tsx       # Patient search list
            │   │   └── [id]/          # Patient detail
            │   ├── order/             # LEGACY — off-limits for restructuring
            │   │   └── [id]/          # Full order-entry workflow (~26K tokens)
            │   └── api/               # Server-side FHIR proxy routes (thin)
            │       ├── config/route.ts
            │       ├── diagnostic-reports/route.ts
            │       ├── service-requests/route.ts
            │       ├── service-requests/[id]/route.ts
            │       ├── patients/route.ts
            │       ├── patients/[id]/route.ts
            │       ├── patients/[id]/service-requests/route.ts
            │       ├── patients/[id]/diagnostic-reports/route.ts
            │       ├── practitioners/route.ts
            │       ├── login/route.ts
            │       ├── logout/route.ts
            │       ├── signup/route.ts
            │       ├── me/route.ts
            │       ├── gln-lookup/route.ts
            │       ├── insurance-lookup/route.ts
            │       ├── logs/route.ts
            │       ├── env/route.ts
            │       ├── settings/route.ts
            │       ├── openapi.json/route.ts
            │       └── docs/route.ts  # Swagger UI (CDN)
            ├── domain/                # Pure TypeScript — NO React, NO fetch, NO process.env
            │   ├── entities/
            │   │   ├── Result.ts      # ResultStatus enum + Result interface
            │   │   └── Order.ts       # OrderStatus enum + Order interface
            │   ├── valueObjects/
            │   │   ├── OrderNumber.ts # Immutable, validates format, equals(), toString()
            │   │   └── Identifier.ts  # FHIR system+value, toToken() → "system|value"
            │   ├── useCases/
            │   │   ├── GetResults.ts
            │   │   ├── SearchResults.ts  # Normalises query (trim, min page 1, max 100)
            │   │   ├── GetOrders.ts
            │   │   └── CreateOrder.ts
            │   └── factories/
            │       ├── ResultFactory.ts  # create(partial) + createEmpty(overrides)
            │       └── OrderFactory.ts   # create(partial) + createDraft(patientId)
            ├── application/           # Orchestrates domain; defines repository interfaces
            │   ├── interfaces/
            │   │   └── repositories/
            │   │       ├── IResultRepository.ts   # search() + getById()
            │   │       └── IOrderRepository.ts    # list, getById, create, delete
            │   ├── services/
            │   │   ├── ResultService.ts
            │   │   └── OrderService.ts
            │   └── strategies/
            │       └── PatientSearchStrategy.ts   # ID (/^\d{5,}$/ or UUID) vs name fallback
            ├── infrastructure/        # Implements interfaces; reads process.env; does I/O
            │   ├── ServiceFactory.ts  # DI root — wires repos to services
            │   ├── api/
            │   │   ├── HttpClient.ts  # Client-side fetch wrapper (get, post, delete)
            │   │   ├── controllers/
            │   │   │   ├── ResultsController.ts   # GET /api/diagnostic-reports
            │   │   │   ├── OrdersController.ts    # GET + DELETE /api/service-requests
            │   │   │   ├── PatientsController.ts  # GET /api/patients
            │   │   │   ├── ConfigController.ts    # GET/POST /api/config
            │   │   │   └── EnvController.ts       # GET/POST /api/env
            │   │   ├── dto/
            │   │   │   ├── ResultDto.ts           # ListResultsQueryDto, ResultResponseDto, PagedResultsResponseDto
            │   │   │   ├── OrderDto.ts            # OrderResponseDto, ListOrdersResponseDto, DeleteOrderResponseDto
            │   │   │   ├── PatientDto.ts
            │   │   │   └── ConfigDto.ts           # ConfigEntryDto, ConfigSource union
            │   │   └── openapi.ts                 # OpenAPI 3.0 spec (TypeScript const, single source of truth)
            │   ├── fhir/
            │   │   ├── FhirClient.ts              # Server-side FHIR HTTP; exports FHIR_BASE
            │   │   ├── DiagnosticReportMapper.ts  # FhirDiagnosticReport → domain Result
            │   │   └── ObservationMapper.ts       # FHIR Observation → Analysis entity
            │   ├── repositories/
            │   │   ├── FhirResultRepository.ts    # IResultRepository → /api/diagnostic-reports
            │   │   └── FhirOrderRepository.ts     # IOrderRepository → /api/service-requests
            │   ├── config/
            │   │   ├── EnvConfig.ts               # Server-only env vars with typed defaults
            │   │   └── RuntimeConfig.ts           # 3-tier override: config.json → env → default
            │   └── logging/
            │       └── Logger.ts                  # Structured JSON logger; stdout + optional file
            ├── presentation/          # React hooks + feature components + design system
            │   ├── hooks/
            │   │   ├── useResults.ts  # search(), setPage(), reload()
            │   │   └── useOrders.ts   # list, delete
            │   ├── components/
            │   │   ├── ResultList.tsx
            │   │   ├── SearchBar.tsx  # Debounced 350ms
            │   │   ├── PatientCard.tsx
            │   │   └── PreviewModal.tsx
            │   ├── pages/
            │   │   ├── ResultsPage.tsx
            │   │   └── OrdersPage.tsx
            │   └── ui/                # Design system
            │       ├── index.ts       # Barrel: Button, Input, Select, Card, Badge, Loader, EmptyState, theme
            │       ├── theme.ts       # TypeScript token reference (var(--zt-*))
            │       ├── Button.tsx     # variant: primary/secondary/danger/ghost; loading
            │       ├── Input.tsx      # label, error (aria-invalid), hint, prefix/suffix
            │       ├── Select.tsx
            │       ├── Card.tsx       # title, subtitle, headerAction, noPadding
            │       ├── Badge.tsx      # 7 color variants + hover tooltip
            │       ├── Loader.tsx     # SkeletonRows, SkeletonBlock, PageLoader
            │       └── EmptyState.tsx
            ├── shared/                # Framework-agnostic; no React, no Node-only APIs
            │   ├── utils/
            │   │   ├── formatDate.ts  # formatDate(date?) → DD.MM.YYYY
            │   │   └── base64.ts      # b64toDataUrl(), decodeB64Utf8()
            │   └── config/
            │       └── AppConfig.ts   # Client-safe config (NEXT_PUBLIC_* only)
            ├── components/            # LEGACY — do not restructure; only add imports
            │   ├── AppHeader.tsx      # White topbar; logo left; locale/refresh/auth right
            │   ├── Table/
            │   ├── AllergyMenu.tsx
            │   └── ZetLabLogo.tsx
            ├── lib/                   # LEGACY — do not restructure; only add imports
            │   ├── auth.ts            # HMAC-SHA256 signed session cookies
            │   ├── userStore.ts       # data/users.json flat-file user store (scrypt)
            │   ├── localAuth.ts       # Browser localStorage auth fallback
            │   ├── localAuthShared.ts # Cookie name shared between server/client
            │   ├── appConfig.ts       # Thin re-export bridge
            │   ├── i18n.ts            # useTranslation() hook
            │   ├── refresh.ts         # useRefresh() hook (manual + auto-refresh intervals)
            │   └── fhir.ts            # fhirGet, fhirPost, Bundle/Resource types (legacy)
            └── messages/              # i18n translation files
                ├── de.json            # German (primary)
                ├── en.json
                ├── fr.json
                └── it.json
```

---

## 2. Architecture Mapping

### Layer Rules (strictly enforced)

```
domain ← application ← infrastructure
                     ← presentation
                     ← app (Next.js)
shared ← everything
```

| Layer | Folder | What lives here | Dependencies |
|---|---|---|---|
| **Domain** | `src/domain/` | Entities, value objects, use cases, factories. Pure TypeScript. | None |
| **Application** | `src/application/` | Repository interfaces, services, strategies. | Domain only |
| **Infrastructure** | `src/infrastructure/` | FHIR client, mappers, repositories, controllers, DTOs, config, logger. | Domain + Application |
| **Presentation** | `src/presentation/` | React hooks, feature components, design system. | Domain + Application (via ServiceFactory) |
| **App** | `src/app/` | Next.js App Router: thin route handlers + page imports. | Infrastructure + Presentation |
| **Shared** | `src/shared/` | Pure utilities, client-safe config. | None |
| **Legacy** | `src/lib/`, `src/components/` | Auth, user store, FHIR helpers, AppHeader. Off-limits for restructuring. | Mixed |

### Business Logic Location

- **Pure rules:** `src/domain/` — entities, value objects, factories, use cases
- **Orchestration:** `src/application/services/` — coordinates use cases
- **Search heuristics:** `src/application/strategies/PatientSearchStrategy.ts`
- **FHIR integration:** `src/infrastructure/fhir/` — mappers and client
- **HL7 transformation:** Orchestra OIE Juno (external — not in Next.js code)

### External System Integration Points

| System | Integration point |
|---|---|
| HAPI FHIR R4 | `src/infrastructure/fhir/FhirClient.ts` (server-side) + API route proxies |
| HL7 / LIS | Orchestra OIE Juno (receives FHIR subscriptions, emits HL7 ORM^O01) |
| SASIS (VeKa) | `src/app/api/insurance-lookup/route.ts` (proxied to Orchestra) |
| GLN / Refdata | `src/app/api/gln-lookup/route.ts` (proxied to Orchestra) |
| PostgreSQL | Used only by HAPI FHIR — not accessed directly by Next.js |

---

## 3. Key Files

### Entry Points

| File | Purpose |
|---|---|
| `src/app/layout.tsx` | Root layout; mounts AppHeader; `export const dynamic = "force-dynamic"` |
| `src/app/page.tsx` | Home page — 3 buttons: Anfordern, Aufträge, Befunde |
| `src/app/order/[id]/layout.tsx` | Legacy order-entry layout (main clinical workflow) |
| `Dockerfile` | Multi-stage Next.js build → standalone output |
| `scripts/write-version.mjs` | Injects `NEXT_PUBLIC_APP_VERSION` from git before build |

### Configuration

| File | Purpose |
|---|---|
| `backend/docker/docker-compose.yml` | Full production stack definition |
| `backend/docker/.env` | Secrets: AUTH_SECRET, FHIR_BASE_URL, DB creds, domains |
| `backend/docker/data/hapi/config/application.yaml` | HAPI FHIR: PostgreSQL, REST-hook subscriptions, CORS |
| `src/app/globals.css` | CSS design tokens (`--zt-primary`, `--zt-bg-page`, etc.) + Tailwind `@theme inline` |
| `src/infrastructure/config/EnvConfig.ts` | All server-side env vars with typed getters and defaults |
| `src/shared/config/AppConfig.ts` | Client-safe `NEXT_PUBLIC_*` config |
| `src/infrastructure/config/RuntimeConfig.ts` | 3-tier: `data/config.json` → `process.env` → hardcoded default |
| `data/config.json` | GUI-editable runtime overrides (immediate effect, no restart) |
| `data/users.json` | Local user account store (gitignored) |

### FHIR / HL7

| File | Purpose |
|---|---|
| `src/infrastructure/fhir/FhirClient.ts` | Server-side FHIR HTTP client; exports `FHIR_BASE` constant |
| `src/infrastructure/fhir/DiagnosticReportMapper.ts` | `FhirDiagnosticReport` → domain `Result` entity |
| `src/infrastructure/fhir/ObservationMapper.ts` | FHIR `Observation` → domain `Analysis` entity |
| `backend/orchestra/fhir/FHIR_to_HL7_ORM_Mapping.md` | Complete MSH/PID/PV1/IN1/ORC/OBR field-level mapping spec |
| `backend/orchestra/fhir/Subscription/ServiceRequest_Subscription.json` | Criteria: `ServiceRequest?status=active` → Orchestra webhook |
| `backend/orchestra/Runtime/sc_OrderEntry_Middleware.psc` | Orchestra scenario — FHIR→HL7 transformation and routing |
| `LIS/Hl7/ORM/EXAMPLE_ORM.hl7` | Real HL7 ORM^O01 reference from ZLZ LIS |

### Authentication / Security

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | HMAC-SHA256 cookie signing: `signSession()`, `verifySession()`, `requireAuth()` |
| `src/lib/userStore.ts` | `data/users.json` user store; `crypto.scrypt` password hashing |
| `src/lib/localAuth.ts` | Browser localStorage fallback auth (client-only) |
| `src/app/api/login/route.ts` | POST: validates creds → signs session → sets httpOnly cookie |
| `src/app/api/logout/route.ts` | Clears session cookie |
| `src/app/api/me/route.ts` | Returns `{ authenticated, username }` |

### API Layer

| File | Purpose |
|---|---|
| `src/infrastructure/api/openapi.ts` | OpenAPI 3.0 spec (TypeScript `const`) — single source of truth |
| `src/infrastructure/api/controllers/ResultsController.ts` | FHIR DiagnosticReport search + count (parallel); maps → DTOs |
| `src/infrastructure/api/controllers/OrdersController.ts` | List + hard-DELETE with 409→soft-delete fallback |
| `src/infrastructure/api/controllers/PatientsController.ts` | Patient search with name/pagination |
| `src/infrastructure/api/controllers/ConfigController.ts` | Runtime config GUI; Vercel POST→405 |
| `src/infrastructure/api/controllers/EnvController.ts` | `.env.local` GUI editor; Vercel POST→405 |
| `src/infrastructure/api/dto/*.ts` | Plain TypeScript interfaces (no classes, no decorators) |
| `src/app/api/docs/route.ts` | Swagger UI via CDN; `withCredentials: true` |

### Design System

| File | Purpose |
|---|---|
| `src/app/globals.css` | All CSS custom properties (`--zt-*`) and `@theme inline` Tailwind mappings |
| `src/presentation/ui/theme.ts` | TypeScript token reference: `theme.colors.primary = "var(--zt-primary)"` |
| `src/presentation/ui/Button.tsx` | 4 variants (primary/secondary/danger/ghost) × 3 sizes |
| `src/presentation/ui/index.ts` | Barrel export — always import from `@/presentation/ui` |

---

## 4. Data Flow

### Order Creation (Main Clinical Workflow)

```
Clinician (browser) fills order form at /order/[id]
  │  [LEGACY path — direct FHIR call, not via CA]
  ├─ fhirPost("/ServiceRequest", body)  ← src/lib/fhir.ts
  ▼
HAPI FHIR R4 (http://hapi-fhir:8080/fhir)
  │  Stores ServiceRequest with status=active
  │  Evaluates FHIR Subscription: ServiceRequest?status=active → match
  ▼
Orchestra OIE Juno (http://orchestra:8019)
  │  Receives REST-hook POST to /middleware/api/v1/notification/fhir
  │  Fetches full FHIR resources:
  │    ServiceRequest, Patient, Practitioner, PractitionerRole,
  │    Organization, Coverage, Encounter
  │  Executes sc_OrderEntry_Middleware.psc scenario:
  │    FHIR fields → HL7 v2.5 ORM^O01 segments (MSH/PID/PV1/IN1/ORC/OBR)
  │    See: backend/orchestra/fhir/FHIR_to_HL7_ORM_Mapping.md
  ▼
LIS (ZLZ Labsoft)
  │  Receives ORM^O01 via HL7 MLLP or file channel
  │  Processes samples, runs tests
  │  Returns results → DiagnosticReport stored back to HAPI FHIR
  ▼
Clinician views results at /results
  └─ useResults() → ServiceFactory.resultService()
       → FhirResultRepository → GET /api/diagnostic-reports
         → ResultsController → HAPI /DiagnosticReport
           → DiagnosticReportMapper.toDomain() → Result entity
             → ResultsPage / ResultList (PDF/HL7 preview available)
```

### Patient Search

```
Input → SearchBar (350ms debounce)
  → PatientSearchStrategy.resolve(input)
      PatientIdStrategy: /^\d{5,}$/ or UUID → { patientId: "..." }
      PatientNameStrategy: fallback         → { patientName: "..." }
  → GET /api/patients?name=... or ?patientId=...
  → PatientsController → HAPI /Patient
  → PatientResponseDto[] → UI list
```

### Authentication Flow

```
POST /api/login { username, password }
  → userStore.verifyUser() [scrypt check against data/users.json]
  → auth.signSession(userId, username) → "<b64payload>.<b64sig>"
  → Set-Cookie: session=<token>; HttpOnly; SameSite=Lax; Secure (prod)

Subsequent requests:
  → Cookie: session=<token>
  → auth.verifySession(token) → checks HMAC + expiry
  → requireAuth() redirects to /login if invalid
```

### Runtime Config Override

```
GET /api/config
  → ConfigController.get()
  → RuntimeConfig.getAll()
  → For each key: configOverride[key] ?? process.env[key] ?? DEFAULT[key]
  → Returns { entries: [{ key, value, source: "override"|"env"|"default" }] }

POST /api/config { overrides: { FHIR_BASE_URL: "http://..." } }
  → isVercel() → 405 (Vercel)
  → saveOverrides() → writes data/config.json
  → Effective immediately on next request (no restart)
```

---

## 5. Config System

### Three Layers (distinct purposes)

#### Layer 1 — Build/startup: Environment Variables

- Loaded once by Next.js at process start
- **Local dev:** `.env.local` (merged by Next.js)
- **Docker:** `environment:` section in `docker-compose.yml`
- **Vercel:** Vercel dashboard
- Restart required for changes

#### Layer 2 — Server-only: `EnvConfig.ts`

```typescript
// src/infrastructure/config/EnvConfig.ts
EnvConfig.fhirBaseUrl    // FHIR_BASE_URL | "http://localhost:8080/fhir"
EnvConfig.authSecret     // AUTH_SECRET | "dev-secret-change-me"
EnvConfig.allowLocalAuth // ALLOW_LOCAL_AUTH | false
EnvConfig.logLevel       // LOG_LEVEL | "info"
EnvConfig.logFile        // LOG_FILE | ""
EnvConfig.sasísApiBase   // SASIS_API_BASE | ""
EnvConfig.glnApiBase     // GLN_API_BASE | Orchestra default URL
```

#### Layer 3 — Client-safe: `AppConfig.ts`

```typescript
// src/shared/config/AppConfig.ts  (NEXT_PUBLIC_* only)
AppConfig.appVersion      // NEXT_PUBLIC_APP_VERSION (set at build)
AppConfig.forceLocalAuth  // NEXT_PUBLIC_FORCE_LOCAL_AUTH
AppConfig.sasísEnabled    // NEXT_PUBLIC_SASIS_ENABLED
AppConfig.glnEnabled      // NEXT_PUBLIC_GLN_ENABLED
AppConfig.defaultPageSize // 20 (hardcoded)
AppConfig.searchDebounceMs // 350 (hardcoded)
```

#### Layer 4 — Runtime override: `RuntimeConfig.ts`

```typescript
// Priority chain:
const value = configOverride[key] ?? process.env[key] ?? DEFAULTS[key]

// Supported keys: FHIR_BASE_URL, LOG_LEVEL, LOG_FILE, TRACING_ENDPOINT, METRICS_DASHBOARD_URL
// Store: data/config.json (gitignored, writable in Docker)
// Effect: immediate (read on every request)
// Vercel: POST /api/config → 405
```

---

## 6. Auth & Security

### Primary: HMAC-SHA256 Session Cookies

- **Library:** None — custom implementation in `src/lib/auth.ts`
- **Algorithm:** HMAC-SHA256, key = `AUTH_SECRET` env var
- **Format:** `<base64url-JSON-payload>.<base64url-signature>` (NOT a JWT)
- **Cookie:** `session`, `httpOnly: true`, `sameSite: "lax"`, `secure: true` (production), `maxAge: 86400` (24h)
- **Session payload:** `{ sub: userId, username, iat, exp }`
- **Default secret:** `"dev-secret-change-me"` — **must be changed in production**

### Fallback: Browser localStorage Auth

- **Enabled by:** `NEXT_PUBLIC_FORCE_LOCAL_AUTH=true` OR `ALLOW_LOCAL_AUTH=true`
- **Client:** `src/lib/localAuth.ts` — stores users in `localStorage`, SHA-256 via Web Crypto API
- **Cookie:** Plain unsigned `localSession=<id>|<username>` (URL-encoded)
- **Server:** `src/lib/auth.ts` reads and trusts `localSession` only when `ALLOW_LOCAL_AUTH=true`
- **Purpose:** Read-only filesystem environments; NOT for production

### User Store

- **File:** `data/users.json` (gitignored, Docker bind-mounted at `/app/data`)
- **Hashing:** Node.js `crypto.scrypt`
- **No roles:** All users have equal access
- **Registration:** `POST /api/signup`

### API Protection

- **Pattern:** Each protected page/layout calls `requireAuth()` → `redirect("/login")` if invalid
- **No global middleware:** No `middleware.ts` at Next.js root — each route individually protected
- **No RBAC:** No role enforcement anywhere

### Security of External Calls

- All FHIR calls are server-side (Next.js API routes proxying to HAPI — browser never calls FHIR directly)
- SASIS and GLN lookups are proxied through Next.js
- Orchestra is only accessible on the internal Docker network

---

## 7. Deployment

### Docker Compose Services

| Service | Image | Internal Port | Purpose |
|---|---|---|---|
| `traefik` | `traefik:v3.0` | 80, 443 | Reverse proxy, HTTPS, Let's Encrypt |
| `postgres` | `postgres:15` | 5432 | PostgreSQL for HAPI FHIR |
| `hapi` | `hapiproject/hapi:latest` | 8080 | HAPI FHIR R4 server |
| `orchestra` | `farian/oie-juno:4.10.1.1` | 8090 (UI), 8019 (API) | OIE Juno; FHIR→HL7 middleware |
| `orderentry` | `farian/orderentry:latest` | 3000 | Next.js app |
| `watchtower` | `containrrr/watchtower` | — | Auto-updates orderentry daily at 03:00 |
| `portainer` | `portainer/portainer-ce` | 9000 | Container management UI |

### Network

- All services on bridge network `orderentry-orc-net` (subnet `172.20.128.0/24`)
- Traefik routes public traffic via HTTPS to each service by `Host()` rule
- HAPI and Orchestra are not directly exposed to internet (no port mappings)

### Domain Pattern (`.env`)

```
BASE_DOMAIN=z2lab.ddns.net
orderentry.${BASE_DOMAIN}     → Next.js app (port 3000)
hapi.${BASE_DOMAIN}           → HAPI FHIR (port 8080)
orchestra.${BASE_DOMAIN}      → Orchestra UI (port 8090)
api-orchestra.${BASE_DOMAIN}  → Orchestra API (port 8019)
traefik.${BASE_DOMAIN}        → Traefik dashboard
portainer.${BASE_DOMAIN}      → Portainer
```

### Frontend Docker Build

```bash
# From frontend/zetlab/
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t farian/orderentry:latest \
  --push .
```

`next.config.mjs`: `output: "standalone"` when `process.env.VERCEL` is not set.

### Vercel Compatibility

- `output: "standalone"` omitted on Vercel (auto-detected via `VERCEL` env var)
- `POST /api/config` → 405 (filesystem read-only)
- `POST /api/env` → 405 (filesystem read-only)
- All GET operations work on both platforms

### Known Operational Issue

Orchestra OIE Juno (`farian/oie-juno:4.10.1.1`) is **amd64-only**. ARM64 hosts require QEMU emulation:

```bash
docker run --privileged --rm tonistiigi/binfmt --install all
```

---

## 8. Problems / Gaps

### 1. Duplicate FHIR Mapping Logic

`DiagnosticReportMapper.ts` maps FHIR → domain `Result`. `ResultsController.ts` has its own inline `mapReport()` doing the same mapping directly to DTOs. Two separate code paths for the same transformation — changes must be applied twice.

**Fix:** `ResultsController` should use `DiagnosticReportMapper.toDomain()`, then map domain entity → DTO.

### 2. No Global Authentication Middleware

No `src/middleware.ts` at the Next.js root. Any new route that forgets to call `requireAuth()` is publicly accessible. Protection is opt-in per-page.

**Fix:** Add `middleware.ts` covering all non-public routes.

### 3. No Role-Based Access Control

All authenticated users have equal access. No clinician vs. admin vs. lab staff distinction.

**Fix:** Add `role` field to `SessionPayload` and `users.json`; enforce in `requireAuth()`.

### 4. Legacy Order Entry Not in Clean Architecture

`src/app/order/[id]/` (main clinical workflow) calls `fhirGet`/`fhirPost` directly from the page component, completely bypassing the domain/application/infrastructure layers. No testability.

**Fix:** Migrate to CA — domain use case `CreateOrder`, `FhirOrderRepository`, presentation-layer `OrderEntryPage`.

### 5. API Routes Not Uniformly Protected

`GET /api/diagnostic-reports`, `GET /api/service-requests`, etc. do not verify session tokens. They proxy to HAPI (internal only), but any request reaching Next.js can access patient data if Traefik is misconfigured.

**Fix:** Add session verification in controllers, or via global middleware.

### 6. Dev Secret Default in Production Risk

`AUTH_SECRET` defaults to `"dev-secret-change-me"`. Forgetting to set it in production allows anyone to forge valid session cookies.

**Fix:** Throw at startup if `AUTH_SECRET === "dev-secret-change-me"` and `NODE_ENV === "production"`.

### 7. Flat-File User Store

`data/users.json` is not suitable for multi-instance or HA deployments.

**Fix:** Migrate to PostgreSQL (already available) or integrate an identity provider (Keycloak, OAuth2).

### 8. Dual Test Runner Confusion

Both `jest.config.ts` (Jest 29 + ts-jest) and `vitest.config.ts` (Vitest 4) exist. `npm test` runs Vitest. `CLAUDE.md` references Jest as primary.

**Fix:** Remove Jest or Vitest; update CLAUDE.md accordingly.

### 9. OpenAPI Spec Drift Risk

`src/infrastructure/api/openapi.ts` must be manually kept in sync with controllers. No automated contract tests.

**Fix:** Add a contract test asserting response shapes match the spec.

### 10. React Version Discrepancy

`package.json` declares `react: "18.2.0"` but `@types/react: "^19"` and `CLAUDE.md` states "React 19.1". Runtime/type mismatch.

**Fix:** Align `package.json` to React 19.x or update CLAUDE.md.

### 11. CORS Allows All Origins on HAPI

`application.yaml` sets `allowedOriginPatterns: "*"` with `allowCredentials: true`. Risk if HAPI is accidentally exposed publicly.

**Fix:** Restrict to exact frontend domain.

### 12. Orchestra amd64-Only (Operational Risk)

ARM64 servers require QEMU emulation → performance penalty, potential instability.

**Fix:** Build a native arm64 OIE Juno image or document the amd64-only server requirement.

---

## 9. FHIR → HL7 ORM^O01 Mapping Summary

Full spec: `backend/orchestra/fhir/FHIR_to_HL7_ORM_Mapping.md`

### FHIR Resources Used

| FHIR Resource | HL7 Segment | Role |
|---|---|---|
| `ServiceRequest` | ORC + OBR | The lab order |
| `Patient` | PID | Patient identification |
| `Encounter` | PV1 | Clinical visit context |
| `Coverage` | IN1 | Insurance |
| `Practitioner` + `PractitionerRole` | ORC.12, PV1.7 | Ordering doctor + GLN |
| `Organization` | ORC.21-23 | Ordering facility |

### Key Field Mappings

| HL7 | Source | Example |
|---|---|---|
| MSH.4 | `Organization.identifier` (GLN) | `7601009336904` |
| PID.2 | `Patient.identifier` (AHV OID 2.16.756.5.32) | `756.1234.5678.97` |
| PID.5 | `Patient.name[0].family^given` | `Arian^Farhad` |
| ORC.1 | Hardcoded (new order) | `NW` |
| ORC.12 | `Practitioner.identifier^name.family^name.given^^^^^^^^GLN` | `7601001619241^Dede^Ersin^^^^^^^^GLN` |
| OBR.4 | `ServiceRequest.code.coding[LOINC]` | `1988-5^CRP^LN` |

### Swiss-Specific Identifiers

| OID | System | Used In |
|---|---|---|
| `urn:oid:2.51.1.3` | Swiss GLN | Organization, Practitioner |
| `urn:oid:2.16.756.5.32` | Swiss AHV | Patient.identifier (PID.2) |
| `urn:oid:2.16.756.5.30.1.123.1.1` | Swiss KVK (insurance card) | Patient.identifier (PID.3), Coverage (IN1.36) |
| `http://loinc.org` | LOINC | ServiceRequest.code (OBR.4) |

---

## 10. Design System (Theme)

### Token System

All colors defined as CSS custom properties in `src/app/globals.css`, exposed as Tailwind v4 utilities via `@theme inline`.

| Token Group | CSS Prefix | Tailwind Classes |
|---|---|---|
| Primary (ZLZ blue `#185FA5`) | `--zt-primary*` | `bg-zt-primary`, `text-zt-primary`, `border-zt-primary-border` |
| Success (green `#3B6D11`) | `--zt-success*` | `bg-zt-success`, `bg-zt-success-light` |
| Danger (red `#E24B4A`) | `--zt-danger*` | `bg-zt-danger`, `bg-zt-danger-light` |
| Warning (amber) | `--zt-warning*` | `bg-zt-warning-bg`, `text-zt-warning-text` |
| Surface | `--zt-bg-*` | `bg-zt-bg-page` (#f4f5f7), `bg-zt-bg-card` (#fff) |
| Border | `--zt-border*` | `border-zt-border` (#e0e0e0), `border-zt-border-strong` |
| Text | `--zt-text-*` | `text-zt-text-primary` (#1a1a1a), `text-zt-text-secondary` (#666) |
| Topbar | `--zt-topbar-*` | `bg-zt-topbar-bg` (#fff), `border-zt-topbar-border` |

**Rule:** Never use hardcoded Tailwind color names (`bg-blue-600`, `text-gray-700`) in new code. Always use `zt-*` tokens.

**Dark theme:** Ready — add `.dark` class to `<html>` to activate `:root.dark` overrides. No component changes needed.

### Design System Components

| Component | Variants / Key Props |
|---|---|
| `Button` | `variant`: primary/secondary/danger/ghost · `size`: sm/md/lg · `loading` (inline Spinner) |
| `Input` | `label`, `error` (aria-invalid), `hint`, `prefix`/`suffix` icons |
| `Select` | `SelectOption[]`, `placeholder`, `label`, `error` |
| `Card` | `title`, `subtitle`, `headerAction` slot, `noPadding` |
| `Badge` | 7 color variants (gray/blue/green/yellow/red/purple/indigo) + `icon` + hover tooltip |
| `Loader` | `SkeletonRows` (table), `SkeletonBlock` (text), `PageLoader` (spinner) |
| `EmptyState` | `icon`, `title`, `description`, action slot; `role="status"` |

Import always from barrel: `import { Button, Card, theme } from "@/presentation/ui"`
