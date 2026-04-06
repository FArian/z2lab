# Testfälle — Authentifizierung & RBAC

> **Bezug:** `docs/auth/README.md` — Implementierungsdokumentation
> **Testdateien:** `tests/unit/domain/policies/` · `tests/unit/application/useCases/`

---

## Übersicht

| Ebene | Art | Dateien | Anzahl Tests |
|---|---|---|---|
| Unit | Rollen-Mapping | `RolePermissionMap.test.ts` | 22 |
| Unit | Permission-Use-Case | `CheckPermission.test.ts` | 22 |
| Manuell | HTTP / curl | siehe unten | — |
| Manuell | Swagger UI | siehe unten | — |

---

## Unit-Tests ausführen

```bash
cd frontend/zetlab

# Nur Auth/RBAC-Tests
npm test -- --run \
  tests/unit/domain/policies/RolePermissionMap.test.ts \
  tests/unit/application/useCases/CheckPermission.test.ts

# Alle Unit-Tests
npm test -- --run tests/unit/
```

Erwartete Ausgabe:
```
✓ RolePermissionMap > admin role > exists in the map
✓ RolePermissionMap > admin role > has ORDER_CREATE
...
✓ checkPermission > user role > denies admin:access
✓ checkPermission > permission constants shape > all permission values are colon-separated strings

Test Files  2 passed (2)
      Tests  44 passed (44)
```

---

## Unit-Testfälle — RolePermissionMap

**Datei:** `tests/unit/domain/policies/RolePermissionMap.test.ts`

### TC-RM-01 — Admin erhält alle Permissions

| # | Prüfung | Erwartung |
|---|---|---|
| 01 | `ROLE_PERMISSION_MAP["admin"]` | definiert (kein `undefined`) |
| 02 | admin hat `order:create` | `true` |
| 03 | admin hat `order:read` | `true` |
| 04 | admin hat `order:edit` | `true` |
| 05 | admin hat `patient:read` | `true` |
| 06 | admin hat `patient:edit` | `true` |
| 07 | admin hat `gln:read` | `true` |
| 08 | admin hat `gln:sync` | `true` |
| 09 | admin hat `user:manage` | `true` |
| 10 | admin hat `admin:access` | `true` |

### TC-RM-02 — User erhält nur eingeschränkte Permissions

| # | Prüfung | Erwartung |
|---|---|---|
| 11 | `ROLE_PERMISSION_MAP["user"]` | definiert |
| 12 | user hat `order:create` | `true` |
| 13 | user hat `order:read` | `true` |
| 14 | user hat `patient:read` | `true` |
| 15 | user hat `gln:read` | `true` |
| 16 | user hat **nicht** `order:edit` | `false` |
| 17 | user hat **nicht** `patient:edit` | `false` |
| 18 | user hat **nicht** `gln:sync` | `false` |
| 19 | user hat **nicht** `user:manage` | `false` |
| 20 | user hat **nicht** `admin:access` | `false` |

### TC-RM-03 — Unbekannte Rollen nicht im Map

| # | Prüfung | Erwartung |
|---|---|---|
| 21 | `ROLE_PERMISSION_MAP["superuser"]` | `undefined` |
| 22 | `ROLE_PERMISSION_MAP["guest"]` | `undefined` |

---

## Unit-Testfälle — CheckPermission

**Datei:** `tests/unit/application/useCases/CheckPermission.test.ts`

### TC-CP-01 — Admin bekommt alles erlaubt

| # | Aufruf | Erwartung |
|---|---|---|
| 01 | `checkPermission("admin", "order:create")` | `true` |
| 02 | `checkPermission("admin", "order:read")` | `true` |
| 03 | `checkPermission("admin", "order:edit")` | `true` |
| 04 | `checkPermission("admin", "patient:read")` | `true` |
| 05 | `checkPermission("admin", "patient:edit")` | `true` |
| 06 | `checkPermission("admin", "gln:read")` | `true` |
| 07 | `checkPermission("admin", "gln:sync")` | `true` |
| 08 | `checkPermission("admin", "user:manage")` | `true` |
| 09 | `checkPermission("admin", "admin:access")` | `true` |

### TC-CP-02 — User bekommt Teilmenge

| # | Aufruf | Erwartung |
|---|---|---|
| 10 | `checkPermission("user", "order:create")` | `true` |
| 11 | `checkPermission("user", "order:read")` | `true` |
| 12 | `checkPermission("user", "patient:read")` | `true` |
| 13 | `checkPermission("user", "gln:read")` | `true` |
| 14 | `checkPermission("user", "order:edit")` | `false` |
| 15 | `checkPermission("user", "patient:edit")` | `false` |
| 16 | `checkPermission("user", "gln:sync")` | `false` |
| 17 | `checkPermission("user", "user:manage")` | `false` |
| 18 | `checkPermission("user", "admin:access")` | `false` |

