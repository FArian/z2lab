---
description: Generate release notes from git log since last tag
---

Generate release notes for the next release.

## Steps

1. **Find last tag:** `git describe --tags --abbrev=0` (if no tag exists, use first commit)
2. **Collect commits:** `git log <last-tag>..HEAD --pretty=format:"%h|%s|%b" --no-merges`
3. **Group by conventional-commit prefix:**
   | Prefix | Section |
   |---|---|
   | `feat:` / `feature:` | ## ✨ Features |
   | `fix:` | ## 🐛 Fixes |
   | `docs:` | ## 📚 Documentation |
   | `refactor:` | ## ♻️ Refactoring |
   | `chore:` / `ci:` / `build:` | ## 🔧 Internal |
   | `perf:` | ## ⚡ Performance |
   | `test:` | ## 🧪 Tests |
   | other | ## 📝 Other |

4. **Mark breaking changes** with ⚠️ (commits with `!:` after type, or `BREAKING CHANGE:` in body)

5. **Suggest semver bump:**
   - any breaking → **major** (e.g. `v1.x.x → v2.0.0`)
   - any `feat:` and no breaking → **minor** (e.g. `v1.2.x → v1.3.0`)
   - only `fix:`/`chore:`/`docs:` → **patch** (e.g. `v1.2.3 → v1.2.4`)

6. **Per CLAUDE.md "Release Management"**, also suggest:
   - Deployment target (Docker / Vercel / both)
   - Rollback strategy
   - Migration steps (look for `prisma/migrations/` changes since last tag)

## Output format

```markdown
# Release v1.3.0 (proposed)

**Last tag:** v1.2.5 — 14 commits since.
**Bump:** minor (3 features, 5 fixes, no breaking)

## ✨ Features
- abc1234 feat: order pool threshold alerts

## 🐛 Fixes
- def5678 fix: i18n key missing in fr.json

## ⚠️ Breaking
- (none)

## 🔧 Internal
- ...

## Deployment
- Target: Docker + Vercel
- Migrations since v1.2.5: V12__add_pool_thresholds.sql
- Rollback: re-deploy previous image tag
```

**Do NOT push, tag, or commit.** Output the notes only.
