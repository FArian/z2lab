# Authentifizierung & RBAC

> **Bereich:** `frontend/zetlab/src/` — `lib/auth.ts`, `domain/`, `application/`, `infrastructure/api/middleware/`

---

## Einleitung

z2Lab OrderEntry schützt alle Endpunkte durch ein zweistufiges Sicherheitsmodell:

1. **Authentifizierung** — Wer bist du? (HMAC-SHA256 Session-Cookie oder Bearer Token)
2. **Autorisierung (RBAC)** — Was darfst du tun? (Rolle → Permission → Aktion erlaubt?)

Das System ist nach **Clean Architecture** aufgebaut: Berechtigungsregeln liegen in der Domain-Schicht (kein Framework, kein I/O), die HTTP-Prüfung in der Infrastructure-Schicht.

---

## Teil 1 — Authentifizierung

### Wie Sessionen funktionieren

Nach dem Login erstellt `signSession()` ein HMAC-SHA256-signiertes Token:

```
base64url(JSON-Payload) + "." + base64url(HMAC-Signatur)
```

Das Token wird als `HttpOnly`-Cookie `session` gesetzt. Bei jeder Anfrage prüft `verifySession()`:
- Signatur korrekt? (zeitkonstanter Vergleich)
- `exp`-Claim nicht abgelaufen?

Schlägt die Verifikation fehl, ist keine Session vorhanden.

### Session-Payload

```typescript
type SessionPayload = {
  sub:      string;  // User-ID (UUID)
  username: string;
  iat:      number;  // issued at (Unix-Sekunden)
  exp:      number;  // expires at (Unix-Sekunden, Standard: 24h)
};
```

> **Wichtig:** Die Rolle (`role`) ist **nicht** im Cookie gespeichert — sie wird bei Bedarf aus der Datenbank gelesen (via `getSessionUserWithOrg()`). Das verhindert, dass ein Rollenänderung erst nach Cookie-Ablauf wirksam wird.

### Bearer Token (externe Clients)

Externe Clients (z.B. Orchestra, API-Skripte) können sich mit einem `Authorization: Bearer`-Header authentifizieren. `BearerAuthGuard` unterstützt zwei Token-Typen:

| Präfix | Typ | Verifikation |
|---|---|---|
| `ztk_...` | Personal Access Token (PAT) | Hash-Vergleich mit `apiTokenHash` in DB |
| `eyJ...` | JWT (HS256) | Stateless-Signaturprüfung via `UserJwtService` |

### Lokaler Fallback (Entwicklung)

Wenn `NEXT_PUBLIC_FORCE_LOCAL_AUTH=true` und `ALLOW_LOCAL_AUTH=true`, akzeptiert die App einen unsignierten `localSession`-Cookie aus dem Browser-LocalStorage. **Nie in Produktion.**

### Hilfsfunktionen in `lib/auth.ts`

| Funktion | Zweck |
|---|---|
| `signSession(userId, username)` | Erstellt signiertes Session-Token |
| `verifySession(token)` | Prüft Signatur + Ablauf → `SessionPayload \| null` |
| `getSessionFromCookies()` | Liest Cookie-Session (inkl. Local-Fallback) |
| `getSessionUserWithOrg()` | Session + DB-Lookup → `SessionUserWithOrg` mit `role`, `orgGln`, `orgFhirId` |
| `requireAuth()` | Session oder Redirect nach `/login` |
| `checkAdminAccess(req)` | Legacy-Funktion — intern ersetzt durch `requirePermission` |

---

## Teil 2 — RBAC (Phase 1)

### Warum RBAC?

Vor Phase 1 gab es nur eine binäre Prüfung: **admin oder nicht**. Das reicht nicht für ein Laborsystem, wo z.B. ein Arzt Aufträge erstellen, aber nicht löschen darf.

Phase 1 führt feingranulare **Permissions** ein, ohne Datenbankänderungen oder Keycloak-Integration (beides Phase 2).

### Architektur — Layer-Überblick

```
HTTP-Request
    │
    ▼
RequirePermission.ts       ← Infrastructure: löst Identität auf, prüft Permission
    │
    ▼
CheckPermission.ts         ← Application Use Case: reine Funktion, kein I/O
    │
    ▼
RolePermissionMap.ts       ← Domain: statische Rolle → Set<Permission>
    │
    ▼
Permission.ts              ← Domain Value Object: Konstanten + Typ-Union
```

### Permission-Konstanten

Alle Permissions folgen dem Schema `"<ressource>:<aktion>"` (Kleinbuchstaben, Doppelpunkt):

```typescript
// src/domain/valueObjects/Permission.ts
export const PERMISSIONS = {
  ORDER_CREATE: "order:create",
  ORDER_READ:   "order:read",
  ORDER_EDIT:   "order:edit",
  PATIENT_READ: "patient:read",
  PATIENT_EDIT: "patient:edit",
  GLN_READ:     "gln:read",
  GLN_SYNC:     "gln:sync",
  USER_MANAGE:  "user:manage",
  ADMIN_ACCESS: "admin:access",
} as const;
```

### Rollen-Mapping

```
src/domain/policies/RolePermissionMap.ts
```

| Permission | `admin` | `user` |
|---|:---:|:---:|
| `order:create` | ✅ | ✅ |
| `order:read` | ✅ | ✅ |
| `order:edit` | ✅ | ❌ |
| `patient:read` | ✅ | ✅ |
| `patient:edit` | ✅ | ❌ |
| `gln:read` | ✅ | ✅ |
| `gln:sync` | ✅ | ❌ |
| `user:manage` | ✅ | ❌ |
| `admin:access` | ✅ | ❌ |

Unbekannte Rollen erhalten **keine** Permissions (deny-by-default).

