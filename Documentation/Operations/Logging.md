# Logging — z2Lab OrderEntry

Structured JSON logging across the whole server. One line = one event = one parsable JSON object. Designed so the same stream feeds the console, an optional log file, and the Admin UI's `/admin/logs` viewer.

---

## Levels

The logger supports **4 emit levels** (plus `silent` to suppress all output).

| Level | Numeric rank | When to use it |
|---|---|---|
| `debug` | 0 | Step-by-step trace inside a request — values seen, decisions taken, downstream calls made. Off by default; turn on when something is wrong and you need to know why. |
| `info`  | 1 | One line per significant business event — order created, mail sent, user logged in. Default level. |
| `warn`  | 2 | Recoverable trouble — failed retry, malformed input that was rejected, fallback path taken. |
| `error` | 3 | Unrecoverable failure — uncaught exception, downstream service unreachable, data corruption. |
| `silent`| 4 | Special — emits nothing. Reserved for tests. |

A message is emitted only when its level is **>=** the configured level. So `LOG_LEVEL=debug` shows everything, `LOG_LEVEL=info` (default) shows info + warn + error, `LOG_LEVEL=error` shows only errors, and `LOG_LEVEL=silent` suppresses all output.

> **No SEVERE / FATAL / FINE / FINER.** The four levels above (the SLF4J / Pino / Bunyan standard) cover every real use case in a Node.js app. If you're used to Java's `SEVERE`, that maps to `error` here.

---

## Setting the level

Two ways, in priority order. The lower-priority source is **only consulted when the higher one is unset**.

### 1. `process.env` — highest priority, requires restart

Set in `.env.local` (dev) or `docker-compose.yml` (production):

```bash
ORDERENTRY_LOG__LEVEL=debug
```

Restart the server. Once set in `process.env`, the GUI override (option 2) is ignored — the env var "locks" the value.

### 2. Runtime override via Admin UI — no restart needed

`POST /api/v1/config` writes `data/config.json`. The `ConfigController` calls `refreshLogLevel()` after a successful save so the change takes effect on the next log call — same process, no restart.

```bash
curl -X POST http://localhost:3000/api/v1/config \
  -H "Content-Type: application/json" \
  -b "session=YOUR_COOKIE" \
  -d '{"overrides": {"LOG_LEVEL": "debug"}}'
```

Or via the Admin UI: **/admin/env** (Config tab) → set `LOG_LEVEL` → Save.

> Vercel: this path returns 405 (the filesystem is ephemeral). On Vercel use option 1 in the project's environment settings.

### Resolution order (full priority chain)

```
process.env[ORDERENTRY_LOG__LEVEL]  ← always wins
data/config.json {LOG_LEVEL}         ← runtime override, used only when env is unset
"info"                               ← hardcoded fallback
```

---

## Output

### JSON line per event

```json
{"time":"2026-04-26T20:41:32.812Z","level":"debug","ctx":"MailController","msg":"Mail test: invoked","provider":"gmail","authType":"APP_PASSWORD","host":"smtp.gmail.com","port":"587","hasPassword":true,"bodyHasTo":true}
```

Standard fields:

| Field | Meaning |
|---|---|
| `time`    | ISO 8601 UTC timestamp |
| `level`   | `debug` / `info` / `warn` / `error` |
| `ctx`     | Class or module name passed to `createLogger()` |
| `msg`     | Human-readable message |
| `traceId` | Optional — present when OpenTelemetry tracing is active |
| `…`       | Caller-supplied metadata fields (provider, durationMs, etc.) |

### Where lines go

| Sink | When |
|---|---|
| `stdout` | Every emit (`console.log` for debug/info, `console.error` for warn/error) |
| Log file at `ORDERENTRY_LOG__FILE` | Every emit, only if the env var is set |
| `/admin/logs` viewer | Reads the log file; if the file is unset the page shows "logging disabled" |

---

## Configuring the log file

