# Stammdaten — FHIR Master Data Setup

> **ZetLab OrderEntry** — Voraussetzungen für den FHIR-Server (HAPI FHIR R4)  
> Alle Stammdaten müssen **vor** dem ersten produktiven Betrieb angelegt sein.

---

## Abhängigkeitsbaum

```
Organization  ← Wurzelobjekt (muss zuerst angelegt werden)
│
├── Location  (managingOrganization → Organization)
│   └── Agent-Registrierung  (AGENT_LOCATION_ID → Location)
│
├── Practitioner  (hat GLN-Identifier)
│   └── PractitionerRole  (verknüpft Practitioner ↔ Organization + Location + Rolle)
│
├── Patient  (active=true, managingOrganization → Organization)
│
├── ActivityDefinition  (Testkatalog-Eintrag, hat topic für Kategorie)
│   ├── specimenRequirement → SpecimenDefinition  (Probengefäss, Volumen, Bedingungen)
│   └── observationResultRequirement → ObservationDefinition  (Erwartete Resultate)
│
└── ValueSet  (Kategorien, Probentypen, Prioritäten)
```

---

## Pflicht-Ressourcen und Reihenfolge

| Schritt | Ressource | Datei | Pflicht |
|---------|-----------|-------|---------|
| 1 | `Organization` | [01_Organization.md](01_Organization.md) | ✅ Ja — root |
| 2 | `Location` | [02_Location.md](02_Location.md) | ✅ Ja — für Agent-Routing + PractitionerRole |
| 3 | `ValueSet` | [03_ValueSets.md](03_ValueSets.md) | ✅ Ja — für Kategorien |
| 4 | `Practitioner` + `PractitionerRole` | [04_Practitioner.md](04_Practitioner.md) | ✅ Ja — für Aufträge |
| 5 | `Patient` | [05_Patient.md](05_Patient.md) | ✅ Ja — für Auftragserfassung |
| 6 | `ActivityDefinition` + `SpecimenDefinition` + `ObservationDefinition` | [06_Testkatalog.md](06_Testkatalog.md) | ✅ Ja — Testkatalog |

---

## Validierungsregeln der App

Die OrderEntry-App setzt folgendes voraus:

| Ressource | Bedingung | Fehler wenn verletzt |
|-----------|-----------|----------------------|
| `Patient` | `active = true` | Patient erscheint nicht in Suche |
| `Patient` | `managingOrganization` gesetzt | Auftragskontext fehlt |
| `ActivityDefinition` | `topic` gesetzt (Kategorie) | Test kann nicht gefiltert/gruppiert werden |
| `ActivityDefinition` | `specimenRequirement` gesetzt | Probenanforderung fehlt im Formular |
| `Practitioner` | GLN-Identifier (`https://www.gs1.org/gln`) | FHIR-Sync schlägt fehl |
| `PractitionerRole` | `organization` Referenz gesetzt | Zuordnung Labor ↔ Arzt fehlt |

---

## FHIR-Server

- **Typ:** HAPI FHIR R4  
- **URL (intern):** `http://hapi-fhir:8080/fhir` (Docker-Netzwerk)  
- **URL (lokal/dev):** `http://localhost:8080/fhir`  
- **Content-Type:** `application/fhir+json`  

Alle Ressourcen werden per `PUT` mit fixer ID oder per `POST` angelegt.  
Empfohlen: `PUT` mit sprechender logischer ID (`PUT /fhir/Organization/zlz`).

---

## Schnellstart — Reihenfolge

```bash
# 1. Organization  (Wurzel — muss zuerst existieren)
curl -X PUT http://localhost:8080/fhir/Organization/zlz \
  -H "Content-Type: application/fhir+json" \
  -d @01_organization_zlz.json

# 2. Location  (Abteilungen / Standorte — vor Practitioner anlegen)
curl -X PUT http://localhost:8080/fhir/Location/loc-kardiologie \
  -H "Content-Type: application/fhir+json" \
  -d @02_location_kardiologie.json

# 3. ValueSets  (Kategorien, Probentypen — vor Testkatalog anlegen)
curl -X PUT http://localhost:8080/fhir/ValueSet/labor-kategorien \
  -H "Content-Type: application/fhir+json" \
  -d @03_valuesets.json

# 4. Practitioner + PractitionerRole  (benötigt Organization + Location)
curl -X PUT http://localhost:8080/fhir/Practitioner/prac-001 \
  -H "Content-Type: application/fhir+json" \
  -d @04_practitioner.json
curl -X PUT http://localhost:8080/fhir/PractitionerRole/role-001 \
  -H "Content-Type: application/fhir+json" \
  -d @04_practitionerrole.json

# 5. Patient  (benötigt Organization)
curl -X PUT http://localhost:8080/fhir/Patient/pat-001 \
  -H "Content-Type: application/fhir+json" \
  -d @05_patient.json

# 6. Testkatalog  (ActivityDefinition + SpecimenDefinition — benötigt ValueSets)
curl -X PUT http://localhost:8080/fhir/SpecimenDefinition/edta-roehre \
  -H "Content-Type: application/fhir+json" \
  -d @06_specimendefinition.json
curl -X PUT http://localhost:8080/fhir/ActivityDefinition/blutbild \
  -H "Content-Type: application/fhir+json" \
  -d @06_activitydefinition.json
```
