---
name: Frontend-Pfad — orderentry vs zetlab
description: Wichtig für jede Pfadangabe — CLAUDE.md beschreibt frontend/zetlab/, im Repo liegt es aber unter frontend/orderentry/. Immer den echten Pfad nehmen.
type: project
---

**Tatsache:** Frontend-Code liegt physisch unter `frontend/orderentry/` (verifiziert 2026-04-26 via `ls frontend/`).

**CLAUDE.md** (Repository Layout Section) beschreibt aber `frontend/zetlab/` — das ist veraltet oder umgekehrt nie umbenannt worden.

**Why:** Wenn ich Pfade aus CLAUDE.md zitiere oder Befehle generiere (`cd frontend/zetlab/`), schlagen sie fehl. Der User wird verwirrt, weil seine Files unter dem anderen Pfad liegen.

**How to apply:**
- Bei jeder konkreten Pfadangabe `frontend/orderentry/...` verwenden, nie `frontend/zetlab/...`
- Wenn CLAUDE.md zitiert wird, beim Pfad still korrigieren
- Sollte bei nächster Gelegenheit mit dem User geklärt werden: Repo-Rename oder CLAUDE.md-Update?
