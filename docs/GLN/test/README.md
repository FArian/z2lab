# Testfälle — GLN Validation (RefData SOAP)

> **Bezug:** `docs/GLN/README.md` — Implementierungsdokumentation
> **Testdateien:** `tests/unit/application/adapters/GlnAdapter.test.ts`

---

## Übersicht

| Ebene | Art | Dateien | Anzahl Tests |
|---|---|---|---|
| Unit | Adapter V1 + V2 | `GlnAdapter.test.ts` | 26 |
| Manuell | HTTP / curl | siehe unten | — |
| Manuell | Swagger UI | siehe unten | — |

---

## Unit-Tests ausführen

```bash
cd frontend/zetlab

# Nur GLN-Adapter-Tests
npm test -- --run tests/unit/application/adapters/GlnAdapter.test.ts

# Mit ausführlicher Ausgabe
npm test -- --run --reporter=verbose tests/unit/application/adapters/GlnAdapter.test.ts
```

Erwartete Ausgabe:
```
✓ GlnAdapterV1 > NAT partner > preserves gln
✓ GlnAdapterV1 > NAT partner > maps ptype correctly
...
✓ GlnAdapterV2 > v2 → v1 compatibility check > both carry the same GLN

Test Files  1 passed (1)
      Tests  26 passed (26)
```

---

## Unit-Testfälle — GlnAdapterV1

**Datei:** `tests/unit/application/adapters/GlnAdapter.test.ts`

### Fixtures

```typescript
NAT_RESULT = {
  gln: "7601000123456", ptype: "NAT", roleType: "HPC",
  organization: "",     lastName: "Müller", firstName: "Hans",
  street: "Bahnhofstrasse", streetNo: "1", zip: "8001",
  city: "Zürich", canton: "ZH", country: "CH"
}

JUR_RESULT = {
  gln: "7601001234567", ptype: "JUR", roleType: "ORG",
  organization: "Hirslanden AG", lastName: "", firstName: "",
  street: "Witellikerstrasse", streetNo: "40", zip: "8032",
  city: "Zürich", canton: "ZH", country: "CH"
}
```

### TC-V1-01 — NAT-Partner (natürliche Person)

| # | Prüfung | Erwartung |
|---|---|---|
| 01 | `result.gln` | `"7601000123456"` |
| 02 | `result.ptype` | `"NAT"` |
| 03 | `result.roleType` | `"HPC"` |
| 04 | `result.lastName` | `"Müller"` |
| 05 | `result.firstName` | `"Hans"` |
| 06 | `result.organization` | `""` (leer für NAT) |
| 07 | `result.street` | `"Bahnhofstrasse"` (flaches Feld) |
| 08 | `result.zip` | `"8001"` |
| 09 | `result.canton` | `"ZH"` |

### TC-V1-02 — JUR-Partner (juristische Person)

| # | Prüfung | Erwartung |
|---|---|---|
| 10 | `result.ptype` | `"JUR"` |
| 11 | `result.organization` | `"Hirslanden AG"` |
| 12 | `result.lastName` | `""` (leer für JUR) |
| 13 | `result.firstName` | `""` (leer für JUR) |

---

## Unit-Testfälle — GlnAdapterV2

### TC-V2-01 — NAT-Partner (Breaking Changes gegenüber V1)

| # | Prüfung | Erwartung |
|---|---|---|
| 14 | `result.gln` | `"7601000123456"` |
| 15 | `result.partnerType` | `"NAT"` (umbenannt von `ptype`) |
| 16 | `result.role` | `"HPC"` (umbenannt von `roleType`) |
| 17 | `result.displayName` | `"Müller Hans"` (berechnet) |
| 18 | `result.person` | nicht `null`, hat `lastName: "Müller"` und `firstName: "Hans"` |
| 19 | `result.organization` | `null` (nicht `""` wie in V1) |
| 20 | `result.address.street` | `"Bahnhofstrasse"` (verschachtelt) |
| 21 | `result.address.zip` | `"8001"` |
| 22 | `result.address.canton` | `"ZH"` |
| 23 | kein flaches `result["street"]` | `undefined` |
| 24 | kein flaches `result["zip"]` | `undefined` |

