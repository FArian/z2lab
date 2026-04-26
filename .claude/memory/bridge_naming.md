---
name: Bridge — Namensregel (KRITISCH)
description: Das Produkt heißt z2Lab Bridge. NIE mit Claude Sub-Agents verwechseln. Code-Refactor 2026-04-26 abgeschlossen — keine "agent"-Identifier mehr im Source.
type: feedback
---

**Regel — der Produktname ist z2Lab Bridge** (auch kurz „Bridge", „LabBridge").
Vorheriger Name war „ZetLab Local Agent" — die Umbenennung wurde 2026-04-26 entschieden und in mehreren Commits durchgeführt (siehe git log: `e3d2e0d` Renames, `c139fe7` Inhalt).

**Why:** „Agent" wurde mit Claude Code Sub-Agents (.claude/agents/*.md) verwechselt. „Bridge" ist eindeutig, kommt direkt aus der Architekturbeschreibung („Brücke zwischen Cloud und lokalen Systemen"), und kollidiert mit nichts im Repo (Gateway/Proxy sind bereits anderweitig vergeben).

**How to apply:**
- In jeder Antwort, Doku, Commit-Message, Variable, Identifier → **Bridge** verwenden
- Wenn Claude-Sub-Agents gemeint sind, IMMER explizit „Claude Sub-Agent" oder „.claude/agents/-Definition" sagen
- Kein neuer `agent`-Identifier mehr — sofort `bridge` nutzen

**Refactor-Bilanz (alle umbenannt):**

| Bereich | Vorher | Jetzt |
|---|---|---|
| Spec | `tmp/agent/README.md` | `Documentation/Bridge/README.md` |
| API-Routes | `/api/v1/agent/*` | `/api/v1/bridge/*` |
| Admin-API | `/api/v1/admin/agents/*` | `/api/v1/admin/bridges/*` |
| Admin-UI | `/admin/agents` | `/admin/bridges` |
| Domain Entity | `AgentJob` | `BridgeJob` |
| Application Repo | `IAgentJobRepository`, `IAgentRegistrationRepository` | `IBridgeJobRepository`, `IBridgeRegistrationRepository` |
| Prisma Models | `AgentJob`, `AgentRegistration` | `BridgeJob`, `BridgeRegistration` |
| Flyway-SQL (3 Provider) | `V3__create_agent_jobs.sql`, `V8__create_agent_registrations.sql` | `V3__create_bridge_jobs.sql`, `V8__create_bridge_registrations.sql` |
| OpenAPI Tag | `Agent` | `Bridge` |
| OpenAPI Schemas | `AgentJobResponse`, `ListAgentJobsResponse` | `BridgeJobResponse`, `ListBridgeJobsResponse` |
| i18n Nav-Key | `adminAgents` | `adminBridges` |
| ENV-Vars (geplant) | `AGENT_*` | `BRIDGE_*` |
| Geplantes Repo | `zetlab-agent/` | `z2lab-bridge/` |
| Binary-Name (geplant) | `zetlab-agent.exe` | `z2lab-bridge.exe` |

**Was bleibt unverändert (kein Bridge-Bezug):** `userAgent` HTTP-Header in DeepLink-Service — das ist der HTTP User-Agent-Header, hat nichts mit der Bridge zu tun.
