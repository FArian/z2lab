# ZetLab OrderEntry — Setup Guide

> Vollständige Anleitung für den produktiven Betrieb der OrderEntry App.
> Alle 7 Schritte müssen in der angegebenen Reihenfolge ausgeführt werden.

---

## Architektur-Überblick

```
┌─────────────────────────────────────────────────────────┐
│  Schritt 1: Organization (Labor, Klinik, Versicherung)  │
│  Schritt 2: Patient + Encounter (Datenschutz-Grenze)    │
│  Schritt 3: Testkatalog + Terminologie (pro Labor)      │
│  Schritt 4: Deployment (Shared / Getrennt)              │
│  Schritt 5: Sicherheit (Token / SMART on FHIR)          │
│  Schritt 6: Nachrichtenfluss (SR → HL7 → DiagReport)    │
│  Schritt 7: Setup-Reihenfolge (produktiver Betrieb)     │
└─────────────────────────────────────────────────────────┘
```

---

## Schritt 1 — Organization: Auftraggeber & Auftragnehmer

Jede beteiligte Partei ist eine `Organization` — Labor, Klinik, Praxis und Versicherung.

### Organization-Typen

| Typ-Code | Bedeutung | Beispiel |
|----------|-----------|---------|
| `laboratory` | Auftragnehmer (Labor) | ZLZ Zentrallabor AG |
| `prov` | Auftraggeber (Klinik / Praxis) | Kantonsspital Basel |
| `ins` | Kostenträger (Versicherung) | CSS Versicherung AG |

### Beziehung Labor ↔ Klinik

```
OrganizationAffiliation
  ├── organization              → Labor (Auftragnehmer)
  └── participatingOrganization → Klinik (Auftraggeber)
```

### Anlegen

```bash
# Reihenfolge: Labor → Klinik → Versicherung → Affiliation
curl -X PUT $BASE/Organization/zlz       -d @Organization_zlz.json
curl -X PUT $BASE/Organization/klinik-a  -d @Organization_klinik-a.json
curl -X PUT $BASE/Organization/versicherung-css -d @Organization_versicherung-css.json
curl -X PUT $BASE/OrganizationAffiliation/affiliation-zlz-klinik-a -d @Affiliation.json
```

> Details: [MasterData/01_Organization.md](MasterData/01_Organization.md)

---

## Schritt 2 — Patient & Encounter: Datenschutz-Lösung

### Kernprinzip

> Die Datenschutz-Grenze liegt am **Encounter** — nicht am Patient.

Ein Patient kann mehrere Kliniken besuchen. Jeder Besuch ist ein eigener Encounter.
Aufträge sind immer an einen Encounter gebunden — nie direkt an den Patienten.

```
Patient (einmalig, global)
  ├── Encounter → serviceProvider: Klinik A → ServiceRequest → Labor ZLZ
  └── Encounter → serviceProvider: Klinik B → ServiceRequest → Labor ZLZ
```

### Wer sieht was

| Akteur | Filter | Sieht |
|--------|--------|-------|
| Klinik A | `encounter.service-provider=Organization/klinik-a` | Nur ihre Aufträge |
| Klinik B | `encounter.service-provider=Organization/klinik-b` | Nur ihre Aufträge |
| Labor ZLZ | `performer=Organization/zlz` | Alle Aufträge an ZLZ |

### Abrechnung — Coverage & Account

```
Patient → Coverage → payor: Versicherung   (wer zahlt?)
Encounter → account → Account → Coverage   (Rechnung für diesen Besuch)
ServiceRequest.insurance → Coverage        (Tarif für diesen Auftrag)
```

> Details: [MasterData/04_Patient.md](MasterData/04_Patient.md)

---

## Schritt 3 — Testkatalog & Terminologie

### Die drei Terminologie-Ressourcen

