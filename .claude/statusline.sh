#!/usr/bin/env bash
# Statusline for z2Lab OrderEntry
# Shows: branch · last commit · NEXT_PUBLIC_LAB_ORG_ID · Node version
# Reads JSON event from stdin (Claude Code statusline contract).
# Output goes to stdout, single line.

set -e

# Try to read working directory from stdin JSON; fall back to $PWD
input=$(cat 2>/dev/null || true)
cwd=$(printf '%s' "$input" | grep -oE '"current_working_directory"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed -E 's/.*"current_working_directory"[[:space:]]*:[[:space:]]*"//; s/"$//')
[ -z "$cwd" ] && cwd=$(printf '%s' "$input" | grep -oE '"cwd"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed -E 's/.*"cwd"[[:space:]]*:[[:space:]]*"//; s/"$//')
[ -z "$cwd" ] && cwd="$PWD"

# Normalise Windows path
cwd=$(printf '%s' "$cwd" | tr '\\' '/')
cd "$cwd" 2>/dev/null || true

# Git branch
branch=$(git branch --show-current 2>/dev/null || echo "?")

# Last commit (short hash + first 50 chars of message)
last_commit=$(git log -1 --pretty=format:"%h %s" 2>/dev/null | cut -c1-50)
[ -z "$last_commit" ] && last_commit="(no commits)"

# Lab org id from .env.local (frontend)
lab_org=""
for env_file in frontend/orderentry/.env.local frontend/orderentry/.env; do
  if [ -f "$env_file" ]; then
    lab_org=$(grep "^NEXT_PUBLIC_LAB_ORG_ID=" "$env_file" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
    [ -n "$lab_org" ] && break
  fi
done
[ -z "$lab_org" ] && lab_org="?"

# Node version (cached env var if available, faster than calling node)
node_version="${NODE_VERSION:-$(node --version 2>/dev/null || echo "?")}"

# Working tree dirty marker
dirty=""
if ! git diff --quiet --exit-code 2>/dev/null; then
  dirty=" *"
fi

printf "🌿 %s%s │ 📝 %s │ 🏥 %s │ ⚡ %s\n" "$branch" "$dirty" "$last_commit" "$lab_org" "$node_version"
