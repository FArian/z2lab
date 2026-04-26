---
name: Bridge-Spec — wo alles steht
description: Pfade zur vollständigen z2Lab-Bridge-Spec und zu allen relevanten Code-Stellen im Repo. Vor jeder Bridge-Arbeit zuerst hier nachschauen. Code/Spec heißen aktuell noch "agent" — siehe bridge_naming.md.
type: reference
---

**Hauptspec (lesen vor jeder Bridge-Arbeit):**
`frontend/orderentry/tmp/agent/README.md` (TODO umbenennen → `tmp/bridge/README.md`) — 600+ Zeilen, vollständige Architektur, Datenflüsse (3 Mermaid-Sequenzdiagramme), Implementierungsstand, offene Entscheidungen, ENV-Variablen, Sicherheit, Resilienz

**Cloud-seitige Routes (Pfade noch agent — TODO bridge):**
- `frontend/orderentry/src/app/api/v1/agent/status/` — GET, Connectivity-Check
- `frontend/orderentry/src/app/api/v1/agent/token/` — POST, JWT/PAT ausstellen
- `frontend/orderentry/src/app/api/v1/agent/jobs/` — Polling-Endpoint für offene Druck-/ORU-Jobs
- `frontend/orderentry/src/app/api/v1/agent/register/` — Bridge-Registrierung
- `frontend/orderentry/src/app/api/v1/admin/agents/` — Admin CRUD (route.ts + [id]/)
- `frontend/orderentry/src/app/admin/agents/` — Admin-UI-Page (Stub)
- `frontend/orderentry/src/app/api/v1/proxy/hl7/inbound/` — HL7 Bridge → Orchestra
- `frontend/orderentry/src/app/api/v1/proxy/hl7/outbound/` — HL7 Orchestra → Bridge (Polling)
- `frontend/orderentry/src/app/api/v1/proxy/fhir/...` — FHIR-Proxy für Patients, ServiceRequests, DiagnosticReports

**Browser-seitiger Druck (fertig, nicht doppelt bauen):**
- `frontend/orderentry/src/presentation/hooks/useOrderDocuments.ts` — buildBegleitscheinHtml(), printBegleitschein(), printLabel(), buildBegleitscheinBase64()

**Geplantes separates Repo (noch nicht existent):**
`z2lab-bridge/` (vorher `zetlab-agent/`) — eigenes Go-Projekt, Struktur in der Spec dokumentiert (main.go, watcher/, poller/, printer/, writer/, config/, Dockerfile)

**Nicht verwechseln:**
`.claude/agents/{architecture,code-quality,fhir,meta,qa,security,design}.md` — das sind **Claude Code Sub-Agent-Definitionen**, nicht die Bridge.