### TC-V2-02 — JUR-Partner

| # | Prüfung | Erwartung |
|---|---|---|
| 25 | `result.partnerType` | `"JUR"` |
| 26 | `result.displayName` | `"Hirslanden AG"` (Organisationsname) |
| 27 | `result.person` | `null` (nicht gesetzt für JUR) |
| 28 | `result.organization` | `"Hirslanden AG"` |

### TC-V2-03 — Versionskompatibilität (V1 ↔ V2 nicht verwechseln)

| # | Prüfung | Erwartung |
|---|---|---|
| 29 | V1 hat `ptype`, V2 nicht | `v1.ptype` definiert; `v2["ptype"]` `undefined` |
| 30 | V2 hat `partnerType`, V1 nicht | `v2.partnerType` definiert; `v1["partnerType"]` `undefined` |
| 31 | beide tragen dieselbe GLN | `v1.gln === v2.gln` |

---

## Unterschiede V1 ↔ V2 auf einen Blick

| Feld | V1 (flach) | V2 (verschachtelt) |
|---|---|---|
| `ptype` | `"NAT"` | — (entfernt) |
| `partnerType` | — | `"NAT"` |
| `roleType` | `"HPC"` | — (entfernt) |
| `role` | — | `"HPC"` |
| `displayName` | — | `"Müller Hans"` |
| `organization` | `""` (für NAT) | `null` (für NAT) |
| `person` | — | `{ lastName, firstName }` oder `null` |
| `street`, `zip`, etc. | direkt | unter `address.{}` |

---

## Manuelle Tests — Dev-Server

Voraussetzung: `npm run dev` läuft · Admin-Login (Cookie) vorhanden

### Vorbereitung — Login

```bash
curl -s -c cookies.txt -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin1234!"}' | jq
```

---

### TC-M-01 — Ohne Login → 401

```bash
curl -s "http://localhost:3000/api/v1/gln-lookup?gln=7601000123456" | jq
```

Erwartete Antwort (`401`):
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "authentication required"
}
```

---

### TC-M-02 — V1: Gültige natürliche Person (NAT)

```bash
curl -s -b cookies.txt \
  "http://localhost:3000/api/v1/gln-lookup?gln=7601000123456" | jq
```

Erwartete Antwort (flaches Format):
```json
{
  "gln":          "7601000123456",
  "ptype":        "NAT",
  "roleType":     "HPC",
  "organization": "",
  "lastName":     "Mustermann",
  "firstName":    "Hans",
  "street":       "Musterstrasse",
  "streetNo":     "1",
  "zip":          "3000",
  "city":         "Bern",
  "canton":       "BE",
  "country":      "CH"
}
```

> Echte Daten kommen von RefData — Werte variieren je nach GLN.

---

### TC-M-03 — V1: Gültige juristische Person (JUR)

```bash
curl -s -b cookies.txt \
  "http://localhost:3000/api/v1/gln-lookup?gln=7601001234567" | jq
```

Erwartete Antwort:
```json
{
  "gln":          "7601001234567",
  "ptype":        "JUR",
  "roleType":     "ORG",
  "organization": "Hirslanden AG",
  "lastName":     "",
  "firstName":    "",
  "street":       "Witellikerstrasse",
  ...
}
```

---

### TC-M-04 — V2: Dieselbe GLN, verschachtelte Struktur

```bash
curl -s -b cookies.txt \
  "http://localhost:3000/api/v2/gln-lookup?gln=7601000123456" | jq