```bash
# .env.local — must be a FILE path, not a directory
ORDERENTRY_LOG__FILE=C:\tmp\orderentry.log          # Windows
ORDERENTRY_LOG__FILE=/var/log/orderentry.log        # Linux

# Rotation (optional; defaults shown)
ORDERENTRY_LOG__MAX_SIZE_MB=10                      # rotate at 10 MB
ORDERENTRY_LOG__MAX_FILES=10                        # keep 10 archives
```

> Common mistake: setting `ORDERENTRY_LOG__FILE=C:\tmp` (a directory). The logger then tries to append-write to a path that is a directory and silently fails — the `/admin/logs` view stays empty. Always use a full file path with extension.

The directory is created automatically (`mkdir -p`) on first write. Restart needed after changing the file path; rotation parameters are read at module load too.

### Rotation

Before each write the logger checks the active file's size. When it exceeds `LOG__MAX_SIZE_MB`:

1. The oldest archive (`<file>.<MAX_FILES>`) is deleted
2. Each existing archive is shifted up one number: `.9 → .10`, `.8 → .9`, …, `.1 → .2`
3. The active file becomes `.1`
4. Writing continues into a fresh active file

Same convention as `logrotate(8)` and Java's `logback`: lower index = newer log.

```
/var/log/
├── orderentry.log         ← active (always being written to)
├── orderentry.log.1       ← previous file, just rotated
├── orderentry.log.2
├── …
└── orderentry.log.10      ← oldest; will be dropped on the next rotation
```

**Disk-usage upper bound:**

| `MAX_SIZE_MB` | `MAX_FILES` | Worst-case usage |
|---|---|---|
| 10 | 10 (default) | 110 MB |
| 50 | 5 | 300 MB |
| 100 | 20 | 2.1 GB |

Set `LOG__MAX_FILES=0` to disable archiving — the active file is then truncated when the size cap is hit.

> No gzip — files are kept plain so `tail`, `grep`, and `jq` work directly without piping through `zcat`. If disk is tight, lower `MAX_SIZE_MB` instead.

---

## Reading logs

### Browser

`/admin/logs` (admin only). Filter by level, search by text, follow tail.

### API

```bash
# Last 200 entries (default)
curl -b "session=…" http://localhost:3000/api/v1/logs

# Tail the last 50 entries, only warn+ errors
curl -b "session=…" "http://localhost:3000/api/v1/logs?tail=50&level=warn"

# Search for a string in msg or ctx
curl -b "session=…" "http://localhost:3000/api/v1/logs?search=mail"
```

| Query param | Default | Range |
|---|---|---|
| `tail`   | 200    | 1–1000 |
| `level`  | (any)  | `debug` / `info` / `warn` / `error` (filters >= this rank) |
| `search` | (none) | substring match in `msg` or `ctx`, case-insensitive |

The endpoint returns a JSON array sorted **newest first**.

### Tail directly from the file

```bash
tail -f /var/log/zetlab/zetlab.log | jq .
```

---

## Examples — what you see at each level

**`POST /api/v1/admin/mail/test`** with `{"to":"…"}`:

### `LOG_LEVEL=info` (default)

```
{"time":"…","level":"info","ctx":"MailController","msg":"Mail test: verifying SMTP connection (provider=gmail)"}
{"time":"…","level":"info","ctx":"MailController","msg":"Mail test: test email sent to … via gmail","provider":"gmail","durationMs":1832,"subject":"[TEST] z2Lab OrderEntry — Test-E-Mail"}
```

### `LOG_LEVEL=debug` (turn on for troubleshooting)

