![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Clean-22c55e)
![FHIR](https://img.shields.io/badge/FHIR-R4-E87722)
![Deployment](https://img.shields.io/badge/Deployment-Docker%20%7C%20Vercel-8b5cf6)
![i18n](https://img.shields.io/badge/i18n-de%20%7C%20en%20%7C%20fr%20%7C%20it-blue)

# 🏥 OrderEntry

Laboratory order entry system (**Auftragserfassung**) for **ZLZ Zentrallabor AG**, Switzerland.
Clinicians search patients, browse a FHIR-backed test catalog, and submit diagnostic orders via `ServiceRequest`.

---

## 🏗️ System Architecture

```
Browser
  └─► Traefik (HTTPS + Let's Encrypt)
        ├─► orderentry  (Next.js :3000)
        │     └─► hapi-fhir (FHIR R4 :8080) ──► postgres (:5432)
        └─► orchestra   (OIE Juno :8090)
                  └─► ZLZ Lab (HL7 ORM^O01)
```

All FHIR access is proxied through server-side `/api/*` routes — no credentials exposed to the browser.

---

## 📦 Repository Structure

```
OrderEntry/
├── frontend/orderentry/   # Next.js 15.5 app (TypeScript strict, Tailwind CSS v4)
├── backend/docker/    # Docker Compose stack (Traefik, HAPI FHIR, Orchestra, PostgreSQL)
├── backend/orchestra/ # OIE Juno config + FHIR seed resources
└── simple/            # Legacy prototype — do not modify
```

---

## 🧭 Source Navigation

| | Layer | Description |
|---|---|---|
| 🎯 | [Domain](./frontend/orderentry/src/domain/README.md) | Pure business rules — entities, use cases, factories |
| 📋 | [Application](./frontend/orderentry/src/application/README.md) | Services, interfaces, strategies |
| 🔧 | [Infrastructure](./frontend/orderentry/src/infrastructure/README.md) | FHIR, HTTP, config, API controllers |
| 🎨 | [Presentation](./frontend/orderentry/src/presentation/README.md) | React hooks, components, design system |
| 🗂️ | [Shared](./frontend/orderentry/src/shared/README.md) | Framework-agnostic utilities and client-safe config |
| 🖥️ | [App](./frontend/orderentry/src/app/README.md) | Next.js App Router pages and API routes |
| 📝 | [Messages](./frontend/orderentry/src/messages/README.md) | i18n translations (de, en, fr, it) |
| 🧪 | [Tests](./frontend/orderentry/tests/README.md) | Unit, integration, mocks |

---

## 🛠️ Services

| Service | Image | Role |
|---|---|---|
| **orderentry** | `farian/orderentry:latest` | Next.js clinician UI |
| **hapi** | `hapiproject/hapi:latest` | FHIR R4 server |
| **orchestra** | `farian/oie-juno:4.10.1.1` | HL7 integration engine |
| **postgres** | `postgres:15` | Database for HAPI FHIR |
| **traefik** | `traefik:v3.0` | Reverse proxy, HTTPS, Let's Encrypt |
| **watchtower** | `containrrr/watchtower` | Auto-updates `orderentry` daily at 03:00 |

---

## ⚡ Quick Start

```bash
# Local development
cd frontend/orderentry
npm install && npm run dev

# Production (Docker)
cd backend/docker
mkdir -p data/orderentry/data && sudo chown -R 1001:1001 data/orderentry/data
docker compose up -d
```

---

## 🔄 End-to-End Flow

```
1. MASTERDATA   LIS → XML → Orchestra → FHIR (ActivityDefinition, SpecimenDefinition, …)
2. ORDER ENTRY  Clinician → orderentry App → ServiceRequest (POST to HAPI FHIR)
3. ROUTING      HAPI Subscription → Orchestra → HL7 ORM^O01 → ZLZ Lab (Vianova)
4. LIS IMPORT   Vianova processes HL7 → results returned via DiagnosticReport
```

---

## 🔗 Documentation

| File | Contents |
|---|---|
| [CLAUDE.md](./CLAUDE.md) | Architecture decisions and AI assistant rules |
| [src/README.md](./frontend/orderentry/src/README.md) | Clean Architecture layer map |
| [tests/README.md](./frontend/orderentry/tests/README.md) | Test structure and rules |
| [backend/README.md](./backend/README.md) | Docker build and deploy guide |

---

[⬆ Back to top](#)
