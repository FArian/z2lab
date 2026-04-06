# _tmp — Temporarily Moved Files

This folder contains files moved during architecture cleanup (2026-04-06).

**No files were deleted.** All files can be restored from here if needed.

## Structure

| Folder | Contents |
|---|---|
| `legacy/` | Dead code, superseded implementations |
| `backup/` | Old configs, migrated data, wrong-location files |
| `experiments/` | AI demos, playground, one-off tests |
| `logs/` | Generated output, HL7 messages, test data |

## Moved files

| From | To | Reason |
|---|---|---|
| `simple/` | `legacy/simple/` | CLAUDE.md: "DEAD CODE — never import, never modify" |
| `frontend/orderentry/prisma/data/` | `backup/prisma-data/` | Wrong DB location — real DB is at `frontend/orderentry/data/` |
| `data/lis/` | `logs/lis/` | Test HL7 messages, not production code |
| `frontend/orderentry/data/users.json` | `backup/users.json` | Migrated to SQLite — kept as reference backup |
| `infrastructure/docker/docker-compose_GPT.yml` | `experiments/docker-compose_GPT.yml` | ChatGPT integration experiment, not part of production stack |

## Restore

To restore any file, move it back to its original location (see table above).

## After validation

Once the application has been running stably in production, files in this folder
may be permanently deleted after team review.
