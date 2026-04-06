[← Backend](../../README.md)

---

# 🔬 FHIR R4 — Seed-Ressourcen & Konfiguration

Alle FHIR-Ressourcen für ZetLab OrderEntry nach **FHIR R4 Standard** (HAPI FHIR Server).

---

## 📦 Verzeichnisstruktur

```
fhir/
├── organizations/        ← Organisationen, Standorte, Practitioners, Beziehungen
├── masterdata/           ← Testkatalog (ActivityDefinition, SpecimenDefinition) — 4218 Tests
├── MapingCode/           ← Terminologie (CodeSystem, ValueSet, ConceptMap)
├── Patient/              ← Test-Patienten
├── ServiceRequest/       ← Test-Aufträge
├── Bundle/               ← Weitere Bundle-Vorlagen
├── Subscription/         ← FHIR Subscriptions (Webhook-Trigger)
└── FHIR_to_HL7_ORM_Mapping.md  ← FHIR → HL7 v2 ORM Mapping-Dokumentation
```

---

## 🏗️ Datenmodell — Überblick

### Kern-Ressourcen

| Resource | Zweck | Identifikation |
|---|---|---|
| `Organization` | Labor (Auftragnehmer) oder Klinik/Praxis (Auftraggeber) | GLN (`https://www.gs1.org/gln`) Pflicht |
| `OrganizationAffiliation` | Beziehung Labor ↔ Auftraggeber | `organization` + `participatingOrganization` |
| `Location` | Physischer Standort einer Organisation | `managingOrganization` → Organization |
| `Practitioner` | Arzt / MPA mit FHIR-Identität | GLN Pflicht |
| `PractitionerRole` | Arzt ↔ Organisation ↔ Standort | `practitioner` + `organization` + `location[]` |
| `Patient` | Patient mit Verweis auf betreuende Organisation | `managingOrganization` → Organization |
| `ServiceRequest` | Laborauftrag | `requester` → PractitionerRole, `performer` → Organization/zlz |
| `ActivityDefinition` | Bestellbarer Test im Katalog | ZLZ-LIS-Code + LOINC |
| `SpecimenDefinition` | Probentyp (Material, Röhrchen) | ZLZ-Material-Code |

### Auftraggeber / Auftragnehmer

```
ZLZ (Auftragnehmer/Labor)
  └── OrganizationAffiliation
        organization         → Organization/zlz           (Labor)
        participatingOrg     → Organization/{auftraggeber} (Klinik/Praxis)
        location[]           → Location/{standort}
        code                 = "laboratory"

Klinik/Praxis (Auftraggeber)
  └── Location
        managingOrganization → Organization/{klinik}

Arzt (Practitioner)
  └── PractitionerRole
        practitioner  → Practitioner/{arzt}
        organization  → Organization/{klinik}
        location[]    → Location/{standort}

ServiceRequest (Auftrag)
  requester  → PractitionerRole/{rolle}   ← wer bestellt
  performer  → Organization/zlz           ← wer ausführt
```

### Zugriffskontrolle

| User | Zugehörigkeit | Zugang |
|---|---|---|
| ZLZ / ZetLab intern | `Organization/zlz` oder `Organization/zetlab` | Alle Patienten + Aufträge |
| Externer Auftraggeber | `PractitionerRole.organization` = ihre Org | Nur eigene Patienten + Aufträge |

---

## 📋 Reihenfolge beim Upload

```
1. CodeSystem / ValueSet / ConceptMap   (MapingCode/)
2. Organization (ZLZ, ZetLab, Gruppe)
3. Organization (Auftraggeber — Kliniken, Praxen)
4. Location     (managingOrganization muss existieren)
5. OrganizationAffiliation
6. Practitioner
7. PractitionerRole (organization + location müssen existieren)
8. ActivityDefinition + SpecimenDefinition (masterdata/)
9. Patient / ServiceRequest (Tests)
```

---

## ⚙️ Regeln

1. **GLN Pflicht** für jede `Organization` und jeden `Practitioner`
2. **`Location` zeigt auf `Organization`** — nicht umgekehrt (`managingOrganization`)
3. **`PractitionerRole`** ist die einzige Verbindung Practitioner ↔ Org ↔ Location
4. **`OrganizationAffiliation`** ist die FHIR-konforme Verbindung zwischen zwei Organisationen
5. Bundles immer als `transaction` (atomar) — nie `batch` für Seed-Daten
6. `ServiceRequest.requester` → immer `PractitionerRole`, nie direkt `Practitioner`

---

[⬆ Back to top](#)
