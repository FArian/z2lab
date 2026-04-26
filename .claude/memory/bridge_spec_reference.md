---
name: Bridge-Spec — wo alles steht
description: Pfade zur vollständigen z2Lab-Bridge-Spec und zu allen relevanten Code-Stellen im Repo. Vor jeder Bridge-Arbeit zuerst hier nachschauen.
type: reference
---

**Hauptspec (lesen vor jeder Bridge-Arbeit):**
`Documentation/Bridge/README.md` — 600+ Zeilen, vollständige Architektur, Datenflüsse (3 Mermaid-Sequenzdiagramme), Implementierungsstand, offene Entscheidungen, ENV-Variablen, Sicherheit, Resilienz.

**Cloud-seitige Routes (alle implementiert):**

| Route | Zweck |
|---|---|
| `frontend/orderentry/src/app/api/v1/bridge/status/` | GET — Connectivity-Check |
| `frontend/orderentry/src/app/api/v1/bridge/token/` | POST — JWT/PAT ausstellen |
| `frontend/orderentry/src/app/api/v1/bridge/jobs/` | GET (Polling) + POST (createPrintJob) |
| `frontend/orderentry/src/app/api/v1/bridge/jobs/[id]/done/` | POST — Bridge bestätigt Job done |
| `frontend/orderentry/src/app/api/v1/bridge/register/` | POST — Bridge-Registrierung |
| `frontend/orderentry/src/app/api/v1/admin/bridges/` | GET — Admin: alle Bridges |
| `frontend/orderentry/src/app/api/v1/admin/bridges/[id]/` | PATCH (revoke) + DELETE |
| `frontend/orderentry/src/app/admin/bridges/` | Admin-UI-Page (BridgesPage) |
| `frontend/orderentry/src/app/api/v1/proxy/hl7/inbound/` | HL7 Bridge → Orchestra |
| `frontend/orderentry/src/app/api/v1/proxy/hl7/outbound/` | HL7 Orchestra → Bridge (Polling) |
| `frontend/orderentry/src/app/api/v1/proxy/fhir/document-references/[id]/` | FHIR-Proxy für PDF |

**Domain / Application / Infrastructure (Bridge-spezifisch):**

| Datei | Inhalt |
|---|---|
| `domain/entities/BridgeJob.ts` | `BridgeJob`, `BridgeJobType`, `BridgeJobStatus`, `BridgeJobPayload` |
| `application/interfaces/repositories/IBridgeJobRepository.ts` | Job-CRUD-Interface |
| `application/interfaces/repositories/IBridgeRegistrationRepository.ts` | Registration-CRUD-Interface |
| `infrastructure/repositories/PrismaBridgeJobRepository.ts` | Prisma-Implementation Jobs |
| `infrastructure/repositories/PrismaBridgeRegistrationRepository.ts` | Prisma-Implementation Registrations |
| `infrastructure/api/controllers/BridgeJobController.ts` | createPrintJob, listJobs, markDone + ZPL-Generierung |
| `infrastructure/api/controllers/BridgeRegistrationController.ts` | register, list, revoke, remove + API-Key-Generation |
| `infrastructure/api/dto/BridgeJobDto.ts` | Request/Response-Typen Jobs |
| `infrastructure/api/dto/BridgeRegistrationDto.ts` | Request/Response-Typen Registrations |
| `presentation/pages/BridgesPage.tsx` | Admin-UI: Liste, Register-Form, Revoke, Delete |

**DB-Schema:**

| Datei | Inhalt |
|---|---|
| `prisma/schema.prisma` | Models `BridgeJob` + `BridgeRegistration` |
| `flyway/migrations/sqlite/V3__create_bridge_jobs.sql` | Tabelle `BridgeJob` (SQLite) |
| `flyway/migrations/sqlite/V8__create_bridge_registrations.sql` | Tabelle `BridgeRegistration` (SQLite) |
| `flyway/migrations/postgresql/V3__create_bridge_jobs.sql` | Tabelle `BridgeJob` (PostgreSQL) |
| `flyway/migrations/sqlserver/V3__create_bridge_jobs.sql` | Tabelle `BridgeJob` (SQL Server) |

**OpenAPI / Routing:**

| Datei | Inhalt |
|---|---|
| `infrastructure/api/openapi.ts` | Tag „Bridge", Schemas `BridgeJobResponse`, `ListBridgeJobsResponse`, Pfade `/bridge/jobs`, `/bridge/jobs/{id}/done` |
| `infrastructure/api/gateway/RouteRegistry.ts` | 5 Route-Einträge unter Tag „Bridge" |

**UI-Integration:**

| Datei | Inhalt |
|---|---|
| `components/AppSidebar.tsx` | Nav-Item `/admin/bridges` mit `IconBridges` |
| `presentation/pages/OrderCreatePage.tsx` | Auto-Erstellung Print-Job via `POST /api/v1/bridge/jobs` |
| `presentation/hooks/useOrderDocuments.ts` | Browser-Druck (Begleitschein, Barcode) — Bridge-unabhängig |
| `messages/{de,de-CH,en,fr,it}.json` | i18n-Key `nav.adminBridges` |

**Geplantes separates Repo (noch nicht existent):**
`z2lab-bridge/` — eigenes Go-Projekt, Struktur in der Spec dokumentiert (main.go, watcher/, poller/, printer/, writer/, config/, Dockerfile).

**Nicht verwechseln:**
`.claude/agents/{architecture,code-quality,fhir,meta,qa,security,design}.md` — das sind **Claude Code Sub-Agent-Definitionen**, nicht die Bridge.