```
{"time":"…","level":"debug","ctx":"MailController","msg":"Mail test: invoked","provider":"gmail","authType":"APP_PASSWORD","host":"smtp.gmail.com","port":"587","secure":false,"hasUser":true,"hasPassword":true,"hasOAuthClient":false,"hasOAuthSecret":false,"hasRefreshToken":false,"bodyHasTo":true,"bodyHasSubject":false,"bodyHasText":false,"bodyHasHtml":false}
{"time":"…","level":"info","ctx":"MailController","msg":"Mail test: verifying SMTP connection (provider=gmail)"}
{"time":"…","level":"debug","ctx":"MailController","msg":"Mail test: calling service.verify()","provider":"gmail","host":"smtp.gmail.com","port":"587"}
{"time":"…","level":"debug","ctx":"NodemailerMailService","msg":"NodemailerMailService.verify(): connecting to SMTP server","host":"smtp.gmail.com","port":"587","secure":false}
{"time":"…","level":"debug","ctx":"NodemailerMailService","msg":"NodemailerMailService.verify(): success","durationMs":412}
{"time":"…","level":"debug","ctx":"MailController","msg":"Mail test: verify() returned","ok":true,"durationMs":412}
{"time":"…","level":"debug","ctx":"MailController","msg":"Mail test: sending message","to":"…","subject":"[TEST] z2Lab OrderEntry — Test-E-Mail","textLength":215,"htmlLength":348,"from":"z2Lab OrderEntry <…>"}
{"time":"…","level":"debug","ctx":"NodemailerMailService","msg":"NodemailerMailService.send(): dispatching","to":"…","from":"z2Lab OrderEntry <…>","subject":"[TEST] …","textLength":215,"htmlLength":348}
{"time":"…","level":"debug","ctx":"NodemailerMailService","msg":"NodemailerMailService.send(): accepted","messageId":"<…@gmail.com>","response":"250 2.0.0 OK","durationMs":1420}
{"time":"…","level":"info","ctx":"MailController","msg":"Mail test: test email sent to … via gmail","provider":"gmail","durationMs":1832,"subject":"[TEST] …"}
```

Note how `debug` shows the full configuration snapshot (without secrets — only `hasPassword:true`), each transport step with timing, and the SMTP server's `250 OK` response.

---

## Conventions for new code

When adding logs to a controller, service, or use case:

| Use | For |
|---|---|
| `log.debug()` | Step-by-step trace; values you'd want during a postmortem; structured metadata only — no secrets |
| `log.info()` | One line per business event that an admin watching the log would want to see |
| `log.warn()` | Anything that you handled but a human should review |
| `log.error()` | Anything that breaks the request or the system |

**Always pass structured metadata** as the second argument so it's queryable. Don't string-concatenate values into the message:

```typescript
// Good
log.info(`User created: ${user.id}`, { userId: user.id, role: user.role });

// Avoid
log.info(`User created: ${user.id} role=${user.role} email=${user.email}`);
```

**Never log credentials.** When a value is sensitive, log a boolean instead:

```typescript
log.debug("OAuth context", {
  clientId:  config.clientId,        // ok — public identifier
  hasSecret: !!config.clientSecret,  // ok — boolean
  // clientSecret: config.clientSecret  ← NEVER
});
```

**Stable `ctx` per file** — pass the class name (or module name) once at the top:

```typescript
const log = createLogger("MailController");
```

---

## Related files

| Path | Purpose |
|---|---|
| [src/infrastructure/logging/Logger.ts](../../frontend/orderentry/src/infrastructure/logging/Logger.ts) | Logger class, `createLogger()`, `refreshLogLevel()`, `currentLogLevel()` |
| [src/infrastructure/config/RuntimeConfig.ts](../../frontend/orderentry/src/infrastructure/config/RuntimeConfig.ts) | Runtime override layer (`data/config.json`) |
| [src/infrastructure/api/controllers/ConfigController.ts](../../frontend/orderentry/src/infrastructure/api/controllers/ConfigController.ts) | `POST /api/v1/config` calls `refreshLogLevel()` after save |
| [src/app/api/logs/route.ts](../../frontend/orderentry/src/app/api/logs/route.ts) | `GET /api/v1/logs` — read entries from the log file |
| [Documentation/Deployment/EnvironmentVariables.md](../Deployment/EnvironmentVariables.md) | Full env var reference (search for `LOG__`) |
