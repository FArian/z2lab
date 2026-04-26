---
description: Verify all i18n keys exist in all 5 language files (de, de-CH, en, fr, it)
---

Compare keys across `frontend/orderentry/src/messages/{de,de-CH,en,fr,it}.json`.

## Steps

1. Read all 5 files.
2. Recursively flatten every JSON to dotted key paths (e.g. `results.noResults`, `nav.home.title`).
3. Build the **union** of all keys across all files.
4. For each language file, list keys that are missing from the union.

## Special rule

Per CLAUDE.md, **`de-CH` falls back to `de`**. Therefore:
- A key missing in `de-CH` but present in `de` → ✅ OK (covered by fallback)
- A key missing in `de-CH` AND missing in `de` → ❌ broken
- A key missing in `de` but present anywhere else → ❌ broken (de is the primary source)

## Output

Report as one section per language:

```
## de.json (PRIMARY)
- ❌ missing: results.exportError
- ❌ missing: orders.confirmDelete

## en.json
- ❌ missing: results.exportError

## fr.json
- ❌ missing: 12 keys (list)
```

**Do NOT auto-fill missing translations.** Translation is a human decision. Only report.

## Bonus checks

- Detect **empty string values** (`""`) — usually unfinished translations
- Detect **values identical to the key** (e.g. `"foo.bar": "foo.bar"`) — placeholder leftovers
