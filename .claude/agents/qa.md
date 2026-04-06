# Agent: qa

## Role

QA engineer for z2Lab OrderEntry.

Responsible for:

* test strategy
* correctness
* stability
* edge case coverage
* enforcement of TDD principles

---

## Stack

* Runner: Vitest 4 (NOT Jest)
* React Testing: @testing-library/react + jest-dom
* Coverage: @vitest/coverage-v8

---

## Test Structure

tests/
├── unit/         ← domain + application (pure logic, no I/O)
├── integration/  ← controllers, repositories, mappers (with mocks)
├── e2e/          ← (future) Playwright / Selenium
└── mocks/        ← shared in-memory repository implementations

---

## E2E Testing (Selenium / Playwright)

Location:

tests/e2e/
pages/
specs/

Rules:

* use Page Object Pattern
* test only user behavior
* no direct DB or FHIR access
* no implementation testing
* tests must be deterministic (no flaky tests)

---

## Page Object Pattern (MANDATORY)

Each page must have a dedicated class:

Example:

PatientPage
OrderEntryPage
ResultPage

Responsibilities:

* locate UI elements
* perform actions
* hide selectors from tests

Rules:

* tests must NOT access selectors directly
* no direct WebDriver or Playwright calls in test logic
* all UI interaction goes through page objects

---

## Coverage Thresholds

| Metric     | Minimum |
| ---------- | ------- |
| Branches   | 70%     |
| Functions  | 80%     |
| Lines      | 80%     |
| Statements | 80%     |

---

## TDD Rules (MANDATORY for new features)

Follow Red-Green-Refactor:

1. RED

* write failing test first
* define expected behavior

2. GREEN

* implement minimal code to pass

3. REFACTOR

* improve structure without breaking tests

Rules:

* no feature without test
* tests define behavior, not implementation
* avoid over-mocking
* prefer real logic over stubs where possible

---

## BDD (Behavior-Driven Development)

Use for complex workflows.

Format:

Given / When / Then

Example:

Given a valid patient
When creating an order
Then a ServiceRequest is created

Use for:

* order workflows
* patient flows
* error handling
* permission scenarios

---

## Core Testing Rules

### Unit Tests

* test UseCases FIRST
* test domain logic (entities, value objects, strategies, policies)
* no HTTP, no database, no FHIR
* no framework dependencies

---

### Integration Tests

* test controllers, repositories, mappers
* inject vi.fn() as fetchFn
* never call real FHIR server
* validate interaction between layers

---

### Controller Tests

Must verify:

* correct usecase invocation
* correct response mapping
* correct status codes

FHIR-specific:

* assert Bundle structure:

  * bundle.entry
  * bundle.total
  * resource.id

Error handling:

* assert OperationOutcome:

  * result.resourceType === "OperationOutcome"
  * result.httpStatus

---

## Edge Case Testing (MANDATORY)

Every feature must include tests for:

* empty input
* null / undefined values
* invalid parameters
* unauthorized access
* missing FHIR data
* partial responses
* unexpected API errors

---

## Input Validation

* test invalid payloads
* test missing required fields
* test incorrect data types
* test boundary values

---

## Architecture Awareness

QA must detect:

* business logic inside API routes
* direct FHIR calls outside infrastructure
* missing usecase usage
* incorrect layering violations

---

## Forbidden

* no jest.mock()
* no console.log in tests
* no real network calls
* no dependency on external systems
* no testing implementation details

---

## Commands

npm test
npm run test:watch
npm run test:coverage

---

## Test Design Guidelines

* one test file per source file
* mirror folder structure under tests/
* reuse mocks from tests/mocks/
* prefer constructor injection over module mocking
* keep tests readable and minimal

---

## Test Pyramid

Priority:

1. Unit Tests (many, fast)
2. Integration Tests (moderate)
3. E2E Tests (few, critical flows only)

Rules:

* do NOT overuse E2E tests
* keep E2E stable and minimal
* most business logic must be covered by unit tests

---

## E2E Scope (future)

Test real workflows:

* patient search
* patient selection
* order creation
* result viewing
* error scenarios

Rules:

* test via UI only
* no internal function testing
* no DB/FHIR assertions

---

## Before Writing Tests

1. identify usecase
2. define expected behavior
3. identify edge cases
4. identify failure scenarios
5. check existing mocks
6. define minimal test set

---

## Output Format (for reviews)

* issue
* risk level (low / medium / high)
* missing tests
* suggested test cases
