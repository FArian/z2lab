[← Backend FHIR](../README.md) | [↑ Backend](../../README.md)

---

# 🏥 FHIR Stammdaten — Organisationen & Beziehungen

Seed-Ressourcen für Organisationen, Standorte, Practitioners und deren Beziehungen nach **FHIR R4 Standard**.

---

## 📦 Struktur

```
organizations/
├── Bundle_setup-hirslanden-reto-mueller.json   ← Vollständiges Setup-Bundle (transaction)
├── Organization_zlz.json                        ← ZLZ Zentrallabor AG (Auftragnehmer/Labor)
├── Organization_zlz-gruppe.json                 ← ZLZ Laborgruppe (partOf)
├── Organization_zetlab.json                     ← ZetLab AG (Auftragnehmer)
├── Organization_klinik-hirslanden.json          ← Klinik Hirslanden (Auftraggeber)
├── Organization_versicherung-css.json           ← Versicherung CSS
├── OrganizationAffiliation_zlz-hirslanden.json  ← ZLZ ↔ Hirslanden (Labor-Dienstleister)
├── OrganizationAffiliation_zetlab-hirslanden.json
├── Location_klinik-hirslanden.json              ← Standort Hirslanden (managingOrg → Hirslanden)
├── Location_zlz-zollikon.json
├── Location_zlz-notfall-im-park.json
├── Location_zetlab-zollikon.json
├── Practitioner_prac-001.json                   ← Arzt (GLN-identifiziert)
├── PractitionerRole_role-001.json               ← Arzt ↔ Org ↔ Standort
├── Patient_test-001.json
├── Coverage_test-001.json
└── Encounter_test-001.json
```

---

## 🏗️ FHIR-Datenmodell nach Standard

### Rollen im System

| Rolle | Bedeutung | FHIR-Resource | Identifikation |
|---|---|---|---|
| **Auftragnehmer** | Labor (ZLZ/ZetLab) — empfängt Aufträge | `Organization` (type: `laboratory`) | GLN Pflicht |
| **Auftraggeber** | Klinik/Praxis — stellt Aufträge | `Organization` (type: `prov`) | GLN Pflicht |
| **Practitioner** | Arzt/MPA — stellt Aufträge | `Practitioner` + `PractitionerRole` | GLN Pflicht |
| **Location** | Standort einer Organisation | `Location` (managingOrganization →) | intern |

### Beziehungsmodell

```
Organization/zlz (Auftragnehmer/Labor)
  └─ OrganizationAffiliation
        ├── organization         → Organization/zlz              (Labor)
        ├── participatingOrg     → Organization/klinik-hirslanden (Auftraggeber)
        ├── location[]           → Location/loc-hirslanden
        └── code                 = "laboratory"

Organization/klinik-hirslanden (Auftraggeber)
  └─ Location/loc-hirslanden
        └── managingOrganization → Organization/klinik-hirslanden

Practitioner/prac-reto-mueller
  └─ PractitionerRole/role-reto-mueller-hirslanden
        ├── practitioner  → Practitioner/prac-reto-mueller
        ├── organization  → Organization/klinik-hirslanden
        └── location[]    → Location/loc-hirslanden

ServiceRequest (Auftrag)
  ├── subject    → Patient/...
  ├── requester  → PractitionerRole/...   ← Auftraggeber-Kette
  └── performer  → Organization/zlz       ← Auftragnehmer
```

### Warum kein `location` auf Organization?

Nach FHIR R4 hat `Organization` **kein `location`-Feld**. Die Beziehung ist umgekehrt:
- `Location.managingOrganization` → zeigt auf die verwaltende Organisation
- Abfrage: `GET /fhir/Location?organization={org-id}`

---

## 🔐 Zugriffskontrolle (Scope-based Access)

| User-Zugehörigkeit | Sieht Patienten | Sieht Aufträge | Basis |
|---|---|---|---|
| `Organization/zlz` (intern) | **Alle** | **Alle** | Systembetreiber |
| `Organization/zetlab` (intern) | **Alle** | **Alle** | Systembetreiber |
| Externe Org (Auftraggeber) | **Nur eigene** | Nur wo `ServiceRequest.requester` → ihre Org | `PractitionerRole.organization` |

---

## 👤 User-Management → FHIR-Mapping