### TC-CP-03 — Deny-by-default für unbekannte Rollen

| # | Aufruf | Erwartung |
|---|---|---|
| 19 | `checkPermission("", "order:read")` | `false` |
| 20 | `checkPermission("superuser", "order:read")` | `false` |
| 21 | `checkPermission("guest", "admin:access")` | `false` |

### TC-CP-04 — Permission-Konstanten-Format

| # | Prüfung | Erwartung |
|---|---|---|
| 22 | Alle `PERMISSIONS`-Werte matchen `/^[a-z]+:[a-z]+$/` | `true` für alle 9 |

---

## Manuelle Tests — Dev-Server

Voraussetzung: `npm run dev` läuft auf `http://localhost:3000`

### TC-M-01 — Nicht eingeloggt → 401

```bash
curl -s http://localhost:3000/api/v1/me/permissions | jq
```

Erwartete Antwort (`401`):
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "authentication required",
  "instance": "http://localhost:3000/api/v1/me/permissions"
}
```

---

### TC-M-02 — Login als admin

```bash
curl -s -c cookies_admin.txt -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin1234!"}' | jq
```

Erwartete Antwort (`200`):
```json
{ "ok": true }
```

---

### TC-M-03 — Permissions als admin (alle 9)

```bash
curl -s -b cookies_admin.txt http://localhost:3000/api/v1/me/permissions | jq
```

Erwartete Antwort:
```json
{
  "role": "admin",
  "permissions": [
    "admin:access",
    "gln:read",
    "gln:sync",
    "order:create",
    "order:edit",
    "order:read",
    "patient:edit",
    "patient:read",
    "user:manage"
  ]
}
```

> Permissions sind alphabetisch sortiert.

---

### TC-M-04 — Permissions als user (4 Permissions)

```bash
# Login als user
curl -s -c cookies_user.txt -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<benutzername>","password":"<passwort>"}' | jq

# Permissions abfragen
curl -s -b cookies_user.txt http://localhost:3000/api/v1/me/permissions | jq
```

Erwartete Antwort:
```json
{
  "role": "user",
  "permissions": [
    "gln:read",
    "order:create",
    "order:read",
    "patient:read"
  ]
}
```

---

### TC-M-05 — Admin-Route als user → 403

```bash
curl -s -b cookies_user.txt http://localhost:3000/api/v1/admin/mail/status | jq
```

Erwartete Antwort (`403`):
```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "permission 'admin:access' required",
  "instance": "http://localhost:3000/api/v1/admin/mail/status"
}
```

---

### TC-M-06 — Admin-Route als admin → 200

```bash
curl -s -b cookies_admin.txt http://localhost:3000/api/v1/admin/mail/status | jq
```

Erwartete Antwort (`200`): Mail-Konfigurationsstatus ohne Secrets.

---

### TC-M-07 — GLN-Route ohne Login → 401

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

### TC-M-08 — GLN-Route als user → erlaubt (200 oder RefData-Fehler)

```bash
curl -s -b cookies_user.txt "http://localhost:3000/api/v1/gln-lookup?gln=7601000123456" | jq
```

Kein `401` / `403` — user hat `gln:read`. Antwort kommt aus RefData SOAP (Erfolg oder `"noGlnFound"`).

---

### TC-M-09 — Bearer Token (ungültig) → 401

```bash
curl -s -H "Authorization: Bearer ungueltig123" \
  http://localhost:3000/api/v1/me/permissions | jq
```

Erwartete Antwort (`401`):
```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "invalid or expired token"
}
```

---

## Swagger UI — Interaktiver Test

1. Öffne `http://localhost:3000/api/docs`
2. Klick **POST /auth/login** → `Try it out` → admin-Credentials eingeben → Execute
3. Klick **GET /me/permissions** → Execute → Prüfe `role` + `permissions`
4. Klick **GET /admin/mail/status** → Execute als admin → `200`
5. Logout: **POST /auth/logout** → Execute
6. Nochmals **GET /me/permissions** → `401`

---

## Schnell-Checkliste

```
[ ] TC-M-01  GET /me/permissions ohne Login        → 401
[ ] TC-M-02  Login als admin                        → 200
[ ] TC-M-03  GET /me/permissions als admin          → 9 Permissions
[ ] TC-M-04  GET /me/permissions als user           → 4 Permissions
[ ] TC-M-05  GET /admin/mail/status als user        → 403 Forbidden
[ ] TC-M-06  GET /admin/mail/status als admin       → 200
[ ] TC-M-07  GET /gln-lookup ohne Login             → 401
[ ] TC-M-08  GET /gln-lookup als user               → 200 (kein 401/403)
[ ] TC-M-09  Bearer Token (ungültig)                → 401
```