| Ressource | Frage | Beispiel |
|-----------|-------|---------|
| `CodeSystem` | Was bedeutet dieser Code? | `#AAUG = Auge (Abstrich)` |
| `ValueSet` | Welche Codes sind erlaubt? | Nur aktive ZLZ-Tests |
| `ConceptMap` | Wie übersetzt man zwischen Systemen? | LOINC 6463-4 → `#AAUG` |

### Testkatalog — pro Labor

Jede `ActivityDefinition` gehört einem Labor via `useContext`:

```json
"useContext": [{
  "code": { "code": "facility" },
  "valueReference": { "reference": "Organization/zlz" }
}]
```

### App lädt nur den richtigen Katalog

```
1. Klinik A meldet sich an
2. App liest OrganizationAffiliation → Klinik A arbeitet mit Labor ZLZ
3. GET ActivityDefinition?context=Organization/zlz&status=active
4. App baut Topic-Buttons: MIBI (6), CHEM (12), HAEM (4) ...
```

### Anlegen — Reihenfolge

```bash
# 1. CodeSystem (Wörterbuch)
curl -X PUT $BASE/CodeSystem/zlz-lis-test-codes -d @CodeSystem_test.json
curl -X PUT $BASE/CodeSystem/zlz-material-codes -d @CodeSystem_material.json

# 2. ValueSet (Auswahlliste)
curl -X PUT $BASE/ValueSet/zlz-aktive-tests -d @ValueSet.json

# 3. ConceptMap (Übersetzer)
curl -X PUT $BASE/ConceptMap/zlz-loinc-zu-lis -d @ConceptMap_loinc.json
curl -X PUT $BASE/ConceptMap/zlz-snomed-zu-material -d @ConceptMap_snomed.json

# 4. Testkatalog (Bundles: ActivityDef + SpecimenDef + ObservationDef)
for f in masterdata/*.json; do
  curl -s -X POST $BASE -H "Content-Type: application/fhir+json" -d @"$f"
done
```

> Details: [MasterData/05_Testkatalog.md](MasterData/05_Testkatalog.md)  
> Details: [MapingCode README](../../backend/orchestra/fhir/MapingCode/README.md)

---

## Schritt 4 — Deployment: Shared vs. Getrennt

### Deployment A — Shared HAPI FHIR (Partitioning)

```
http://hapi-fhir:8080/fhir/DEFAULT/   → Terminologie, Katalog, Organisationen
http://hapi-fhir:8080/fhir/klinik-a/  → Patienten, Encounters, Aufträge Klinik A
http://hapi-fhir:8080/fhir/klinik-b/  → Patienten, Encounters, Aufträge Klinik B
http://hapi-fhir:8080/fhir/zlz/       → DiagnosticReports, eingehende Aufträge
```

### Deployment B — Separate Server (pro Klinik)

```yaml
# docker-compose.yml — jede Klinik eigene Instanz
services:
  hapi-fhir:
    image: hapiproject/hapi:latest
  orderentry:
    image: farian/orderentry:latest
    environment:
      FHIR_BASE_URL: http://hapi-fhir:8080/fhir
```

### Ressourcen — wo sie leben

| Ressource | DEFAULT / Shared | Klinik-Partition | Labor-Partition |
|-----------|-----------------|-----------------|-----------------|
| Organization, Affiliation | ✅ | — | — |
| CodeSystem, ValueSet, ConceptMap | ✅ | — | — |
| ActivityDefinition, SpecimenDefinition | ✅ | — | — |
| Patient, Coverage, Account, Encounter | — | ✅ | — |
| ServiceRequest | — | ✅ | ✅ |
| DiagnosticReport | — | ✅ | ✅ |

---

## Schritt 5 — Sicherheit & Zugangskontrolle

### Ebene 1 — Netzwerkisolation

```yaml
# HAPI FHIR hat keinen öffentlichen Port
services:
  hapi-fhir:
    # KEIN ports: Eintrag
    networks: [zetlab-net]
  orderentry:
    ports: ["3000:3000"]    # nur OrderEntry ist öffentlich
    networks: [zetlab-net]
```

