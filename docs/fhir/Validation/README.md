# FHIR Validation — ZetLab OrderEntry

> **Living document** — updated every time a FHIR rule is added or changed in the codebase.
> Section 0 tracks rules already active. Sections 1–9 document the future full validation plan.

---

## 0. Active Rules — Already Implemented

This section is the **single source of truth** for all FHIR rules currently enforced in the application.
Update this section whenever a new rule is added to the code.

---

### 0.1 GLN System URIs

Both identifier systems are accepted everywhere in the codebase for reading GLN values.
New resources are always written with `https://www.gs1.org/gln` as the primary system.

| System URI | Role | Status |
|---|---|---|
| `https://www.gs1.org/gln` | Primary — GS1 standard | ✅ Read + Write |
| `urn:oid:2.51.1.3` | Fallback — legacy OID | ✅ Read only |

**Affected files:**
- `src/infrastructure/api/controllers/FhirOrganizationsController.ts` — `GLN_SYSTEM`
- `src/infrastructure/api/controllers/FhirPractitionersController.ts` — `GLN_SYSTEM`
- `src/infrastructure/api/controllers/AdminTasksController.ts` — `GLN_SYSTEMS[]`
- `src/presentation/hooks/useFhirOrganizations.ts` — `GLN_SYSTEMS[]`
- `src/presentation/hooks/useFhirPractitioners.ts` — `GLN_SYSTEMS[]`
- `src/app/api/me/profile/route.ts` — `GLN_SYSTEM`

**Configured via ENV:** `ORDERENTRY_FHIR__SYSTEM_GLN` (default: `https://www.gs1.org/gln`)

---

### 0.2 Organization — GLN Required on Create/Update

| Rule | Detail |
|---|---|
| GLN is required | `identifier[system=https://www.gs1.org/gln].value` must be present |
| EAN-13 check digit | Validated via `validateGln()` in `shared/utils/swissValidators.ts` |
| GLN uniqueness | Checked before write via `findByGln()` — both systems searched |
| Both systems in seed | masterdata.json writes both `gs1.org/gln` and `urn:oid:2.51.1.3` for all organizations |

**Returns on failure:** `OperationOutcome 400` (missing) or `409` (duplicate)

---

### 0.3 Practitioner — GLN Required for Clinical Roles Only

GLN is mandatory for practitioners with clinical responsibilities.
Administrative roles are explicitly exempt.

**Exempt role codes (no GLN required):**

| SNOMED Code | Display |
|---|---|
| `224608005` | Administrative officer |
| `224599007` | Receptionist |
| `159561009` | Office clerk |
| `394738000` | Other categories |

**Affected file:** `src/infrastructure/api/controllers/AdminTasksController.ts` — `GLN_EXEMPT_ROLE_CODES`

---

### 0.4 Duplicate Detection — Practitioner

A duplicate Practitioner is defined as: **same GLN AND same Organization**.

A Practitioner with the same GLN in different organizations is **not** a duplicate —
this is the correct FHIR model using `PractitionerRole`.

**Affected file:** `src/infrastructure/api/controllers/AdminMergeController.ts` — `findPractDuplicates()`

---

### 0.5 Duplicate Detection — Organization

A duplicate Organization is defined as: **same GLN** (regardless of name).

**Affected file:** `src/infrastructure/api/controllers/AdminMergeController.ts` — `findOrgDuplicates()`

---

### 0.6 Role System URI

PractitionerRole codes use SNOMED CT for clinical roles and Swiss OID for role type classifications.

| System URI | Use |
|---|---|
| `http://snomed.info/sct` | Clinical role codes (Physician, Lab technician, etc.) |
| `urn:oid:2.51.1.3.roleType` | Swiss role type classifications (GrpPra, DocPra, Labo, etc.) |

**Seed data uses SNOMED CT** — see `seed/fhir/masterdata.json` PractitionerRole entries.

---

### 0.7 Open Tasks — Data Gaps

Tracked by `GET /api/v1/admin/tasks`:

