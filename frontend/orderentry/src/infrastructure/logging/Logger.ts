/**
 * Logger — centralized structured logging for the infrastructure layer.
 *
 * Usage:
 *   const log = createLogger("ResultsController");
 *   log.info("Fetching DiagnosticReports", { patientId: "p-123" });
 *   log.error("FHIR request failed", { status: 503 });
 *
 * Configuration (via EnvConfig / environment variables):
 *   LOG_LEVEL = debug | info | warn | error | silent   (default: info)
 *   LOG_FILE  = /var/log/zetlab.log                    (default: none)
 *
 * Log levels are ordered: debug < info < warn < error < silent.
 * A message is emitted only when its level >= the configured level.
 *
 * Output format (JSON, one object per line):
 *   {"time":"2024-03-01T12:00:00.000Z","level":"info","ctx":"ResultsController","msg":"...","patientId":"p-123"}
 *
 * File logging is optional. When LOG_FILE is set the same JSON line is
 * appended to the file in addition to stdout/stderr. File I/O uses the
 * synchronous Node.js fs API so it is safe inside Next.js API routes
 * (no async overhead, no lost lines on crash).
 */

// ── Log level ordering ────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function parseLevel(raw: string): LogLevel {
  const v = raw.toLowerCase().trim() as LogLevel;
  return v in LEVEL_RANK ? v : "info";
}

// ── Mutable runtime config ────────────────────────────────────────────────────
//
// LOG_LEVEL can be changed at runtime via POST /api/v1/config (which writes
// data/config.json). The ConfigController calls refreshLogLevel() after a
// successful save so subsequent log() calls see the new level — no restart.
//
// process.env always wins over the config.json override, so an explicitly
// set ORDERENTRY_LOG__LEVEL cannot be downgraded by the GUI.

function envLogLevel(): LogLevel | null {
  const raw = process.env[`${(process.env.APP_NAME ?? "ORDERENTRY").toUpperCase()}_LOG__LEVEL`];
  return raw ? parseLevel(raw) : null;
}

let _currentLevel: LogLevel = envLogLevel() ?? "info";

const _logFile: string | null =
  (process.env[`${(process.env.APP_NAME ?? "ORDERENTRY").toUpperCase()}_LOG__FILE`] ?? "").trim() || null;

/**
 * Re-reads the effective log level from process.env (highest priority) or the
 * given override (typically the value just written by POST /api/v1/config).
 * Returns the new level so callers can log a confirmation.
 *
 * Called from ConfigController.update() after `LOG_LEVEL` is mutated. Logger
 * instances created earlier pick up the new level on their next emit() because
 * they read `_currentLevel` at log time, not at construction time.
 */
export function refreshLogLevel(override?: string): LogLevel {
  const fromEnv = envLogLevel();
  const next: LogLevel = fromEnv ?? (override ? parseLevel(override) : "info");
  _currentLevel = next;
  return next;
}

/** Returns the level the logger would currently use for a fresh log call. */
export function currentLogLevel(): LogLevel {
  return _currentLevel;
}

// ── Formatter ─────────────────────────────────────────────────────────────────

function format(
  level: LogLevel,
  ctx: string,
  message: string,
  meta?: Record<string, unknown>,
  traceId?: string,
): string {
  const entry: Record<string, unknown> = {
    time: new Date().toISOString(),
    level,
    ctx,
    msg: message,
    ...(traceId ? { traceId } : {}),
    ...meta,
  };
  return JSON.stringify(entry);
}

// ── File appender + rotation ──────────────────────────────────────────────────
//
// Rotation policy: when the active file exceeds LOG__MAX_SIZE_MB, it is
// renamed to `<file>.1`, the previous `.1` becomes `.2`, …, up to
// `<file>.<LOG__MAX_FILES>`. The oldest one is deleted. The active file
// is then truncated and writing continues.
//
// Numbering matches the convention used by logrotate(8) and Java logback —
// lower index = newer log. Files are gzip-free for easy `tail`/`grep`.

const _maxSizeBytes: number = (() => {
  const raw = parseFloat(
    process.env[`${(process.env.APP_NAME ?? "ORDERENTRY").toUpperCase()}_LOG__MAX_SIZE_MB`] ?? "10",
  );
  return !isNaN(raw) && raw > 0 ? Math.round(raw * 1024 * 1024) : 10 * 1024 * 1024;
})();

const _maxFiles: number = (() => {
  const raw = parseInt(
    process.env[`${(process.env.APP_NAME ?? "ORDERENTRY").toUpperCase()}_LOG__MAX_FILES`] ?? "10",
    10,
  );
  return !isNaN(raw) && raw >= 0 ? raw : 10;
})();

function rotateIfNeeded(fs: typeof import("fs"), file: string): void {
  let size = 0;
  try {
    size = fs.statSync(file).size;
  } catch {
    return; // file doesn't exist yet — nothing to rotate
  }
  if (size < _maxSizeBytes) return;

  // Drop the oldest if we're at the cap
  const oldest = `${file}.${_maxFiles}`;
  try { fs.unlinkSync(oldest); } catch { /* may not exist */ }

  // Shift .N → .(N+1) for N from maxFiles-1 down to 1
  for (let i = _maxFiles - 1; i >= 1; i--) {
    const src = `${file}.${i}`;
    const dst = `${file}.${i + 1}`;
    try { fs.renameSync(src, dst); } catch { /* may not exist */ }
  }

  // Active file → .1
  if (_maxFiles >= 1) {
    try { fs.renameSync(file, `${file}.1`); } catch { /* may not exist */ }
  } else {
    // maxFiles=0 means "no archive" — just truncate
    try { fs.unlinkSync(file); } catch { /* ignore */ }
  }
}

function appendToFile(line: string): void {
  if (!_logFile) return;
  if (typeof window !== "undefined") return; // browser — no file I/O
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs   = require("fs")   as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const dir  = path.dirname(_logFile);
    if (dir && dir !== ".") fs.mkdirSync(dir, { recursive: true });
    rotateIfNeeded(fs, _logFile);
    fs.appendFileSync(_logFile, line + "\n", "utf8");
  } catch {
    // Swallow file errors — console logging must not be interrupted
  }
}

// ── Logger class ──────────────────────────────────────────────────────────────

export class Logger {
  private readonly ctx: string;
  private readonly traceId: string | undefined;

  constructor(ctx: string, traceId?: string) {
    this.ctx = ctx;
    this.traceId = traceId;
  }

  /**
   * Returns a new Logger instance bound to an explicit traceId.
   * Useful when you have the traceId from an incoming header and want to
   * pin it to all log lines in a request handler before OTel context is set:
   *
   *   const log = createLogger("MyController").withTraceId(req.headers["x-trace-id"]);
   *
   * When ENABLE_TRACING=true the active OpenTelemetry span is read automatically
   * via getActiveTraceId() — withTraceId() is only needed for manual overrides.
   */
  withTraceId(traceId: string): Logger {
    return new Logger(this.ctx, traceId);
  }

  private emit(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    // Read the current level on every call so runtime overrides
    // (POST /api/v1/config → refreshLogLevel) take effect without restart.
    if (LEVEL_RANK[level] < LEVEL_RANK[_currentLevel]) return;
    const line = format(level, this.ctx, message, meta, this.traceId);
    if (level === "error" || level === "warn") {
      console.error(line);
    } else {
      console.log(line);
    }
    appendToFile(line);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.emit("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.emit("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.emit("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.emit("error", message, meta);
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates a Logger scoped to the given context (class or module name).
 * The log level is read from the environment at module load time.
 */
export function createLogger(ctx: string): Logger {
  return new Logger(ctx);
}
