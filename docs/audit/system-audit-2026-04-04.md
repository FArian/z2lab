# z2Lab OrderEntry — Professional System Audit Report

**Scope:** ZLZ Zentrallabor AG / ZetLab AG — Laboratory Order Entry System
**Architecture:** Next.js 15.5 · HAPI FHIR R4 · Docker Compose · Clean Architecture
**Assessment Date:** 2026-04-04
**Auditor:** Architecture & Standards Review (Claude Sonnet 4.6)
**Status:** Draft — Findings pending implementation review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Per-Standard Evaluation](#2-per-standard-evaluation)
   - 2.1 [ISO/IEC 25010 — Software Quality Model](#21-isoiec-25010--software-quality-model)
   - 2.2 [ISO/IEC 27001 — Information Security Management](#22-isoiec-27001--information-security-management)
   - 2.3 [ISO/IEC 27701 — Privacy Information Management](#23-isoiec-27701--privacy-information-management)
   - 2.4 [ISO/IEC 27034 — Application Security](#24-isoiec-27034--application-security)
   - 2.5 [ISO 9241 — Human-System Interaction](#25-iso-9241--human-system-interaction)
   - 2.6 [ISO 13485 — Medical Device Quality Management](#26-iso-13485--medical-device-quality-management)
   - 2.7 [ISO 14971 — Medical Device Risk Management](#27-iso-14971--medical-device-risk-management)
   - 2.8 [ISO/IEC 29119 — Software Testing](#28-isoiec-29119--software-testing)
3. [Cloud-Native Readiness](#3-cloud-native-readiness)
4. [Security Assessment](#4-security-assessment)
5. [Usability Assessment](#5-usability-assessment)
6. [Risk Assessment — Medical Context](#6-risk-assessment--medical-context)
7. [Priority Roadmap](#7-priority-roadmap)
8. [Architecture Feedback](#8-architecture-feedback)

---

## 1. Executive Summary

| Dimension | Maturity |
|---|---|
| Software Quality (ISO 25010) | **High** |
| Security (ISO 27001/27034) | **Medium–High** |
| Privacy (ISO 27701) | **Medium** |
| Medical Risk (ISO 13485/14971) | **Medium** |
| Usability (ISO 9241) | **High** |
| Testing (ISO 29119) | **Medium** |
| Cloud-Native / Docker | **High** |
| Kubernetes Readiness | **Medium** |
| OpenShift Compatibility | **Medium** |
| CIS Docker Benchmark | **Medium–High** |

### Overall Maturity: High — not yet Enterprise/Regulated-Grade

The system demonstrates professional engineering quality well above typical internal tools. Clean Architecture is applied consistently. The Docker stack is production-hardened. The main gaps are in regulated medical context: no formal risk management artefacts, no data-at-rest encryption, incomplete audit trails for clinical operations, and no Kubernetes manifests. These are not implementation failures — they are deliberate stage-gates not yet reached.

---

## 2. Per-Standard Evaluation

---

### 2.1 ISO/IEC 25010 — Software Quality Model

#### 2.1.1 Functional Suitability — ✅ Compliant

**Findings — Good:**
- Core workflow complete: patient search → test catalog → order creation → diagnostic report review
- FHIR R4 resource coverage: `Patient`, `ServiceRequest`, `DiagnosticReport`, `ActivityDefinition`, `SpecimenDefinition`, `ObservationDefinition`, `Practitioner`, `Organization`
- Lab-specific domain model: LIS barcode format (`OrderNumber + " " + specimen_additionalinfo`), ZLZ code systems, SNOMED ConceptMaps
- API-first: every data operation is an HTTP endpoint documented in OpenAPI
- Deep linking allows KIS/PIS → order-entry in one browser redirect

**Findings — Missing:**
- No e-prescription (ePrescription) integration
- No structured PDF report viewer (attachments delivered as base64, not rendered in-app)
- LOINC→LIS ConceptMap has only 3 stub entries — full mapping table not yet delivered

**Recommendations:**
- Track incomplete LOINC mapping as a release blocker for full semantic interoperability
- Add an inline PDF viewer (e.g. `@react-pdf-viewer`) for `presentedForm` attachments

---

#### 2.1.2 Performance Efficiency — ⚠️ Partial

**Findings — Good:**
- `cache: "no-store"` on all FHIR calls — correct for clinical data (no stale reads)
- Prometheus metrics with `zetlab_fhir_request_duration_seconds` histogram
- Debounced search (350 ms) prevents FHIR query flooding
- Traefik rate limiting: 100 req/s average, burst 50

**Findings — Missing:**
- No FHIR response caching for read-mostly resources (`ActivityDefinition`, `ValueSet`) — every catalog render hits HAPI FHIR
- No connection pooling configuration for PostgreSQL (HAPI default settings)
- No CDN or static asset caching headers documented
- `zetlab_fhir_request_duration_seconds` histogram bucket boundaries not customized for clinical latency expectations

**Recommendations:**
- Add a short-lived server-side cache (60–300 s) for `ActivityDefinition` bundles; invalidate on admin request
- Configure `spring.datasource.hikari.*` in `hapi/application.yaml` for connection pool tuning
- Define SLO: p95 FHIR read latency ≤ 2 s, surface in Grafana dashboard

---

#### 2.1.3 Compatibility — ✅ Compliant

**Findings — Good:**
- FHIR R4 standard ensures interoperability with any compliant server (HAPI, Azure Health Data Services, Google Cloud Healthcare API)
- Multi-arch Docker image (`linux/amd64` + `linux/arm64`)
- OpenAPI 3.0 machine-readable spec enables client generation for any integrating system
- WADL endpoint for legacy SOAP/WS-* toolchains
- 5-language i18n (de, de-CH, en, fr, it)

**Findings — Missing:**
- No SMART on FHIR support — Keycloak is reserved/commented out
- No HL7v2 direct ingestion (Orchestra handles upstream translation, but no fallback)

**Recommendations:**
- Activate Keycloak for SMART on FHIR when the lab moves to a multi-tenant model
- Document the HL7v2 boundary explicitly: "OrderEntry receives FHIR; Orchestra translates HL7v2"

---

#### 2.1.4 Usability — ✅ Compliant

*(See Section 5 for full detail)*

---

#### 2.1.5 Reliability — ⚠️ Partial

**Findings — Good:**
- All services `restart: unless-stopped`
- Health checks on all 7 services; appropriate start periods (HAPI: 60 s, Orchestra: 180 s)
- Watchtower daily auto-update at 03:00 UTC
- Structured NDJSON logging to persistent bind-mounted volume
- Session cookies use HMAC-SHA256 — server-side session state is stateless

**Findings — Missing:**
- No circuit breaker or retry logic in `FhirClient` — a single FHIR failure propagates as 500
- No graceful degradation: if HAPI is down, OrderEntry shows a 500 rather than a maintenance page
- Single-node deployment only (docker-compose) — no horizontal scaling
- No backup/restore procedure documented for `data/users.json` or PostgreSQL
- `NonceCache` (deep linking replay protection) is in-process memory — lost on restart

**Recommendations:**
- Add exponential-backoff retry (max 3 attempts, 200/400/800 ms) in `FhirClient.executeFhirRequest()`
- Add a FHIR connectivity check at startup and surface "FHIR unavailable" banner in the UI
- For NonceCache: document restart-clears-nonces as an accepted risk, or replace with Redis SETNX

---

#### 2.1.6 Security — ⚠️ Partial

*(See Section 4 for full detail)*

---

#### 2.1.7 Maintainability — ✅ Compliant

**Findings — Good:**
- Clean Architecture strictly enforced (domain ← application ← infrastructure ← presentation ← app)
- CLAUDE.md as single source of truth (20+ documented architectural decisions)
- Named exports everywhere except Next.js pages
- ESLint flat config with `next/core-web-vitals` + `next/typescript`
- Structured logger with context binding (`createLogger("ctx")`)
- OpenAPI as single source of truth — Swagger and WADL derived from it
- README tree: every significant folder has a `README.md`

**Findings — Missing:**
- Legacy code zone (`src/lib/`, `src/components/`, `src/config.ts`) — acknowledged debt with no migration milestone
- No architectural fitness functions (no automated layer-boundary enforcement)
- `openapi.ts` is a 2,000+ line TypeScript constant — hard to review in PRs

**Recommendations:**
- Add `eslint-plugin-boundaries` to enforce CA layer rules at lint time
- Consider splitting `openapi.ts` into per-tag files merged by a build script
- Set a concrete milestone for migrating `src/lib/auth.ts` → `src/infrastructure/auth/SessionService.ts`

---

#### 2.1.8 Portability — ✅ Compliant

**Findings — Good:**
- `node:20-alpine` base image — minimal, reproducible
- All config via ENV vars (12-factor app compliant)
- Multi-arch build (`linux/amd64` + `linux/arm64`)
- No host-path assumptions in application code
- `NEXT_PUBLIC_*` vars documented as "baked at build time"

**Findings — Missing:**
- No Helm chart or Kubernetes manifests
- `data/users.json` stored on container filesystem — not portable in stateless deployment

---

### 2.2 ISO/IEC 27001 — Information Security Management

#### ⚠️ Partial

**Findings — Good:**
- HTTPS enforced (permanent HTTP→HTTPS redirect, HSTS 1 year, preload)
- TLS via Let's Encrypt with auto-renewal (Traefik)
- Traefik security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- Session cookies: HMAC-SHA256 signed, no server-side state required
- Password storage: `crypto.scrypt` (N=16384, r=8, p=1, 64-byte output) + 16-byte random salt + `timingSafeEqual` — strong
- API tokens stored as SHA-256 hashes
- Admin UI requires explicit admin role — RBAC enforced
- `AUTH_SECRET`, `METRICS_TOKEN`, `ORCHESTRA_JWT_SECRET` protected — never returned by API (BLOCKED_PATTERNS)
- Deep-link secrets use separate keys from `AUTH_SECRET`
- Rate limiting on OrderEntry: 100 req/s (Traefik middleware)
- Services communicate on private bridge network only — no direct HAPI/PostgreSQL exposure

**Critical Gaps:**

| Gap | Risk |
|---|---|
| No Content Security Policy (CSP) | XSS escalation — React escaping is the only layer |
| No CORS policy | Cross-origin API calls from attacker-controlled pages |
| Bootstrap admin password printed to logs | Credential exposure during initial deployment |
| `data/users.json` not encrypted at rest | Data breach if host filesystem compromised |
| No account lockout | Brute-force / credential stuffing below rate limit threshold |
| No password expiry policy | Stale credentials remain valid indefinitely |
| Watchtower has full Docker socket access | Container escape → full host access |
| No TLS between internal services | HAPI, Orchestra, PostgreSQL communicate unencrypted on bridge |
| No secrets manager integration | Secrets stored as plain-text `.env` |

**Recommendations:**
1. Add `Content-Security-Policy` Traefik header: `default-src 'self'; script-src 'self' unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:`
2. Implement account lockout: 5 failed attempts → 15-minute lockout recorded in `users.json`
3. Replace bootstrap-admin console log with a one-time setup file (`.setup-token`); add a UI banner if default password is still active
4. Mount Watchtower with a read-only Docker socket proxy (`tecnativa/docker-socket-proxy`)

---

### 2.3 ISO/IEC 27701 — Privacy Information Management

#### ❌ Not Compliant (no formal artefacts)

> **Note:** The system handles patient health data (PHI / GDPR special category data / Swiss FADP sensitive data). This is the highest-priority compliance gap for a Swiss clinical system.

**Findings — Good:**
- No patient data stored in OrderEntry itself — all PHI proxied through FHIR (data minimization applied architecturally)
- Secrets never returned by API
- Server-side rendering keeps FHIR responses server-side
- Structured logging discipline — patient IDs not explicitly logged

**Critical Gaps:**
- No data processing agreement (DPA) documentation
- No retention policy for log files — `zetlab.log` grows indefinitely
- No consent management in the application
- No data subject access/deletion request mechanism
- No personal data inventory (FADP Art. 12 / GDPR Art. 30)
- Audit logs are not tamper-evident — NDJSON file can be edited by anyone with filesystem access
- `ACME_EMAIL` in `.env` template contains a personal email address

**Recommendations:**
1. Implement log rotation with a defined retention period (e.g. 90 days); document it
2. Add tamper-evident audit log sink (append-only S3, Loki with retention policies, or syslog-ng)
3. Create a "Privacy by Design" document mapping FHIR resources to FADP/GDPR articles
4. Replace personal email in `.env` template with a placeholder `acme@yourorganisation.ch`

---

### 2.4 ISO/IEC 27034 — Application Security

#### ⚠️ Partial

**Findings — Good:**
- Input validation at API boundaries (DTO pattern, controller-level guards)
- No raw SQL — FHIR proxy pattern eliminates SQL injection surface
- No `eval()` or dynamic code execution
- React escaping prevents reflected XSS from user content
- `process.env` read only through `EnvConfig` (single trust boundary)
- Environment variable schema documented with blocked patterns

**Findings — Missing:**
- No request body size limit beyond Next.js defaults — potential DoS via oversized JSON payloads
- No output encoding validation for FHIR pass-through responses
- Swagger UI uses CDN (`unpkg.com`) without SRI integrity hashes
- No SAST pipeline (ESLint is a linter, not a security scanner)
- No `npm audit` in CI
- No SBOM (Software Bill of Materials)

**Recommendations:**
1. Add `Content-Length` limit middleware to Next.js API routes (e.g. 1 MB max for non-FHIR endpoints)
2. Add SRI `integrity` attribute to Swagger UI CDN `<link>` and `<script>` tags
3. Add `npm audit --audit-level=high` to CI pipeline
4. Generate SBOM with `cyclonedx-npm` or `syft` in the Docker build step

---

### 2.5 ISO 9241 — Human-System Interaction

#### ✅ Compliant

*(See Section 5 for full detail)*

---

### 2.6 ISO 13485 — Medical Device Quality Management

#### ⚠️ Partial

> **Important:** ISO 13485 compliance requires an entire Quality Management System (QMS). This evaluation assesses whether the software supports ISO 13485-compliant processes — not whether the organisation is certified.

**Findings — Good:**
- Domain model correctly separates `ServiceRequest` (order) from `DiagnosticReport` (result) — clinical semantics respected
- LIS barcode format documented and enforced in CLAUDE.md
- Role-based access enforced at all API routes
- Structured logging enables post-incident analysis
- i18n in 5 languages — multi-lingual clinical environment supported
- Version information baked into build (`NEXT_PUBLIC_APP_VERSION` from git metadata)

**Critical Gaps:**
- No Quality Management System (QMS) documentation
- No Design History File (DHF) or Software Development Plan (SDP)
- No Software of Unknown Provenance (SOUP) list — `node_modules` not formally catalogued
- No validation protocol for clinical workflows (IQ/OQ/PQ)
- No change control process — Watchtower auto-updates bypass change control in production
- `npm test` not in CI — tests run locally only

**Recommendations:**
1. Create a SOUP list from `package.json` / `package-lock.json`; document version, license, CVE status
2. Disable Watchtower for `orderentry` in regulated deployments — require manual image promotion through a change control gate
3. Define a release procedure: build → integration test → staging validation → change control approval → production deploy
4. Add `npm test` to CI as a required gate before merge

---

### 2.7 ISO 14971 — Medical Device Risk Management

#### ❌ Not Compliant (no formal risk register exists)

**Identified Risks — Based on Code Analysis:**

| Risk ID | Hazard | Likelihood | Severity | Risk Level | Current Mitigation |
|---|---|---|---|---|---|
| R-01 | Wrong patient selected via deep link; no UI confirmation | Medium | Critical | **High** | FHIR Patient verification only |
| R-02 | Duplicate order on double-click / network retry | Medium | High | **High** | None — no idempotency key |
| R-03 | Barcode format error (wrong material code) | Low | High | **Medium** | Rule documented; no runtime validation |
| R-04 | `users.json` corruption → all logins fail | Low | High | **Medium** | No atomic write guarantee; no backup |
| R-05 | Deep-link nonce cache lost on restart → replay possible | Low | Medium | **Low** | In-memory cache only |
| R-06 | Bootstrap admin password not changed in production | Medium | Critical | **High** | Printed to logs; env var override available |
| R-07 | Hard-deleted order not recoverable | Low | High | **Medium** | Soft-delete on 409 conflict only |
| R-08 | FHIR server unavailable → silent order loss | Medium | High | **High** | Error thrown; no dead-letter queue |

**Recommendations:**
1. Create a formal Risk Management File with the above table as a starting point
2. For R-01: Add a patient confirmation page before the order workflow
3. For R-02: Add `X-Idempotency-Key` support on `POST /api/service-requests`
4. For R-03: Implement `BarcodeValue` domain value object with format validation
5. For R-06: Add startup check — refuse production start with the default `AUTH_SECRET`

---

### 2.8 ISO/IEC 29119 — Software Testing

#### ⚠️ Partial

**Findings — Good:**
- Vitest 4 + React Testing Library — modern, correct toolchain
- Coverage thresholds enforced: branches 70%, functions/lines/statements 80%
- Test pyramid: `tests/unit/` (no I/O) + `tests/integration/` (real objects, mock fetch)
- Mock repositories in `tests/mocks/` — injectable via `ServiceFactory`
- Integration tests for controllers use `vi.fn()` as `fetchFn` — correct, no real FHIR needed
- Coverage scope: domain, application, FHIR mappers, repositories, API controllers

**Critical Gaps:**
- `src/app/api/*` route handlers excluded from coverage — the highest-risk boundary is untested
- No E2E tests (Playwright placeholder; zero tests written)
- No load/performance tests
- No security regression tests (auth bypass, signature tampering)
- `npm test` not in CI pipeline — deferred to "after first full test pass"
- No test plan document (ISO 29119 Part 3)

**Recommendations:**
1. Add `npm test` to GitHub Actions CI as a required step before PR merge
2. Extend Vitest `include` to cover `src/app/api/**/*.ts`
3. Add Playwright E2E for three critical paths: login → patient search → order creation
4. Add security tests: unauthenticated access to admin routes, HMAC signature tampering in deep-link flow

---

## 3. Cloud-Native Readiness

### 3.1 Docker Readiness — ✅ High

| Check | Status | Detail |
|---|---|---|
| Multi-stage build | ✅ | deps → builder → runner (3 stages) |
| Minimal base image | ✅ | `node:20-alpine` |
| Non-root user | ✅ | `nextjs:nodejs` (UID/GID 1001) |
| Config via ENV | ✅ | 100% — no hardcoded config values |
| Multi-arch | ✅ | `linux/amd64` + `linux/arm64` |
| Secrets not baked in | ✅ | Only `NEXT_PUBLIC_*` baked; secrets at runtime |
| Log to stdout | ✅ | Structured JSON via `console.log/error` + optional file |
| Health check | ⚠️ | Defined in docker-compose only; not in Dockerfile |
| Read-only root filesystem | ⚠️ | `/app/data` and `/app/logs` require write access |
| Image signing (cosign) | ❌ | No SLSA provenance or cosign attestation |
| SBOM | ❌ | Not generated |
| AppArmor / seccomp profile | ❌ | Default profile only |

**CIS Docker Benchmark notable checks:**
- ✅ Non-root execution
- ✅ No `--privileged` flag
- ✅ Docker socket not mounted in orderentry
- ⚠️ Watchtower has full Docker socket access — privilege escalation path
- ❌ No custom seccomp profile

**Recommendation:** Add `HEALTHCHECK` directive to the Dockerfile itself. Add `--security-opt seccomp=default.json` to docker-compose for defence in depth.

---

### 3.2 Kubernetes Readiness — ⚠️ Medium

| Principle | Status | Detail |
|---|---|---|
| Stateless design | ✅ | Session cookies are self-contained |
| Config via ENV / ConfigMap | ✅ | Fully ENV-driven |
| Health endpoints | ✅ | `GET /api/me` → 200/401 = healthy |
| Readiness vs liveness separation | ⚠️ | Single endpoint; no readiness-specific FHIR check |
| Graceful shutdown | ⚠️ | OTel flush on SIGTERM; not explicitly load-tested |
| Resource limits | ❌ | No CPU/memory limits defined |
| Horizontal scaling | ❌ | Blocked by local state (users.json, NonceCache) |
| Kubernetes manifests | ❌ | None — docker-compose only |
| PersistentVolumeClaim | ❌ | No PVC spec for `users.json` |
| K8s Secrets integration | ❌ | No external-secrets-operator integration |
| NetworkPolicy | ❌ | No K8s NetworkPolicy resources |
| ServiceMonitor (Prometheus) | ⚠️ | `/api/metrics` endpoint exists; no CRD defined |

**Minimum path to Kubernetes:**
1. Migrate `users.json` → PostgreSQL (HAPI's DB is already present in the stack)
2. Migrate `NonceCache` → Redis SETNX with TTL
3. Migrate `config.json` runtime overrides → Kubernetes ConfigMap
4. Create `k8s/` directory with `Deployment`, `Service`, `Ingress`, `ConfigMap`, `Secret`, `PodDisruptionBudget`
5. Add `GET /api/healthz` readiness probe (checks FHIR connectivity, returns structured JSON)

---

### 3.3 OpenShift Compatibility — ⚠️ Medium

| Check | Status | Detail |
|---|---|---|
| Non-root UID | ✅ | UID 1001 |
| Arbitrary UID support | ⚠️ | OpenShift assigns random UIDs — requires `chmod g+w` on data dirs instead of `chown` |
| Read-only root filesystem | ⚠️ | Data/log dirs need emptyDir or PVC |
| `allowPrivilegeEscalation: false` | ✅ | No sudo, no setuid binaries in alpine |
| `capabilities: drop: ALL` | ✅ | Node.js needs no Linux capabilities |
| SecurityContextConstraints (SCC) | ❌ | No SCC defined; would need `restricted` or custom SCC |
| OpenShift Routes | ❌ | Traefik-specific labels only; no Route objects |

**Required Dockerfile fix for OpenShift:**
```dockerfile
# Replace fixed chown:
RUN chown nextjs:nodejs /app/data /app/logs
# With arbitrary-UID compatible pattern:
RUN chmod -R g+w /app/data /app/logs && chgrp -R 0 /app/data /app/logs
```

---

## 4. Security Assessment

### 4.1 Authentication & Authorization

| Mechanism | Implementation | Assessment |
|---|---|---|
| Session cookies | HMAC-SHA256 signed | ✅ Strong — not guessable; stateless |
| Password hashing | `crypto.scrypt` + 16-byte salt | ✅ Best-practice |
| Timing-safe comparison | `crypto.timingSafeEqual` | ✅ Correct — prevents timing attacks |
| API tokens (PAT) | SHA-256 hashed in store | ✅ Acceptable |
| JWT for API access | HS256 native crypto (no library) | ✅ Correct |
| RBAC | admin / user roles | ⚠️ Only 2 roles — no read-only or lab-specific permissions |
| Account lockout | ❌ None | 🔴 Critical gap |
| MFA | ❌ None | 🟡 Important for admin accounts |
| Session timeout | 1 day (24 h) default | ⚠️ Long for clinical shift-based environments (recommend 8 h) |
| Session revocation | ❌ None | Cookie valid until expiry regardless of logout |
| OIDC / OAuth2 | Keycloak commented out | ⚠️ Not yet live |

### 4.2 Secrets Handling

| Secret | Handling | Status |
|---|---|---|
| `AUTH_SECRET` | ENV var, BLOCKED from API | ✅ |
| `ORCHESTRA_JWT_SECRET` | ENV var, BLOCKED from API | ✅ |
| `DEEPLINK_JWT_SECRET` | ENV var, BLOCKED from API | ✅ |
| `DEEPLINK_HMAC_SECRET` | ENV var, BLOCKED from API | ✅ |
| `MAIL_PASSWORD` | ENV var, BLOCKED from API | ✅ |
| `POSTGRES_PASSWORD` | ENV var; default value `hapi` | ⚠️ Must be changed in production |
| Bootstrap admin password | Printed to stdout on first boot | 🔴 Exposure risk via container logs |
| `AUTH_SECRET` fallback | `"dev-secret-change-me"` | 🔴 Silently weak if ENV not set |
| Traefik auth hash | Placeholder in `.env` template | ⚠️ Easy to forget to replace |

### 4.3 API Protection

| Protection | Status | Detail |
|---|---|---|
| TLS (HTTPS) | ✅ | Traefik + Let's Encrypt |
| HSTS | ✅ | 1 year, includeSubdomains, preload |
| Rate limiting | ✅ | 100 req/s avg, burst 50 |
| X-Frame-Options | ✅ | DENY |
| X-Content-Type-Options | ✅ | nosniff |
| Content-Security-Policy | ❌ | **Not configured** |
| CORS | ❌ | **Not configured** — implicit allow-all |
| Input schema validation | ⚠️ | Controller-level only; no Zod/Yup runtime schemas |
| SQL injection | ✅ N/A | No SQL layer in OrderEntry |
| XSS | ⚠️ | React escaping only; no CSP second layer |
| SSRF via `/api/env` | ⚠️ | Admin can set `FHIR_BASE_URL` to internal service |

**SSRF mitigation:** Validate `FHIR_BASE_URL` format on save in `EnvController` — must match an allowlisted hostname pattern.

---

## 5. Usability Assessment

### 5.1 Effectiveness, Efficiency, Satisfaction (ISO 9241-11)

**Effectiveness:**
- ✅ Full order lifecycle: create, view, cancel, delete
- ✅ Patient search by ID or name (PatientSearchStrategy heuristic)
- ✅ ActivityDefinition catalog with 4,218 ZLZ lab tests
- ✅ DiagnosticReport review with status badges
- ✅ Orchestra and KIS/PIS deep-link integration eliminate patient re-selection
- ⚠️ Missing: specimen collection instructions, barcode print, PDF Begleitschein

**Efficiency:**
- ✅ SearchBar debounce 350 ms — balances responsiveness and FHIR query cost
- ✅ Skeleton loaders eliminate perceived blank-screen wait
- ✅ Deep-link flow: one browser redirect from KIS → active order creation
- ⚠️ No keyboard shortcuts for high-frequency clinical actions
- ⚠️ No bulk order actions (e.g. print multiple Begleitscheine)

**Satisfaction:**
- ✅ Consistent design system — 10 token groups, 9 components, zero hardcoded hex values
- ✅ Dark mode ready (`.dark` class on `<html>`)
- ✅ Swiss German UI with Swiss date format (DD.MM.YYYY)
- ⚠️ No onboarding tour or contextual help tooltips
- ⚠️ FHIR OperationOutcome error messages exposed to clinical users in some paths

### 5.2 Accessibility (ISO 9241-171 / WCAG 2.1)

| Area | Status |
|---|---|
| Semantic HTML | ✅ (assumed from React patterns) |
| ARIA labels on inputs | ✅ (`aria-invalid`, `htmlFor`, `role="status"`) |
| Color contrast | ⚠️ Design tokens present; not formally audited |
| Keyboard navigation | ⚠️ Not explicitly tested |
| Screen reader support | ⚠️ Partial — modals and dropdowns need audit |
| Focus management | ⚠️ Not documented |
| Minimum touch target size | ⚠️ Unknown |
| WCAG 2.1 AA formal audit | ❌ Not performed |

> In Switzerland (nLHin) and EU (EN 301 549), WCAG 2.1 AA is a legal requirement for software used in public health settings. A formal audit is required before go-live.

**Recommendation:** Run `axe-core` automated accessibility scan in the Playwright E2E tests; address violations before first clinical production rollout.

---

## 6. Risk Assessment — Medical Context

### 6.1 Patient Safety Risks

| Risk | Severity | Current Mitigation | Required Action |
|---|---|---|---|
| Wrong patient in deep-link order | **Critical** | FHIR Patient existence check only | Add patient confirmation modal with name + DOB |
| Duplicate order on double-click | **High** | None | Add `X-Idempotency-Key` on ServiceRequest creation |
| Barcode format error → unscannable | **High** | Documented rule in CLAUDE.md | Implement `BarcodeValue` domain value object |
| Order for inactive/deceased patient | **Medium** | None | Check Patient.active before allowing order creation |
| Hard-deleted order not recoverable | **High** | Soft-delete on 409 only | Add explicit soft-delete-first workflow with 24h recovery window |
| Incorrect test code selected | **High** | ActivityDefinition catalog | Add clinical category filters; highlight STAT/urgent tests |

### 6.2 Data Integrity Risks

| Risk | Severity | Mitigation Gap |
|---|---|---|
| `users.json` corruption on crash | **High** | No atomic write; no checksum verification |
| Log file loss on container crash | **Medium** | Synchronous `appendFileSync`; no WAL |
| FHIR write failure → silent order loss | **High** | Error thrown; no retry queue; no dead-letter mechanism |
| Timezone error in date display | **Low** | CET/CEST handling not explicitly tested in mapper |
| Default admin password in production | **Critical** | Printed to logs; env override available but not enforced |

---

## 7. Priority Roadmap

### 🔴 Critical — Must Fix Before Production

| # | Action | File / Location |
|---|---|---|
| C-01 | **Startup guard for weak `AUTH_SECRET`** — refuse to start in production with the default value | `src/infrastructure/config/EnvConfig.ts` + startup validation |
| C-02 | **Bootstrap admin safeguard** — stop printing credentials to logs; add UI banner if default password is unchanged | `src/lib/userStore.ts` |
| C-03 | **Patient confirmation on deep link** — intermediate confirmation page before order workflow | New: `src/app/deeplink/confirm/page.tsx` |
| C-04 | **Account lockout** — 5 failed attempts → 15-minute lockout | `src/lib/userStore.ts` + `src/app/api/login/route.ts` |
| C-05 | **Add `npm test` to CI** — tests currently run locally only | `.github/workflows/ci.yml` |
| C-06 | **Content Security Policy header** — add via Traefik `customResponseHeaders` | `devops/docker/docker-compose.yml` |

---

### 🟡 Important — Fix Within Next Release Cycle

| # | Action | Location |
|---|---|---|
| I-01 | `HEALTHCHECK` in Dockerfile (not only docker-compose) | `docker/Dockerfile` |
| I-02 | Dedicated `GET /api/healthz` readiness probe (FHIR connectivity check) | New: `src/app/api/healthz/route.ts` |
| I-03 | Idempotency key on `POST /api/service-requests` | `src/app/api/service-requests/route.ts` |
| I-04 | Log retention policy (`LOG_RETENTION_DAYS`) + cleanup task | `EnvConfig.ts` + cron/logrotate |
| I-05 | SOUP list — export from `package-lock.json` | `docs/SOUP.md` (generated artifact) |
| I-06 | SRI hashes on Swagger UI CDN assets | `src/app/api/docs/route.ts` |
| I-07 | Barcode format validation — `BarcodeValue` value object | `src/domain/valueObjects/BarcodeValue.ts` |
| I-08 | FHIR circuit breaker + retry with backoff | `src/infrastructure/fhir/FhirClient.ts` |
| I-09 | OpenShift UID compatibility (`chmod g+w` pattern) | `docker/Dockerfile` |
| I-10 | CORS configuration in Traefik or Next.js | `devops/docker/docker-compose.yml` |
| I-11 | WCAG 2.1 AA accessibility audit (axe-core in E2E) | `tests/e2e/` + Playwright config |

---

### 🟢 Nice to Have — Planned / Future Cycle

| # | Action |
|---|---|
| N-01 | Helm chart for Kubernetes deployment |
| N-02 | API versioning (`/api/v1/` prefix) |
| N-03 | `X-Request-ID` header propagation through Traefik → logs |
| N-04 | Playwright E2E tests for 3 critical paths |
| N-05 | Mutation testing (Stryker or vitest-mutation) |
| N-06 | Inline PDF viewer for `DiagnosticReport.presentedForm` |
| N-07 | Complete LOINC→LIS ConceptMap (awaiting mapping table from ZLZ) |
| N-08 | Redis-backed NonceCache for multi-replica deep-link protection |
| N-09 | Migrate `users.json` → PostgreSQL for Kubernetes horizontal scaling |
| N-10 | Keycloak activation for SMART on FHIR / multi-tenant mode |
| N-11 | SBOM generation in Docker build (`syft` or `cyclonedx-npm`) |
| N-12 | Tamper-evident audit log sink (Loki with TTL or append-only S3) |

---

## 8. Architecture Feedback

### Clean Architecture — Verdict: ✅ Well Implemented

The CA layer separation is the strongest structural aspect of this codebase.

**What is done correctly:**
- `domain/` contains zero framework imports — pure TypeScript interfaces, value objects, use cases
- `application/` defines repository and strategy interfaces — properly decoupled from implementation
- `infrastructure/` is the only layer reading `process.env`, importing `crypto`, calling `fetch`, or using `nodemailer`
- `presentation/` consumes `ServiceFactory` only — never imports infrastructure directly
- `shared/` is genuinely client-safe — no Node.js APIs
- `ServiceFactory` is the sole DI root — testable by passing mock repositories
- Strategy Pattern applied consistently in 3 domains: FHIR outbound auth, mail provider, deep-link auth

**What could improve:**

#### 1. Legacy Zone Debt
`src/lib/`, `src/components/`, `src/config.ts` sit outside the CA layer map. The rule "do not restructure" is correct tactically, but needs a time-bounded migration plan. Suggested milestone:
- `src/lib/auth.ts` → `src/infrastructure/auth/SessionService.ts`
- `src/config.ts` reader → `EnvConfig.fhirBaseUrl`

#### 2. `FhirClient.ts` Imports Legacy Config
```typescript
// Current (imports from legacy src/config.ts):
import { fhirBase } from "@/config";

// Should be:
const FHIR_BASE = EnvConfig.fhirBaseUrl; // single source of truth
```

#### 3. Route Handlers Contain Minor Logic
The deep-link route handler extracts `x-forwarded-for`. This belongs in a request-parsing utility, not the route. Routes should be three lines: parse → delegate → respond.

#### 4. Domain Entities Are Too Thin
Value objects like `PatientId`, `BarcodeValue`, `OrderNumber` should encapsulate their validation. Currently `replace(/^Patient\//, "")` is scattered across multiple files. A `PatientId.parse("Patient/p-123")` value object eliminates this.

#### 5. `IHealthCheckable` Interface Missing
The admin system page (`/account/system`) delegates health checks via an inline call per service. Adding `IHealthCheckable` to each strategy (`IMailService`, `IDeepLinkAuthStrategy`) would enable a uniform health check loop.

### Recommended Next Architecture Step

The system is ready to move from single-node Docker to production-grade Kubernetes with three targeted changes — no architectural redesign needed:

```
1. Replace data/users.json → PostgreSQL user table
   (HAPI's PostgreSQL instance is already in the stack)

2. Replace NonceCache Map → Redis SETNX with TTL
   (add redis:7-alpine to docker-compose; ~40 MB)

3. Add k8s/ manifests:
   Deployment + HPA + Service + Ingress + PodDisruptionBudget
```

These three changes unlock:
- Horizontal scaling (multi-pod)
- Zero-downtime rolling deploys
- Cloud-provider independence
- CIS Kubernetes Benchmark compliance baseline

---

## Appendix: Compliance Summary Table

| Standard | Area | Compliance |
|---|---|---|
| ISO/IEC 25010 — Functional Suitability | Workflow completeness | ✅ |
| ISO/IEC 25010 — Performance Efficiency | Caching, SLOs | ⚠️ |
| ISO/IEC 25010 — Compatibility | FHIR R4, multi-arch | ✅ |
| ISO/IEC 25010 — Usability | Design system, i18n | ✅ |
| ISO/IEC 25010 — Reliability | Retry, backup, HA | ⚠️ |
| ISO/IEC 25010 — Security | Auth, headers, secrets | ⚠️ |
| ISO/IEC 25010 — Maintainability | CA, documentation | ✅ |
| ISO/IEC 25010 — Portability | Docker, ENV, multi-arch | ✅ |
| ISO/IEC 27001 — Information Security | HTTPS, headers, RBAC | ⚠️ |
| ISO/IEC 27701 — Privacy | Data retention, DPA | ❌ |
| ISO/IEC 27034 — Application Security | SAST, SRI, SBOM | ⚠️ |
| ISO 9241 — Usability | Workflow, accessibility | ✅ / ⚠️ |
| ISO 13485 — Medical QMS | SDP, SOUP, V&V | ⚠️ |
| ISO 14971 — Risk Management | Risk register, FMEA | ❌ |
| ISO/IEC 29119 — Testing | Coverage, CI, E2E | ⚠️ |
| OCI / Docker | Build, non-root, multi-arch | ✅ |
| CNCF Kubernetes Readiness | Stateless, manifests, HPA | ⚠️ |
| OpenShift Compatibility | UID, SCC, Routes | ⚠️ |
| CIS Docker Benchmark | Non-root, no socket, seccomp | ⚠️ |

**Legend:** ✅ Compliant · ⚠️ Partial · ❌ Not Compliant

---

*This document is a point-in-time assessment based on codebase review as of 2026-04-04.*
*All findings marked as factual are grounded in observed code and configuration.*
*Findings marked as assumptions are explicitly noted.*
*This report should be reviewed by a qualified medical device software engineer before use in a regulatory submission.*