| Condition | Flagged as Task |
|---|---|
| Organization without GLN | Yes — all organizations |
| Practitioner without GLN, non-exempt role | Yes |
| Practitioner without GLN, exempt role | No — excluded intentionally |

---

## 1. Current Status

Systematic FHIR validation is **not yet fully implemented**.
Section 0 above documents what is already enforced.

The following is still missing:

- No structural validation against FHIR R4 StructureDefinitions
- No CH Core IG profile conformance check
- No `$validate` integration before writes
- No referential integrity check beyond HAPI built-in enforcement
- No ServiceRequest, Encounter, or Coverage validation

### Why full validation is postponed

| Reason | Detail |
|---|---|
| Master data not finalized | Organization, Practitioner, and catalog structures are still evolving |
| Evolving data model | ServiceRequest, Encounter, Coverage shapes may change before Go-Live |
| Workflow stabilization | FHIR ↔ HL7 via Orchestra not yet fully validated end-to-end |
| Seed data in progress | masterdata.json, catalog.json still being extended and corrected |

Full validation rules can only be defined once the data model is stable.

---

## 2. Why FHIR Validation is Critical

This is a medical laboratory system. Incorrect or incomplete data has direct consequences.

### Patient Safety

- Missing or wrong `Patient` identifiers (AHV, VeKa) can cause orders to be assigned to the wrong patient
- Incomplete `ServiceRequest` can cause the wrong analysis to be performed

### Billing Correctness

- Orders must reference a valid `Coverage` and `Encounter` for TARDOC / Pauschale billing
- Missing `requester` GLN blocks invoice processing in downstream billing systems

### Interoperability (FHIR ↔ HL7)

- Orchestra translates FHIR `ServiceRequest` to HL7 ORM messages
- Invalid FHIR resources produce malformed HL7 segments (OBR, ORC, PID)
- The LIS cannot process orders with missing barcode data (specimen code + order number)

### Downstream Systems

- LIS (Labsoft): requires valid specimen codes, order numbers, and patient identifiers
- Orchestra: requires structurally valid FHIR before transformation to HL7

---

## 3. Validation Scope (Future)

The following FHIR resources must be validated before production use.

### Patient

| Rule | Field | Constraint |
|---|---|---|
| AHV number format | `identifier[system=urn:oid:2.16.756.5.32]` | 13-digit Swiss SSN |
| VeKa card number | `identifier[system=VEKA]` | valid format |
| Name required | `name.family` | min 1 character |
| Birth date | `birthDate` | ISO 8601, must be in the past |
| Managing organization | `managingOrganization` | reference must exist |

### Practitioner

| Rule | Field | Constraint |
|---|---|---|
| GLN required (clinical) | `identifier[system=https://www.gs1.org/gln]` | 13-digit EAN-13, valid check digit |
| ZSR optional | `identifier[system=ZSR]` | Swiss ZSR format |
| Name required | `name.family` | min 1 character |

### PractitionerRole

| Rule | Field | Constraint |
|---|---|---|
| Practitioner reference | `practitioner` | must resolve |
| Organization reference | `organization` | must resolve |
| Role code required | `code[0].coding[0].code` | must be a known SNOMED or OID code |

### Organization

| Rule | Field | Constraint |
|---|---|---|
| GLN required | `identifier[system=https://www.gs1.org/gln]` | 13-digit EAN-13, valid check digit |
| Both GLN systems | `identifier` | both `gs1.org/gln` and `urn:oid:2.51.1.3` entries |
| Name required | `name` | min 2 characters |
| Type required | `type[0].coding[0].code` | known organization type |
| Parent reference | `partOf` | if set, must resolve |

### ServiceRequest (OrderEntry core)

| Rule | Field | Constraint |
|---|---|---|
| Subject required | `subject` | must reference a valid Patient |
| Requester required | `requester` | must reference a valid Practitioner or PractitionerRole |
| Code required | `code.coding[0].code` | must exist in ActivityDefinition catalog |
| Status valid | `status` | one of: draft, active, completed, cancelled |
| Intent valid | `intent` | must be `order` |
| Order number | `identifier` | must be unique, follow format rules (MIBI / ROUTINE / POC) |
| Specimen | `specimen` | must reference valid specimen if required by test |

