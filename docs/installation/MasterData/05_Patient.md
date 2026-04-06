# Schritt 5 — Patient

> Ein Patient muss **aktiv** sein und eine **managingOrganization** referenzieren,  
> damit er in der OrderEntry-App erscheint und Aufträge erfasst werden können.

---

## Warum diese Anforderungen?

| Anforderung | Grund |
|-------------|-------|
| `active = true` | App filtert inaktive Patienten aus der Suche heraus |
| `managingOrganization` | Definiert den Laborkontext des Patienten; Pflicht für ServiceRequest |
| `identifier` | Wird für die Patientensuche nach lokaler Fallnummer verwendet |
| `name` | Wird für Namenssuche und Anzeige im UI benötigt |
| `birthDate` | Wird auf der Patientendetailseite angezeigt (Pflicht für CH-Kontext) |

---

## Pflichtfelder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Logische FHIR-ID (z.B. `pat-001`) |
| `active` | boolean | **Muss `true` sein** — sonst unsichtbar in der App |
| `identifier` | Identifier[] | Lokale Fallnummer / Patientennummer des KIS/PIS |
| `name` | HumanName[] | Familienname + Vorname |
| `birthDate` | date | Geburtsdatum (`YYYY-MM-DD`) |
| `gender` | code | `male` / `female` / `other` / `unknown` |
| `managingOrganization` | Reference | → `Organization/{id}` — **Pflicht** |

---

## Empfohlene Felder

| Feld | Beschreibung |
|------|--------------|
| `telecom` | Telefon / E-Mail des Patienten |
| `address` | Wohnadresse |
| `communication` | Bevorzugte Sprache |
| `generalPractitioner` | Referenz auf den Hausarzt (`Practitioner/{id}`) |

---

## FHIR JSON — Beispiel

```json
{
  "resourceType": "Patient",
  "id": "pat-001",
  "active": true,
  "identifier": [
    {
      "system": "https://zlz.ch/fhir/patient-id",
      "value": "P-12345"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Meier",
      "given": ["Anna", "Marie"]
    }
  ],
  "gender": "female",
  "birthDate": "1975-03-15",
  "telecom": [
    {
      "system": "phone",
      "value": "+41 79 000 00 01",
      "use": "mobile"
    }
  ],
  "address": [
    {
      "use": "home",
      "line": ["Hauptstrasse 12"],
      "city": "Liestal",
      "postalCode": "4410",
      "country": "CH"
    }
  ],
  "managingOrganization": {
    "reference": "Organization/zlz",
    "display": "ZLZ Zentrallabor AG"
  },
  "generalPractitioner": [
    {
      "reference": "Practitioner/prac-001",
      "display": "Dr. med. Hans Müller"
    }
  ]
}
```

---

## Häufige Fehler

### Patient erscheint nicht in der Suche

```json
// FALSCH — active fehlt oder ist false
{ "active": false }

// RICHTIG
{ "active": true }
```

### Auftragskontext fehlt (managingOrganization)

```json
// FALSCH — managingOrganization fehlt
{
  "resourceType": "Patient",
  "name": [...]
}

// RICHTIG
{
  "resourceType": "Patient",
  "managingOrganization": {
    "reference": "Organization/zlz"
  }
}
```

---

## Patientensuche in der App

Die App sucht Patienten über zwei Modi (Strategy Pattern):

| Eingabe | Strategie | FHIR-Parameter |
|---------|-----------|----------------|
| 5+ Ziffern oder UUID | `PatientIdStrategy` | `_id=` oder `identifier=` |
| Text (Name) | `PatientNameStrategy` | `name=` (FHIR `name:contains`) |

Damit die Namenssuche funktioniert, muss `name.family` und `name.given` befüllt sein.

---

## Anlegen

```bash
curl -X PUT http://localhost:8080/fhir/Patient/pat-001 \
  -H "Content-Type: application/fhir+json" \
  -d @04_patient.json
```

---

## Massenimport aus KIS/PIS

Für den produktiven Betrieb werden Patienten typischerweise über eine HL7 v2 ADT-Integration  
oder einen FHIR Bulk Import aus dem KIS (Krankenhausinformationssystem) übernommen.  
Die OrderEntry-App selbst legt **keine** Patienten an — sie liest sie nur aus dem FHIR-Server.
