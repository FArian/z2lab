# Claude Code Setup — z2Lab

Anleitung für die Claude-Code-Umgebung dieses Projekts: wie testen, wie nutzen, wie bei Problemen vorgehen.

---

## Verzeichnisstruktur

```
.claude/
├── README.md                  ← diese Datei
├── settings.json              ← Permissions + Hooks + Statusline (committed)
├── settings.local.json        ← Maschinen-spezifische Overrides (committed, normal leer)
├── statusline.sh              ← Statusline-Script (Bash, Unix-Format)
├── TESTING_GUIDE.md           ← Test-Konventionen (Vitest, jsdom-Pragma, etc.)
├── tasks.md
│
├── agents/                    ← Sub-Agents (architecture, fhir, qa, security, …)
├── commands/                  ← Slash-Commands (siehe Tabelle unten)
├── context/                   ← Session-Context-Files
├── hooks/                     ← Auto-Reminder-Scripts
├── memory/                    ← Persistent project memory (siehe MEMORY.md)
├── prompts/                   ← Wiederverwendbare Prompts
├── tasks/                     ← Task-Definitionen
├── templates/                 ← Code-Templates (controller/repository/usecase)
└── workflows/                 ← Mehr-Schritt-Workflows (z. B. daily-review)
```

---

## Erststart-Check

Nach `git pull` oder Claude-Code-Neustart prüfen, dass alles greift:

### 1. Slash-Commands

Tippe `/` im Eingabefeld. Diese 6 müssen in der Liste erscheinen:

| Command | Zweck |
|---|---|
| `/preflight` | 12-Step-Feature-Checkliste vor jedem Feature |
| `/check` | `lint` + `tsc --noEmit` + `npm test` in `frontend/orderentry/` |
| `/openapi-sync` | OpenAPI ↔ RouteRegistry ↔ CLAUDE.md-Routes-Tabelle synchron? |
| `/ca-violations` | 10 Clean-Architecture/Clean-Code-Verstöße aufspüren |
| `/i18n-check` | Alle 5 Sprachen (de, de-CH, en, fr, it) konsistent? |
| `/release-notes` | Conventional-Commits → Release-Notes mit Semver-Vorschlag |

