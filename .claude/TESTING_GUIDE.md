# Testing Guide — z2Lab OrderEntry

## Framework

**Vitest 4**. The `npm test` script runs `vitest run`.

Config: `frontend/orderentry/vitest.config.ts` — `resolve.alias` maps `@/*` → `src/*`; globals enabled.

### Default environment: `node` (NOT jsdom)

`environment: "node"` is the default because:
- No test in this repo currently uses DOM matchers (`toBeInTheDocument`, etc.).
- jsdom@29 → cssstyle@4 → `@asamuzakjp/css-color@3.2` contains top-level await,
  which Node 20 forbids loading via `require()` — choosing jsdom as default
  breaks the entire test run on CI with `ERR_REQUIRE_ASYNC_MODULE`.

If a future test needs the DOM, opt in **per file**:

```ts
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import "@testing-library/jest-dom"; // import jest-dom locally, NOT in vitest.setup.ts
```

Do NOT add `@testing-library/jest-dom` to `vitest.setup.ts` globally — that
forces jsdom to load for every test file and reintroduces the CI crash.

## Mock Usage

`jest.fn()` / `jest.mock()` / `jest.spyOn()` work because `vitest.setup.ts` shims `globalThis.jest = vi`.
For new tests, prefer `vi.fn()` / `vi.mock()` directly. Use `vi.hoisted()` to declare mock references before `vi.mock()` factory runs:

```typescript
import { vi } from "vitest";
const m = vi.hoisted(() => ({ myFn: vi.fn() }));
vi.mock("@/lib/someModule", () => ({ myFn: m.myFn }));
```

- Controller tests for file-store-backed controllers use `vi.mock("@/lib/userStore", ...)`.
- Controller tests for FHIR-backed controllers inject a `vi.fn()` mock as `fetchFn`.

### Controller test pattern — FHIR-backed (e.g. LaunchController)

```typescript
import { vi } from "vitest";
const mockFetch = vi.fn();
const controller = new LaunchController("http://fhir-test", mockFetch);

mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(bundle) });
const result = await controller.launch(validPayload);
expect(result.httpStatus).toBe(200);
```

### Controller test pattern — JWT guard (JwtGuard)

```typescript
import { vi } from "vitest";
const m = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock("jsonwebtoken", () => ({ default: { verify: m.verify } }));

// Valid token
m.verify.mockReturnValue({ sub: "u-1", patientId: "p-1", ... });
expect(guard.verify(token)).toBeTruthy();

// Expired token
m.verify.mockImplementation(() => { throw new Error("jwt expired"); });
expect(() => guard.verify(token)).toThrow();
```

## Test Structure

```
tests/
├── unit/
│   ├── domain/
│   │   ├── useCases/          # GetResults, SearchResults, GetOrders, CreateOrder
│   │   ├── factories/         # ResultFactory, OrderFactory
│   │   └── valueObjects/      # OrderNumber, Identifier
│   └── application/
│       └── strategies/        # PatientSearchStrategy
├── integration/
│   └── infrastructure/
│       ├── DiagnosticReportMapper.test.ts  # real FHIR-shaped objects, no mocks
│       └── api/
│           ├── OrdersController.test.ts
│           ├── PatientsController.test.ts
│           ├── ResultsController.test.ts
│           ├── UsersController.test.ts
│           ├── SignupRoute.test.ts
│           ├── PractitionersRoute.test.ts
│           ├── LaunchController.test.ts    # JWT valid/invalid/expired, session creation
│           └── JwtGuard.test.ts            # claim validation, expiry, wrong issuer
├── e2e/                       # (future — Playwright)
└── mocks/
    ├── MockResultRepository.ts  # In-memory IResultRepository; seed(), reset()
    └── MockOrderRepository.ts   # In-memory IOrderRepository; tracks deletedIds, createdOrders
```

## Rules

- **Unit tests** (`tests/unit/`) — no I/O, no HTTP, no DOM. Use mock repositories from `tests/mocks/`.
- **Integration tests** (`tests/integration/`) — use real class instances wired together; no `fetch` mocks; no external services.
- **Never mock the repository in integration tests** — integration tests exist to verify the real object graph.
- **Coverage thresholds:** branches 70%, functions/lines/statements 80% (enforced by `vitest.config.ts`).
- **Test file naming:** `*.test.ts` (pure logic) or `*.test.tsx` (React components).
- **New controller** → integration test in `tests/integration/infrastructure/api/`.
- **New domain logic** → unit test in `tests/unit/domain/`.
- **New use case** → unit test in `tests/unit/domain/useCases/`.
- Prefer `vi.fn()` / `vi.mock()` over `jest.fn()` / `jest.mock()` in new tests.

## Running Tests

```bash
# From frontend/zetlab/
npm install           # Required first time — installs vitest, @testing-library/*
npm test              # All tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (thresholds: branches 70%, functions/lines/stmts 80%)
```