```

Erwartete Antwort (verschachteltes Format):
```json
{
  "gln":         "7601000123456",
  "partnerType": "NAT",
  "role":        "HPC",
  "displayName": "Mustermann Hans",
  "person": {
    "lastName":  "Mustermann",
    "firstName": "Hans"
  },
  "organization": null,
  "address": {
    "street":    "Musterstrasse",
    "streetNo":  "1",
    "zip":       "3000",
    "city":      "Bern",
    "canton":    "BE",
    "country":   "CH"
  }
}
```

**Prüfpunkte:**
- `ptype` **nicht** vorhanden (Breaking Change)
- `partnerType` vorhanden
- `person` ist Objekt (nicht `null`)
- `organization` ist `null` (nicht `""`)
- Adressfelder unter `address.{}` (nicht flach)

---

### TC-M-05 — V2: Juristische Person — person ist null

```bash
curl -s -b cookies.txt \
  "http://localhost:3000/api/v2/gln-lookup?gln=7601001234567" | jq
```

**Prüfpunkte:**
- `person` ist `null`
- `organization` ist der Firmenname (nicht `""`)
- `displayName` ist der Firmenname

---

### TC-M-06 — GLN nicht gefunden

```bash
curl -s -b cookies.txt \
  "http://localhost:3000/api/v1/gln-lookup?gln=0000000000000" | jq
```

Erwartete Antwort (`404`):
```json
{ "error": "noGlnFound" }
```

---

### TC-M-07 — Ungültige GLN (zu kurz / nicht numerisch)

```bash
# Zu kurz
curl -s -b cookies.txt \
  "http://localhost:3000/api/v1/gln-lookup?gln=123" | jq

# Buchstaben werden durch Route gefiltert → leere GLN → RefData-Fehler
curl -s -b cookies.txt \
  "http://localhost:3000/api/v1/gln-lookup?gln=ABC" | jq
```

Erwartete Antwort: `"noGlnFound"` oder `"glnLookupError"` (kein 500)

---

### TC-M-08 — Legacy-Pfad identisch zu V1

```bash
# Unversionierter Pfad (Legacy)
curl -s -b cookies.txt \
  "http://localhost:3000/api/gln-lookup?gln=7601000123456" | jq

# V1-Pfad (stabil, empfohlen)
curl -s -b cookies.txt \
  "http://localhost:3000/api/v1/gln-lookup?gln=7601000123456" | jq
```

**Prüfung:** Beide Antworten sind identisch (gleiche Felder, gleiche Werte).

---

### TC-M-09 — ENV fehlt (`REFDATA_SOAP_URL` nicht gesetzt)

Wenn `REFDATA_SOAP_URL` nicht konfiguriert ist:

```bash
curl -s -b cookies.txt \
  "http://localhost:3000/api/v1/gln-lookup?gln=7601000123456" | jq
```

Erwartete Antwort (`503`):
```json
{ "error": "noGlnApi" }
```

---

## Swagger UI — Interaktiver Test

1. Öffne `http://localhost:3000/api/docs`
2. Login via `POST /auth/login`
3. `GET /gln-lookup` → `Try it out` → GLN eingeben → Execute
4. `GET /v2/gln-lookup` → gleiche GLN → verschachtelte Antwort vergleichen

---

## Schnell-Checkliste

```
[ ] TC-M-01  GET /v1/gln-lookup ohne Login                → 401
[ ] TC-M-02  GET /v1/gln-lookup NAT-GLN                   → flache Antwort mit ptype/roleType
[ ] TC-M-03  GET /v1/gln-lookup JUR-GLN                   → organization gesetzt, firstName/lastName leer
[ ] TC-M-04  GET /v2/gln-lookup NAT-GLN                   → verschachtelt, partnerType/role/person/address
[ ] TC-M-05  GET /v2/gln-lookup JUR-GLN                   → person: null, organization: Firmenname
[ ] TC-M-06  GET /v1/gln-lookup unbekannte GLN             → 404 noGlnFound
[ ] TC-M-07  GET /v1/gln-lookup ungültige GLN              → kein 500
[ ] TC-M-08  /api/gln-lookup = /api/v1/gln-lookup          → identische Antwort
[ ] TC-M-09  REFDATA_SOAP_URL fehlt                        → 503 noGlnApi
```