### Use Case — CheckPermission

```typescript
// src/application/useCases/CheckPermission.ts
export function checkPermission(role: string, permission: Permission): boolean {
  const grants = ROLE_PERMISSION_MAP[role];
  if (!grants) return false;
  return grants.has(permission);
}
```

Reine Funktion — kein I/O, kein React, kein HTTP. Testbar ohne Mocks.

### HTTP-Guard — RequirePermission

```typescript
// src/infrastructure/api/middleware/RequirePermission.ts

const perm = await requirePermission(req, PERMISSIONS.GLN_READ);
if (!perm.ok) return perm.response; // 401 oder 403 (RFC 7807)

// perm.sub, perm.username, perm.role sind jetzt verfügbar
```

**Auflöse-Reihenfolge:**

```
1. Authorization: Bearer <token>
   → BearerAuthGuard.resolve() → PAT oder JWT → role
   → checkPermission(role, permission)

2. Session-Cookie
   → getSessionUserWithOrg() → DB-Lookup → role
   → checkPermission(role, permission)

3. Keine Identität → 401 Unauthorized
```

**Fehlerantworten (RFC 7807):**

```json
// 401 — nicht angemeldet oder ungültiger Token
{ "type": "about:blank", "title": "Unauthorized", "status": 401,
  "detail": "authentication required", "instance": "/api/v1/..." }

// 403 — angemeldet, aber Permission fehlt
{ "type": "about:blank", "title": "Forbidden", "status": 403,
  "detail": "permission 'gln:read' required", "instance": "/api/v1/..." }
```

### ApiGateway-Integration

`ApiGateway.handle()` mit `auth: "admin"` ruft intern `requirePermission(req, PERMISSIONS.ADMIN_ACCESS)` auf. Routen, die über den Gateway laufen, brauchen **keine eigene Auth-Prüfung**.

```typescript
// Admin-Route via Gateway — auth automatisch
export async function POST(req: NextRequest) {
  return apiGateway.handle(
    req,
    { version: "v1", endpoint: "/admin/mail/test", auth: "admin" },
    async () => { /* kein requirePermission nötig */ },
  );
}
```

### Permissions-Endpunkt

```
GET /api/v1/me/permissions
→ { role: "user", permissions: ["gln:read", "order:create", "order:read", "patient:read"] }
```

Das Frontend nutzt diesen Endpunkt, um Features und Buttons rollenabhängig anzuzeigen.

---

## Teil 3 — Dateien-Übersicht

```
src/
├── domain/
│   ├── valueObjects/
│   │   └── Permission.ts              ← PERMISSIONS-Konstanten + Permission-Typ
│   └── policies/
│       ├── IPolicy.ts                 ← PolicyContext + IPolicy-Interface
│       └── RolePermissionMap.ts       ← Rolle → Set<Permission> (statisch)
│
├── application/
│   └── useCases/
│       └── CheckPermission.ts         ← checkPermission(role, permission): boolean
│
├── infrastructure/
│   ├── api/
│   │   ├── gateway/
│   │   │   └── ApiGateway.ts          ← auth:"admin" → requirePermission intern
│   │   └── middleware/
│   │       └── RequirePermission.ts   ← HTTP-Guard + Identitätsauflösung
│   └── auth/
│       ├── BearerAuthGuard.ts         ← PAT + JWT → BearerSession
│       ├── ApiTokenService.ts         ← PAT-Hash-Verifikation
│       └── UserJwtService.ts          ← HS256 JWT-Verifikation
│
├── lib/
│   └── auth.ts                        ← Session-Cookie, signSession, verifySession
│
└── app/api/v1/me/
    └── permissions/route.ts           ← GET /api/v1/me/permissions
```

### Tests

```
tests/unit/
├── domain/policies/
│   └── RolePermissionMap.test.ts      ← 22 Tests (admin/user/unknown)
└── application/useCases/
    └── CheckPermission.test.ts        ← 22 Tests (alle Rollen + edge cases)
```

---

## Teil 4 — Phase 2 (geplant, noch nicht implementiert)

Phase 1 verwendet eine **statische** Mapping-Tabelle im Code. Phase 2 wird folgendes hinzufügen:

| Feature | Details |
|---|---|
| DB-Tabelle `permissions` | `(id, role, permission, created_at)` — ersetzt `ROLE_PERMISSION_MAP` |
| Admin-UI `/admin/permissions` | CRUD für Rollen-Permission-Zuweisung |
| API-Endpunkte | `GET/POST/DELETE /api/v1/admin/permissions` |
| Keycloak (optional) | Role Mapper füllt DB-Tabelle beim ersten Login |
| Flyway-Migrations | SQLite / PostgreSQL / MSSQL |

`CheckPermission` bleibt eine reine Funktion — nur die Datenquelle wechselt von `ROLE_PERMISSION_MAP` zu einem `IPermissionRepository`.

---

## Entscheidungen & Begründungen

| Entscheidung | Begründung |
|---|---|
| Rolle nicht im Cookie speichern | Rollenänderung wirkt sofort (kein Cookie-Ablauf abwarten) |
| Permissions als `"resource:action"`-Strings | Menschenlesbar in Logs; erweiterbar ohne Code-Änderung |
| Deny-by-default für unbekannte Rollen | Sicherheits-Prinzip: lieber zu wenig als zu viel freigeben |
| RFC 7807 für Fehlerantworten | Konsistenz mit ApiGateway und `/api/launch` |
| Kein Keycloak in Phase 1 | Reduziert Komplexität vor Go-Live; Phase 2 vorbereitet |
| `CheckPermission` als pure function | Testbar ohne Mocks; keine Seiteneffekte in Domain-Schicht |