### Encounter

| Rule | Field | Constraint |
|---|---|---|
| Status valid | `status` | planned / in-progress / finished |
| Subject required | `subject` | must reference Patient |
| Service provider | `serviceProvider` | must reference Organization |

### Coverage

| Rule | Field | Constraint |
|---|---|---|
| Beneficiary required | `beneficiary` | must reference Patient |
| Payor required | `payor` | must reference Organization (insurer) |
| Period valid | `period` | start ≤ end, coverage active at order date |

---

## 4. Validation Types

### a) Structural Validation

Validates conformance to the FHIR R4 specification:

- Required fields present
- Correct data types (date formats, boolean values, enumerations)
- Cardinality constraints (0..1, 1..*, etc.)
- Valid FHIR resource shape

Provided by: HAPI FHIR built-in validation, or `$validate` operation.

### b) Business Validation

Validates rules specific to the ZetLab domain:

- Order number format must match service type (MIBI → `MI4...`, ROUTINE → 10 digits, POC → `PO...`)
- Mikrobiologie orders require MIBI number pool
- Organization-specific rules (OrgRule table) must be respected
- Administrative practitioners must not appear as `requester` on clinical orders
- Catalog codes must be active (`ActivityDefinition.status = active`)

### c) Referential Integrity

All references within resources must be resolvable in the FHIR server:

- `ServiceRequest.subject` → Patient exists
- `ServiceRequest.requester` → Practitioner / PractitionerRole exists
- `PractitionerRole.organization` → Organization exists
- `Organization.partOf` → parent Organization exists
- `Coverage.payor` → Organization exists

### d) Workflow Validation

Validates that state transitions follow defined rules:

- A `ServiceRequest` in status `completed` cannot be edited
- A `ServiceRequest` can only be cancelled if no `DiagnosticReport` references it
- Order number cannot be reused after being marked as used in the pool

---

## 5. Relation to Master Data

Validation rules are directly dependent on the master data model.

| Master Data | Validation Dependency |
|---|---|
| Organization registry | All references to organizations must resolve |
| Practitioner / PractitionerRole | Requester validation, GLN check |
| ActivityDefinition catalog | ServiceRequest code must exist in catalog |
| Number pools (MIBI / ROUTINE / POC) | Order number format and uniqueness |
| OrgRules table | Organization-specific order routing rules |

**Consequence:** Validation can only be fully implemented after:

1. All organizations are registered with valid GLN
2. The analysis catalog (ActivityDefinition) is finalized
3. Number pool thresholds and prefixes are stable
4. OrgRules are defined for all active organizations

---

## 6. TODO Roadmap (Step-by-Step)

The following steps must be executed in order.

- [ ] **Step 1 — Finalize master data model**
  All Organization, Practitioner, and catalog records complete, GLN assigned, seed files stable.

- [ ] **Step 2 — Test all seed files with `$validate`**
  Use HAPI `POST /fhir/{Resource}/$validate` for masterdata.json, catalog.json, demo-data.json.
  Document all validation errors. Fix before proceeding.

- [ ] **Step 3 — Define validation rules per resource**
  Write a validation rule specification for each resource (based on Section 3 above).
  Include GLN rules, reference rules, business rules.

- [ ] **Step 4 — Introduce ValidationService (application layer)**
  Create `src/application/services/FhirValidationService.ts`.
  Pure domain logic — no FHIR HTTP calls inside this service.

- [ ] **Step 5 — Integrate validation before FHIR submission**
  Call ValidationService in controllers before any `PUT` / `POST` to HAPI.
  Return structured `OperationOutcome` on failure — never write invalid data.

- [ ] **Step 6 — Add UI validation feedback**
  Display validation errors inline in order form and FHIR registry pages.
  Use existing design system error states (Input `error` prop, Badge `danger`).

