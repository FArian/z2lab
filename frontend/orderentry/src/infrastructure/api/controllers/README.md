[← API](../README.md) | [↑ Infrastructure](../../README.md)

---

# 🎮 Controllers

Business logic for each API endpoint group. Constructor-injectable for testing.

## 📄 Files

| File | Endpoint | Notes |
|---|---|---|
| 📄 [ResultsController.ts](./ResultsController.ts) | `GET /api/v1/diagnostic-reports` | |
| 📄 [OrdersController.ts](./OrdersController.ts) | `GET`, `DELETE /api/v1/service-requests` | |
| 📄 [PatientsController.ts](./PatientsController.ts) | `GET /api/v1/patients` | |
| 📄 [OrderSubmitController.ts](./OrderSubmitController.ts) | `POST /api/v1/orders/submit` | Bundle-based order submission |
| 📄 [BridgeJobController.ts](./BridgeJobController.ts) | `GET`, `POST /api/v1/bridge/jobs`; `POST .../{id}/done` | Print + ORU job queue with ZPL generator |
| 📄 [BridgeRegistrationController.ts](./BridgeRegistrationController.ts) | `POST /api/v1/bridge/register`; admin CRUD on `/api/v1/admin/bridges` | API key issuance (shown ONCE, sha256 hashed) |
| 📄 [Hl7ProxyController.ts](./Hl7ProxyController.ts) | `POST`, `GET /api/v1/proxy/hl7/{inbound,outbound}` | Pure proxy to Orchestra — no parsing |
| 📄 [UsersController.ts](./UsersController.ts) | `GET`, `POST`, `PUT`, `DELETE /api/v1/users` | Admin: user CRUD + FHIR sync |
| 📄 [RolesController.ts](./RolesController.ts) | `GET`, `POST /api/v1/roles` | Role catalogue (PractitionerRole codes) |
| 📄 [OrgRulesController.ts](./OrgRulesController.ts) | `GET`, `POST`, `PUT`, `DELETE /api/v1/admin/org-rules` | Per-organisation HL7 + numbering rules |
| 📄 [NumberPoolController.ts](./NumberPoolController.ts) | `GET`, `POST`, `DELETE /api/v1/admin/number-pool`; `POST /api/v1/orders/number` | Pool CRUD + Orchestra fallback |
| 📄 [PoolAlertTaskController.ts](./PoolAlertTaskController.ts) | `GET /api/v1/admin/pool-tasks`; `POST .../{id}/resolve` | Pool threshold admin tasks |
| 📄 [AdminTasksController.ts](./AdminTasksController.ts) | `GET /api/v1/admin/tasks` | GLN-incomplete records |
| 📄 [AdminMergeController.ts](./AdminMergeController.ts) | `POST /api/v1/admin/merge/{organizations,practitioners}` | Merge duplicates |
| 📄 [GlnLookupController.ts](./GlnLookupController.ts) | `GET /api/v1/gln-lookup`, `/api/v2/gln-lookup` | RefData SOAP wrapper (versioned via adapters) |
| 📄 [FhirOrganizationsController.ts](./FhirOrganizationsController.ts) | `GET /api/v1/fhir/organizations` | Org search + by-id |
| 📄 [FhirLocationsController.ts](./FhirLocationsController.ts) | `GET /api/v1/fhir/locations` | Location search |
| 📄 [FhirPractitionersController.ts](./FhirPractitionersController.ts) | `GET /api/v1/fhir/practitioners` | Practitioner search |
| 📄 [MailController.ts](./MailController.ts) | `GET`, `POST /api/v1/admin/mail/{status,test}` | SMTP verify + send |
| 📄 [AuthTokenController.ts](./AuthTokenController.ts) | `POST /api/v1/auth/token` | JWT/PAT issuance |
| 📄 [EnvController.ts](./EnvController.ts) | `GET`, `POST /api/v1/env` | Writes `.env.local`; requires restart; 405 on Vercel |
| 📄 [ConfigController.ts](./ConfigController.ts) | `GET`, `POST /api/v1/config` | Writes `data/config.json`; immediate effect; 405 on Vercel |

## ⚙️ Rules

- Constructor accepts `fhirBase` and `fetchFn` for testability
- Module-level singleton: `export const xyzController = new XyzController()`
- `EnvController.update()` and `ConfigController.update()` return `405` on Vercel
- `ConfigController.get()` reads `process.env` — never parses `.env.local` at runtime

## 🔐 Org-Filter-Regel (Mandantentrennung)

`PatientsController`, `OrdersController` und `ResultsController` unterstützen optionale Org-Parameter (`orgFhirId` / `orgGln`). Die **Route** entscheidet, ob der Filter gesetzt wird — nicht der Controller.

| User-Rolle | Org-Filter | Erklärung |
|---|---|---|
| `admin` | ❌ kein Filter | Interner ZLZ/ZetLab-Mitarbeiter — sieht alle Daten |
| `user` mit `orgFhirId` im Profil | ✅ Filter aktiv | Externer Auftraggeber — sieht nur seine Org |
| `user` ohne Profil-Org | ❌ kein Filter | Fallback (kein Auftraggeber konfiguriert) |

**Regel:** `role === "admin"` → `orgFhirId`/`orgGln` werden in der Route **nicht** an den Controller übergeben, auch wenn sie im User-Profil gesetzt sind. Admins haben ihre eigene ZLZ-Org im Profil — das ist kein Auftraggeber-Filter.

---

[⬆ Back to top](#)
