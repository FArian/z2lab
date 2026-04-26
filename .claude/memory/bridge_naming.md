---
name: Bridge — Namensregel und Übergangsphase (KRITISCH)
description: Das Produkt heißt jetzt z2Lab Bridge (vorher "ZetLab Local Agent"). NIE mit Claude Sub-Agents verwechseln. Code/Spec heißen noch agent — Renaming läuft.
type: feedback
---

**Regel — der Produktname ist jetzt z2Lab Bridge** (auch kurz „Bridge", „LabBridge").
Vorheriger Name war „ZetLab Local Agent" — die Umbenennung wurde 2026-04-26 entschieden.

**Why:** „Agent" wurde mit Claude Code Sub-Agents (.claude/agents/*.md) verwechselt. „Bridge" ist eindeutig, kommt direkt aus der Architekturbeschreibung („Brücke zwischen Cloud und lokalen Systemen"), und kollidiert mit nichts im Repo (Gateway/Proxy sind bereits anderweitig vergeben).

**How to apply:**
- In jeder neuen Antwort, Doku, Commit-Message, Variable, Identifier → **Bridge** verwenden
- Wenn du Claude-Sub-Agents meinst, IMMER explizit „Claude Sub-Agent" oder „.claude/agents/-Definition" sagen
- Beim Lesen von altem Code/Doku: `agent` = Bridge (mentale Übersetzung), bis Renaming abgeschlossen

**Übergangsphase — diese Stellen heißen NOCH agent (nicht reverten, sukzessiv umbenennen):**

| Pfad | Status |
|---|---|
| `frontend/orderentry/src/app/api/v1/agent/*` | TODO → `/api/v1/bridge/*` |
| `frontend/orderentry/src/app/api/v1/admin/agents/*` | TODO → `admin/bridges/*` |
| `frontend/orderentry/src/app/admin/agents/page.tsx` | TODO → `admin/bridges/page.tsx` |
| `frontend/orderentry/tmp/agent/README.md` | TODO → `tmp/bridge/README.md` + Inhalt umschreiben |
| Geplantes Repo `zetlab-agent/` | wird → `z2lab-bridge/` |
| ENV-Variablen `AGENT_*` | TODO → `BRIDGE_*` |

**Bei jedem neuen Code:** sofort Bridge-Namen verwenden — keine neuen `agent`-Identifier mehr anlegen.
