#!/usr/bin/env bash
# Stop Reminder Hook for z2Lab OrderEntry
# Triggered when a Claude Code session ends.
# If there are uncommitted .ts/.tsx changes, remind to run lint+tsc+test.
# Always exits 0 — never blocks shutdown.

set -e

# Find repo root (script lives at .claude/hooks/, repo root is two levels up)
script_dir=$(cd "$(dirname "$0")" && pwd)
repo_root=$(cd "$script_dir/../.." && pwd)
cd "$repo_root" 2>/dev/null || exit 0

# Skip if not a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Skip if no uncommitted changes at all
if git diff --quiet --exit-code 2>/dev/null && git diff --cached --quiet --exit-code 2>/dev/null; then
  exit 0
fi

# Look for uncommitted .ts/.tsx changes (working tree + staged)
ts_changed=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx|mts|cts)$' | head -5)

if [ -n "$ts_changed" ]; then
  echo "" >&2
  echo "─────────────────────────────────────────────────────────" >&2
  echo "💡 Uncommitted TypeScript changes detected." >&2
  echo "" >&2
  echo "   Before committing, run from frontend/orderentry/:" >&2
  echo "     npm run lint && npx tsc --noEmit && npm test" >&2
  echo "" >&2
  echo "   Or use the slash command:  /check" >&2
  echo "─────────────────────────────────────────────────────────" >&2
fi

exit 0
