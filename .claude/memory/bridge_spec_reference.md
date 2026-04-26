---
name: Agent-Spec — wo alles steht
description: Pfade zur vollständigen ZetLab-Agent-Spec und zu allen relevanten Code-Stellen im Repo. Vor jeder Agent-Arbeit zuerst hier nachschauen.
type: reference
---

**Hauptspec (lesen vor jeder Agent-Arbeit):**
`frontend/orderentry/tmp/agent/README.md` — 600+ Zeilen, vollständige Architektur, Datenflüsse (3 Mermaid-Sequenzdiagramme), Implementierungsstand, offene Entscheidungen, ENV-Variablen, Sicherheit, Resilienz

**Cloud-seitige Routes (bereits da):**
- `frontend/orderentry/src/app/api/v1/agent/status/` — GET, Connectivity-Check
- `frontend/orderentry/src/app/api/v1/agent/token/` — POST, JWT/PAT ausstellen
- `frontend/orderentry/src/app/api/v1/agent/jobs/` — Polling-Endpoint für offene Druck-/ORU-Jobs
- `frontend/orderentry/src/app/api/v1/agent/register/` — Agent-Registrierung
- `frontend/orderentry/src/app/api/v1/admin/agents/` — Admin CRUD (route.ts + [id]/)
- `frontend/orderentry/src/app/admin/agents/` — Admin-UI-Page (Stub)
- `frontend/orderentry/src/app/api/v1/proxy/hl7/inbound/` — HL7 Agent → Orchestra
- `frontend/orderentry/src/app/api/v1/proxy/hl7/outbound/` — HL7 Orchestra → Agent (Polling)
- `frontend/orderentry/src/app/api/v1/proxy/fhir/...` — FHIR-Proxy für Patients, ServiceRequests, DiagnosticReports

**Browser-seitiger Druck (fertig, nicht doppelt bauen):**
- `frontend/orderentry/src/presentation/hooks/useOrderDocuments.ts` — buildBegleitscheinHtml(), printBegleitschein(), printLabel(), buildBegleitscheinBase64()

**Sub-Agent-Definitionen für Claude:**
- `.claude/agents/{architecture,code-quality,fhir,meta,qa,security,design}.md`

**Geplantes separates Repo (noch nicht existent):**
`zetlab-agent/` — eigenes Go-Projekt, Struktur in der Spec dokumentiert (main.go, watcher/, poller/, printer/, writer/, config/, Dockerfile)