- [ ] **Step 7 — Add logging and audit trail**
  Log all validation failures via `createLogger` with resource type, id, and rule violated.
  Store validation events in the audit log (future: dedicated DB table).

- [ ] **Step 8 (optional) — Integrate HAPI $validate**
  Wire `POST /api/v1/admin/fhir/validate` endpoint that calls HAPI `$validate` without writing.
  Useful for admin dry-run before seeding.

- [ ] **Step 9 (future) — CH Core IG conformance**
  Load CH Core profiles into HAPI. Extend ZetLab profiles as derived profiles.
  Validate Patient AHV, Practitioner ZSR, Organization GLN against CH Core rules.

---

## 7. Proposed Architecture

Following the project Clean Architecture layers.

```
domain/
  validation/
    rules/
      OrganizationValidationRule.ts    ← pure: GLN format, required fields
      ServiceRequestValidationRule.ts  ← pure: subject, requester, code, number
      PractitionerValidationRule.ts    ← pure: GLN for clinical roles
    ValidationResult.ts                ← { valid, errors: ValidationError[] }
    IValidationRule.ts                 ← interface: validate(resource) → ValidationResult

application/
  services/
    FhirValidationService.ts           ← orchestrates rules per resource type
                                          validate(resourceType, resource) → ValidationResult

infrastructure/
  fhir/
    HapiValidationAdapter.ts           ← calls $validate on HAPI FHIR server
                                          implements IFhirValidator interface
  api/
    controllers/
      FhirValidationController.ts      ← POST /api/v1/admin/fhir/validate
                                          returns OperationOutcome

presentation/
  hooks/
    useValidation.ts                   ← client-side pre-submit validation
  components/
    ValidationSummary.tsx              ← displays list of validation errors inline
```

**Key principles:**

- Domain rules are pure functions — no HTTP, no DB, no side effects
- Infrastructure adapter is replaceable (HAPI validator, custom validator, or both)
- Validation errors are always returned as FHIR `OperationOutcome` at API boundaries
- UI shows errors before submission — server-side validation is the final gate

---

## 8. Future Enhancements

These are out of scope for the initial validation implementation but must be considered in the architecture.

| Enhancement | Description |
|---|---|
| CDS Hooks | Real-time clinical decision support at order time (e.g. contraindicated tests) |
| Rule engine | Configurable validation rules per organization stored in DB — no code deploy needed |
| AI-based suggestions | Detect likely errors based on historical order patterns |
| Cross-resource validation | Validate that Coverage is active for the patient at the order date |
| Terminology validation | Validate SNOMED, LOINC, and LIS codes against loaded ValueSets |

---

## 9. Notes for Future Development

- Validation must **not break existing workflows** — introduce behind a feature flag if necessary
- Introduce **incrementally** — start with Organization and ServiceRequest, expand to others
- All validation errors must be **logged** — silent failure is forbidden (project rule)
- **Backward compatibility** — existing FHIR resources written before validation may not pass new rules; migration strategy needed
- Validation failures at API level return `422 Unprocessable Entity` with FHIR `OperationOutcome`
- Never return raw error strings — always use `buildOperationOutcome()` from `FhirTypes.ts`
- The `$validate` operation on HAPI is a safe dry-run tool — use it freely without risk of data corruption

---

## References

- [HAPI FHIR Validation](https://hapifhir.io/hapi-fhir/docs/validation/introduction.html)
- [FHIR $validate Operation](https://www.hl7.org/fhir/operation-resource-validate.html)
- [CH Core Implementation Guide](https://fhir.ch/ig/ch-core/)
- [GS1 GLN Standard](https://www.gs1.org/standards/id-keys/gln)
- [HL7 FHIR R4 Resource Index](https://www.hl7.org/fhir/resourcelist.html)
- Project: `src/infrastructure/fhir/FhirTypes.ts` — `buildOperationOutcome()`
- Project: `src/infrastructure/config/EnvConfig.ts` — `fhirSystems.gln`
