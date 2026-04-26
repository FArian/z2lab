---
name: Testing Setup (Vitest, env=node, lint conventions)
description: Wichtige Testing-Regeln nach Vitest-Refactor 2026-04-26 — Default-Env "node" (nicht jsdom), Underscore-Convention für ungenutzte Vars, UserJwtService nimmt secret per DI.
type: feedback
---

**Gilt für alle zukünftigen Tests in diesem Repo.**

## Vitest Environment

`vitest.config.ts` setzt `environment: "node"` als Default. **Nicht jsdom.**

**Why:** jsdom@29 → cssstyle@4 → `@asamuzakjp/css-color@3.2` enthält Top-Level Await. Node 20 (CI) verbietet `require()` von ESM-mit-TLA → `ERR_REQUIRE_ASYNC_MODULE` → 0 von 25 Test-Files laden in CI. Außerdem hat dieses Repo aktuell keinen einzigen Test der DOM-Matcher braucht.

**How to apply:**
- Neue Logik-Tests: keine besondere Konfiguration nötig
- Komponenten-Tests (falls jemals nötig): per-File aktivieren mit `// @vitest-environment jsdom` als erste Zeile **plus** lokalen `import "@testing-library/jest-dom"` im Test-File
- **NIEMALS** `@testing-library/jest-dom` in `vitest.setup.ts` global importieren — das lädt jsdom für jeden Test, der CI-Crash kommt zurück

## ESLint Underscore-Convention

`eslint.config.mjs` hat `argsIgnorePattern: "^_"` (plus vars/caughtErrors/destructuredArray) konfiguriert.

**How to apply:**
- Ungenutzten Param/Var: einfach `_` prefix verwenden (`_url`, `_method`, `_unused`)
- **Niemals** `// eslint-disable-next-line @typescript-eslint/no-unused-vars` Kommentare schreiben — das ist obsolet
- Echte ungenutzte Imports/Vars (ohne Underscore): löschen, nicht maskieren

## UserJwtService DI Pattern

`UserJwtService` nimmt das HMAC-Secret jetzt per Konstruktor-Parameter (Default: `EnvConfig.authSecret`).

**Why:** `EnvConfig` cached `process.env` beim Modul-Load — `process.env.AUTH_SECRET` zur Test-Laufzeit zu mutieren erreicht den Service nicht. Der alte Test mit `process.env.AUTH_SECRET = "..."` war wirkungslos und gleichzeitig falsch (richtiger Name wäre `ORDERENTRY_AUTH__SECRET`).

**How to apply:**
- Production-Code unverändert: `userJwtService` Singleton verwendet automatisch `EnvConfig.authSecret`
- Tests: zwei Service-Instanzen mit unterschiedlichen Secrets statt `process.env`-Mutation
  ```ts
  const a = new UserJwtService("secret-A");
  const b = new UserJwtService("secret-B");
  expect(b.verify(a.sign(...))).toBeNull();
  ```
- Selbes Pattern bei jeder Service-Klasse die EnvConfig liest und im Test variiert werden muss
