#!/usr/bin/env bash
# Post-Edit Reminder Hook for z2Lab OrderEntry
# Reads the Claude Code hook event from stdin (JSON), checks the edited file path,
# and prints a context-specific reminder to stderr (visible to Claude).
# Exit code is always 0 — this is a soft reminder, never a blocker.

set -e

# Read JSON event from stdin (small, no need for jq)
input=$(cat)

# Extract file_path from tool_input — works for Edit / Write / MultiEdit
file_path=$(printf '%s' "$input" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed -E 's/.*"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//')

[ -z "$file_path" ] && exit 0

# Normalise Windows backslashes for matching
norm=$(printf '%s' "$file_path" | tr '\\' '/')

case "$norm" in
  */src/app/api/v1/*/route.ts)
    echo "💡 v1 API route changed — verify: openapi.ts, RouteRegistry.ts, CLAUDE.md routes table. Run /openapi-sync to check." >&2
    ;;
  */src/app/api/*/route.ts)
    echo "💡 API route under /api/ (not v1) — per CLAUDE.md, new routes MUST go under /api/v1/. Verify this is intentional." >&2
    ;;
  */src/messages/*.json)
    echo "💡 i18n file changed — run /i18n-check to verify all 5 languages (de, de-CH, en, fr, it) are in sync." >&2
    ;;
  */src/domain/*.ts|*/src/application/*.ts)
    echo "💡 Domain/Application changed — add or update unit tests in tests/unit/ (these layers must be 80%+ covered)." >&2
    ;;
  */src/infrastructure/api/openapi.ts)
    echo "💡 OpenAPI spec changed — verify CLAUDE.md routes table is in sync. Run /openapi-sync." >&2
    ;;
  */src/infrastructure/api/gateway/RouteRegistry.ts)
    echo "💡 RouteRegistry changed — verify openapi.ts and CLAUDE.md are in sync. Run /openapi-sync." >&2
    ;;
  */prisma/schema.prisma)
    echo "💡 Prisma schema changed — generate a migration: cd frontend/orderentry && npx prisma migrate dev --name <description>" >&2
    ;;
  */CLAUDE.md)
    echo "💡 CLAUDE.md changed — consider syncing affected README.md files (per 'Documentation System' rule)." >&2
    ;;
  */.env|*/.env.local|*/.env.example)
    echo "💡 ENV file changed — ensure new variables are also documented in: CLAUDE.md (Environment Variables table) and EnvController.ENV_SCHEMA." >&2
    ;;
esac

exit 0
