---
name: Agent — Begriffsklärung (KRITISCH)
description: Wenn der User "Agent" sagt, meint er IMMER den ZetLab Local Agent (sein Go-Produkt), NIE die Claude Code Sub-Agents unter .claude/agents/.
type: feedback
---

**Regel:** Im Sprachgebrauch dieses Projekts bedeutet **„Agent" = ZetLab Local Agent** — das geplante Go-Binary für HL7-Datenaustausch und Druck im lokalen Klinik-Netzwerk.

**Why:** Es gibt zwei Dinge im Repo, die „Agent" heißen, aber nichts miteinander zu tun haben. Der User wurde verwirrt, als ich beide in derselben Memory-Datei erwähnt habe. Sein Produkt ist das Geschäft — Claude-Sub-Agents sind nur interne Tooling-Konfiguration.

**How to apply:**
- Bei jeder Erwähnung von „Agent" → ZetLab Local Agent (Go-Binary, Klinik, HL7, Druck, `tmp/agent/README.md` Spec, `frontend/orderentry/src/app/api/v1/agent/` Routes)
- Wenn ich von Claude-Sub-Agents reden muss, IMMER explizit „Claude Sub-Agent" oder „`.claude/agents/`-Definition" sagen — nie nur „Agent"
- In Memory-Files, Commits, Erklärungen die beiden NICHT in einem Atemzug mischen

**Trennung im Repo:**
| Sache | Pfad |
|---|---|
| ZetLab Local Agent — Spec | `frontend/orderentry/tmp/agent/README.md` |
| ZetLab Local Agent — API-Routes | `frontend/orderentry/src/app/api/v1/agent/*` |
| ZetLab Local Agent — Admin UI | `frontend/orderentry/src/app/admin/agents/` |
| ZetLab Local Agent — späteres Go-Repo | `zetlab-agent/` (existiert noch nicht) |
| Claude Sub-Agent Konfigurationen | `.claude/agents/*.md` |