**Sichtbar?** ✅ Setup ok. **Nicht sichtbar?** → siehe [Troubleshooting](#troubleshooting).

### 2. Hooks

Hooks laufen unsichtbar im Hintergrund. Test-Trigger:

- Claude eine `frontend/orderentry/src/messages/de.json` editieren lassen
  → erwartete Reminder-Ausgabe: `💡 i18n file changed — run /i18n-check ...`
- Claude irgendeine `.ts` editieren lassen, dann Session beenden mit offenen Änderungen
  → erwartete Reminder-Ausgabe: `💡 Uncommitted TypeScript changes detected ...`

### 3. Statusline (nur Terminal-CLI)

Im Terminal:

```bash
cd e:/Claude/dev/projects/healthcare/labor/z2Lab
claude
```

Untere Zeile sollte zeigen:

```
🌿 test │ 📝 701c09e claude-code: clean settings... │ 🏥 ZLZ-7601009336904 │ ⚡ v24.14.0
```

In der **VS Code Extension** wird die Statusline aktuell nicht gerendert — das ist ein UI-Unterschied, kein Bug.

### 4. Manueller Test der Statusline

```bash
echo '{"current_working_directory":"e:/Claude/dev/projects/healthcare/labor/z2Lab"}' \
  | bash .claude/statusline.sh
```

Erwartete Ausgabe: eine Zeile mit Branch + Commit + Lab-Org + Node.

---

## Slash-Commands im Detail

### `/preflight`

**Wann:** Vor jedem neuen Feature, *bevor* Code geschrieben wird.

**Was passiert:** Claude geht die 12-Step-Checkliste aus CLAUDE.md mit dir durch (Problem, Impact, Version, Risk, Architecture, Release) und stoppt am Ende — wartet auf deine Freigabe vor Implementation.

### `/check`

**Wann:** Vor jedem Commit, vor jedem PR.

**Was passiert:** Führt nacheinander aus:
1. `cd frontend/orderentry && npm run lint`
2. `cd frontend/orderentry && npx tsc --noEmit`
3. `cd frontend/orderentry && npm test`

Stoppt am ersten Fehler und zeigt die Output-Zeilen. Bei Erfolg: `✓ all green` + Test-Count.

### `/openapi-sync`

**Wann:** Nach jeder API-Route-Änderung.

**Was passiert:** Listet alle `src/app/api/v1/**/route.ts` auf und prüft ob jede in `openapi.ts`, `RouteRegistry.ts` und `CLAUDE.md` dokumentiert ist. Reporting only — schreibt keine Fixes.

### `/ca-violations`

**Wann:** Vor jedem Release oder zur Hygiene.

**Was passiert:** Scannt `src/` auf 10 typische Verstöße (z. B. `process.env` in `presentation/`, React-Imports in `domain/`, statische `fs`-Imports, `as any`, hardcoded Tailwind-Farben). Reporting only.

### `/i18n-check`

**Wann:** Nach Änderungen an `src/messages/*.json`.

**Was passiert:** Vergleicht Schlüssel über alle 5 Sprachfiles. Beachtet die `de-CH → de` Fallback-Regel. Findet auch leere Strings und Platzhalter-Werte.

### `/release-notes`

**Wann:** Vor jedem Release-Tag.

**Was passiert:** `git log <last-tag>..HEAD` → gruppiert nach Conventional-Commit-Prefix → Markdown-Output mit Semver-Vorschlag. Pusht/taggt nichts selbständig.

---

## Hooks im Detail

### `post-edit-reminder.sh`

Triggert: nach jedem `Edit`, `Write`, `MultiEdit`.

Reminder werden basierend auf dem editierten Pfad ausgegeben:

| Pfad-Pattern | Reminder |
|---|---|
| `src/app/api/v1/*/route.ts` | OpenAPI + RouteRegistry + CLAUDE.md prüfen |
| `src/app/api/*/route.ts` (nicht v1) | Warnung: neue Routes müssen unter `/api/v1/` |
| `src/messages/*.json` | `/i18n-check` ausführen |
| `src/domain/*.ts` / `src/application/*.ts` | Unit-Tests aktualisieren |
| `src/infrastructure/api/openapi.ts` | CLAUDE.md syncen |
| `src/infrastructure/api/gateway/RouteRegistry.ts` | OpenAPI + CLAUDE.md syncen |
| `prisma/schema.prisma` | Migration generieren |
| `CLAUDE.md` | README.md-Hierarchie syncen |
| `.env*` | EnvController.ENV_SCHEMA + CLAUDE.md syncen |

Ist nur ein **soft reminder** — blockiert nichts, nur Hinweis.

### `stop-check-reminder.sh`

Triggert: am Ende einer Claude-Code-Session.

Wenn offene `.ts/.tsx`-Änderungen existieren → Reminder, vor Commit `npm run lint && npx tsc --noEmit && npm test` (oder `/check`) auszuführen.

---

## Statusline

`.claude/statusline.sh` zeigt in einer Zeile:

```
🌿 <branch>[*] │ 📝 <hash> <commit-message> │ 🏥 <NEXT_PUBLIC_LAB_ORG_ID> │ ⚡ <node-version>
```

`*` neben Branch = uncommitted changes vorhanden.

**Anzeige-Verhalten:**
- ✅ Terminal CLI (`claude` im Shell): Zeile sichtbar
- ❌ VS Code Native Extension: aktuell nicht gerendert

---

## Permissions

`settings.json` erlaubt automatisch (ohne Nachfrage):

- `npm run *`, `npm test *`, `npm install`, `npm ci`
- `npx tsc *`, `npx vitest *`, `npx prisma *`, `npx next *`, `npx vercel *`
- `docker compose *`, `docker buildx *`, `docker ps`, `docker logs *`, `docker inspect *`
- `git status`, `git diff *`, `git log *`, `git show *`, `git branch *`, `git stash list`, `git describe *`, `git rev-parse *`, `git rev-list *`, `git ls-files *`
- `gh pr view/list/diff/checks *`, `gh issue view/list *`, `gh api *`, `gh run list/view *`
- `node scripts/*`, `node generate_*.mjs`
- `sqlite3 ... SELECT*` (read-only DB-Queries)
- `curl http://localhost:*` (lokale Health-Checks)
- `WebSearch`
- `WebFetch` für: hl7.org, fhir.org, terminology.hl7.org, nextjs.org, tailwindcss.com, vitest.dev, prisma.io, opentelemetry.io, swagger.io

Alles andere fragt einmal nach (gewünscht — Schutz vor unbeabsichtigten Aktionen).

**Maschinen-spezifische Overrides** gehören in `settings.local.json` (NICHT committen-relevant für Team).

---

## Troubleshooting

### Slash-Commands erscheinen nicht

1. Claude Code komplett schliessen und neu öffnen.
2. Prüfen: `ls .claude/commands/` — müssen 6 `.md`-Files sein.
3. Sicherstellen, dass jede Command-Datei eine Frontmatter hat:
   ```
   ---
   description: ...
   ---
   ```

### Statusline erscheint nicht (Terminal)

```bash
# 1. Script-Test
echo '{}' | bash .claude/statusline.sh
# Sollte eine Zeile ausgeben

# 2. Settings prüfen
node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')).statusLine))"
# Sollte zeigen: {"type":"command","command":"bash .claude/statusline.sh"}

# 3. Bash verfügbar?
which bash
```

In der **VS Code Extension** wird die Statusline nicht gerendert — kein Bug.

### Hooks feuern nicht

```bash
# Manuell testen
echo '{"tool_input":{"file_path":"frontend/orderentry/src/messages/de.json"}}' \
  | bash .claude/hooks/post-edit-reminder.sh
# Sollte einen 💡-Reminder ausgeben
```

Wenn das Script funktioniert aber Hooks beim Edit nicht feuern → Claude Code neu starten.

### Permission wird verweigert für Command der eigentlich erlaubt sein sollte

Pattern in `settings.json` prüfen — Globs wie `npm run *` matchen `npm run dev`, aber `npm install:*` matched `npm install:foo`, nicht `npm install` allein. Beide Varianten ggf. nötig.

---

## Erweitern

### Neuen Slash-Command anlegen

```bash
# .claude/commands/my-command.md
---
description: Kurze Beschreibung (erscheint im Dropdown)
---

Prompt-Text der ausgeführt wird wenn /my-command getippt wird.
Kann Tool-Calls vorschlagen, Files referenzieren, etc.
```

### Neuen Hook anlegen

1. Bash-Script in `.claude/hooks/` schreiben (liest JSON von stdin)
2. In `settings.json` unter `hooks.<EventName>` registrieren
3. Mit manuellem Test prüfen (siehe Troubleshooting)

Verfügbare Events: `PreToolUse`, `PostToolUse`, `Stop`, `UserPromptSubmit`, etc. — siehe Claude-Code-Doku.

### Neuen Agent anlegen

`.claude/agents/<name>.md` mit Frontmatter (`name`, `description`, optional `model`, `tools`). Wird automatisch via `Agent({subagent_type: "<name>"})` aufrufbar.

---

## Memory-System

Project memory liegt unter [memory/MEMORY.md](memory/MEMORY.md). Index-File enthält Pointer zu allen Memory-Files.

**Wichtig:** Project-Memory wird im Repo committed (geteilt), User-Memory liegt unter `~/.claude/projects/.../memory/` (per-Maschine, nicht geteilt).

Siehe Root-CLAUDE.md Sektion „Project Memory" für Details.