### Ebene 2 — Rollen & Zugriffsrechte

| Akteur | Darf lesen | Darf schreiben |
|--------|-----------|----------------|
| Arzt (via OrderEntry) | Patient, Encounter, ActivityDefinition, ServiceRequest | ServiceRequest, Encounter |
| Labor ZLZ | ServiceRequest (alle an ZLZ) | DiagnosticReport |
| Orchestra | ServiceRequest | DiagnosticReport |
| Admin | alles | alles |

### Phase 1 — Service Token (einfach, für Start)

```bash
# .env
FHIR_BASE_URL=http://hapi-fhir:8080/fhir/klinik-a
FHIR_SERVICE_TOKEN=<static-token>
```

### Phase 2 — SMART on FHIR (Produktion)

```
Browser → OAuth2 Login (Keycloak) → Access Token → HAPI FHIR
Token enthält: org=klinik-a, role=arzt
HAPI Interceptor → leitet auf Partition klinik-a
```

---

## Schritt 6 — Nachrichtenfluss

```
Arzt erstellt Auftrag
  → ServiceRequest (FHIR, LOINC-Code)
      → Orchestra empfängt via Webhook
          → ConceptMap übersetzt LOINC → LIS-Code
              → HL7 ORM^O01 → LIS (Labsoft)
                  → Analyse
                      → HL7 ORU^R01 → Orchestra
                          → ConceptMap übersetzt LIS-Code → LOINC
                              → DiagnosticReport (FHIR) + PDF/HL7-Attachment
                                  → Arzt sieht Befund in App
```

### ServiceRequest Status-Verlauf

```
draft → active → completed
```

### DiagnosticReport Status-Verlauf

```
registered → partial → final
```

---

## Schritt 7 — Setup-Reihenfolge (Checkliste)

```
□ Phase 1: docker-compose up -d
           curl http://localhost:8080/fhir/metadata → fhirVersion: "4.0.1"

□ Phase 2: Partitionen anlegen (nur Deployment A)
           PartitionManagement: zlz, klinik-a, klinik-b

□ Phase 3: Terminologie
           CodeSystem → ValueSet → ConceptMap

□ Phase 4: Organisationen
           Organization/zlz → Organization/klinik-a → OrganizationAffiliation

□ Phase 5: Personen
           Practitioner → PractitionerRole

□ Phase 6: Testkatalog
           SpecimenDefinition + ActivityDefinition Bundles

□ Phase 7: Test-Workflow
           Patient → Coverage → Encounter → ServiceRequest → DiagnosticReport
```

### Validierung — alles bereit?

```bash
BASE=http://localhost:8080/fhir

curl "$BASE/Organization?_count=1"           | jq '.total'  # ≥ 3
curl "$BASE/ActivityDefinition?status=active"| jq '.total'  # ≥ 7
curl "$BASE/CodeSystem?_count=1"             | jq '.total'  # ≥ 2
curl "$BASE/ConceptMap?_count=1"             | jq '.total'  # ≥ 2
curl "$BASE/Practitioner?_count=1"           | jq '.total'  # ≥ 1
```

---

## Weiterführende Dokumentation

| Thema | Datei |
|-------|-------|
| Organization | [MasterData/01_Organization.md](MasterData/01_Organization.md) |
| ValueSets | [MasterData/02_ValueSets.md](MasterData/02_ValueSets.md) |
| Practitioner | [MasterData/03_Practitioner.md](MasterData/03_Practitioner.md) |
| Patient | [MasterData/04_Patient.md](MasterData/04_Patient.md) |
| Testkatalog | [MasterData/05_Testkatalog.md](MasterData/05_Testkatalog.md) |
| Code Mapping | [MapingCode/README.md](../../backend/orchestra/fhir/MapingCode/README.md) |
| App Architektur | [CLAUDE.md](../../CLAUDE.md) |