| ptype | GLN | AHV | ZSR | UID | BUR | PractitionerRole | Location | FHIR-Sync |
|---|---|---|---|---|---|---|---|---|
| `NAT` (Practitioner) | **Pflicht** | Optional | Optional | — | — | **Pflicht** | **Pflicht** | `Practitioner` + `PractitionerRole` |
| `JUR` (Organisation/Auftraggeber) | **Pflicht** | — | Optional | Optional | Optional | ❌ | via `Location.managingOrg` | `Organization` + `OrganizationAffiliation` |
| `PER` (reguläre Person) | Optional | Optional | — | — | — | ❌ | ❌ | `Person` (+ `managingOrganization`) |

### Schweizer Identifikatoren

| Kennung | System (OID) | Gültig für | Bedeutung |
|---|---|---|---|
| GLN | `https://www.gs1.org/gln` | NAT, JUR | Global Location Number (13-stellig EAN-13) |
| AHV/AVS | intern | NAT, PER | Schweizer Sozialversicherungsnummer |
| ZSR | `urn:oid:2.16.756.5.30.1.123.100.2.1.1` | NAT, JUR | Zahlstellenregister santésuisse |
| UID | `urn:oid:2.16.756.5.35` | JUR | Unternehmens-ID (CHE-XXX.XXX.XXX) |
| BUR | `urn:oid:2.16.756.5.45` | JUR | Betriebseinheitsnummer BFS (8-stellig) |

**ZLZ selbst bekommt keinen JUR-User** — ZLZ ist der Systembetreiber (`NEXT_PUBLIC_LAB_ORG_ID=zlz`).

---

## 📋 Benötigte Stammdaten (Masterdata-Checkliste)

Folgende FHIR-Ressourcen müssen **vor dem Produktivbetrieb** im HAPI FHIR-Server vorhanden sein:

### Zwingend (Upload-Reihenfolge einhalten)

| # | Ressource | ID-Beispiel | Beschreibung |
|---|---|---|---|
| 1 | `Organization` (Auftragnehmer) | `Organization/zlz` | ZLZ Zentrallabor AG — Systembetreiber |
| 2 | `Organization` (Auftragnehmer) | `Organization/zetlab` | ZetLab AG (optional, falls separat) |
| 3 | `Location` (ZLZ-Standorte) | `Location/zlz-zollikon` | Standorte des Labors |
| 4 | `Organization` (Auftraggeber) | `Organization/klinik-{name}` | Kliniken/Praxen pro Auftraggeber |
| 5 | `Location` (Auftraggeber-Standort) | `Location/loc-{name}` | Standort der Klinik |
| 6 | `OrganizationAffiliation` | `OrganizationAffiliation/aff-zlz-{name}` | Labor ↔ Klinik-Verknüpfung |
| 7 | `Practitioner` | `Practitioner/prac-{id}` | Arzt/MPA mit GLN |
| 8 | `PractitionerRole` | `PractitionerRole/role-{id}` | Arzt ↔ Org ↔ Standort |

### Pro Auftraggeber (JUR-User)

Wird automatisch beim FHIR-Sync erstellt, wenn der User im User-Management angelegt wird:
- `Organization/{orgId}` mit GLN, ZSR, UID, BUR
- `OrganizationAffiliation/aff-zlz-{orgId}` → ZLZ

### Pro Practitioner (NAT-User)

Wird automatisch beim FHIR-Sync erstellt:
- `Practitioner/{practId}` mit GLN, ZSR
- `PractitionerRole/{roleId}` mit `organization` + `location[]`

### Optional / Klinischer Workflow

| Ressource | Wann nötig |
|---|---|
| `Patient` | Vor erster Auftragserfassung |
| `Coverage` | Wenn Versicherungsdeckung erfasst wird |
| `Encounter` | Wenn Behandlungsfall abgebildet werden soll |

---

## 📤 Bundle hochladen

```bash
# Setup-Bundle (Hirslanden + Dr. Reto Müller)
curl -X POST "https://hapi.z2lab.ddns.net/fhir" \
  -H "Content-Type: application/fhir+json" \
  -d @Bundle_setup-hirslanden-reto-mueller.json

# Einzelne Ressource (PUT mit bekannter ID)
curl -X PUT "https://hapi.z2lab.ddns.net/fhir/Organization/zlz" \
  -H "Content-Type: application/fhir+json" \
  -d @Organization_zlz.json
```

---

## ⚙️ Regeln

1. Jede `Organization` (Auftraggeber) braucht eine `OrganizationAffiliation` → ZLZ
2. Jede `Location` zeigt via `managingOrganization` auf ihre Organisation
3. Jeder `Practitioner` (NAT) braucht eine `PractitionerRole` mit `organization` + `location`
4. `GLN` ist immer im System `https://www.gs1.org/gln`
5. Bundles immer als `transaction` (nicht `batch`) — atomares Hochladen

---

[⬆ Back to top](#)
