# Schritt 4 — Practitioner & PractitionerRole

> Ein `Practitioner` repräsentiert den einsendenden Arzt.  
> Die `PractitionerRole` verknüpft ihn mit der Organization und definiert seine Rolle.  
> **GLN ist Pflicht** — Schweizer Gesundheitsregulierung für Auftragsidentifikation.

---

## Practitioner

### Pflichtfelder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Logische FHIR-ID (z.B. `prac-001`) |
| `active` | boolean | Muss `true` sein |
| `identifier` | Identifier[] | GLN (`https://www.gs1.org/gln`) — Pflicht |
| `name` | HumanName[] | Nachname + Vorname |
| `telecom` | ContactPoint[] | Telefon / E-Mail der Praxis |

### FHIR JSON — Beispiel

```json
{
  "resourceType": "Practitioner",
  "id": "prac-001",
  "active": true,
  "identifier": [
    {
      "system": "https://www.gs1.org/gln",
      "value": "7601000000001"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Müller",
      "given": ["Hans"],
      "prefix": ["Dr. med."]
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+41 61 000 11 22",
      "use": "work"
    },
    {
      "system": "email",
      "value": "h.mueller@praxis.ch",
      "use": "work"
    }
  ],
  "address": [
    {
      "use": "work",
      "line": ["Praxisstrasse 5"],
      "city": "Basel",
      "postalCode": "4001",
      "country": "CH"
    }
  ]
}
```

---

## PractitionerRole

### Pflichtfelder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Logische FHIR-ID (z.B. `role-001`) |
| `active` | boolean | Muss `true` sein |
| `practitioner` | Reference | → `Practitioner/{id}` |
| `organization` | Reference | → `Organization/{id}` (z.B. `Organization/zlz`) |
| `location` | Reference[] | → `Location/{id}` — Abteilung / Arbeitsort des Arztes. **Basis für Druckjob-Routing zum Agent.** |
| `code` | CodeableConcept[] | Rolle (z.B. Hausarzt, Spezialist) |
| `specialty` | CodeableConcept[] | Fachrichtung (SNOMED CT empfohlen) |

### FHIR JSON — Beispiel

```json
{
  "resourceType": "PractitionerRole",
  "id": "role-001",
  "active": true,
  "practitioner": {
    "reference": "Practitioner/prac-001",
    "display": "Dr. med. Hans Müller"
  },
  "organization": {
    "reference": "Organization/zlz",
    "display": "ZLZ Zentrallabor AG"
  },
  "location": [
    {
      "reference": "Location/loc-kardiologie",
      "display": "Kardiologie Ambulatorium"
    }
  ],
  "code": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "59058001",
          "display": "General physician"
        }
      ],
      "text": "Hausarzt"
    }
  ],
  "specialty": [
    {
      "coding": [
        {
          "system": "http://snomed.info/sct",
          "code": "394814009",
          "display": "General practice"
        }
      ],
      "text": "Allgemeinmedizin"
    }
  ]
}
```

---

## GLN-Anforderung

Der GLN (Global Location Number) ist ein 13-stelliger numerischer Code.

```
System: https://www.gs1.org/gln
Wert:   7601000000001  (13 Ziffern, Schweizer Präfix 760)
```

- Wird beim FHIR-Sync aus `data/users.json` (`profile.gln`) übernommen
- Wird in `Practitioner.identifier` mit System `https://www.gs1.org/gln` gespeichert
- Pflicht für Schweizer Laboraufträge und Abrechnungsnachverfolgung

---

## Anlegen

```bash
# Practitioner
curl -X PUT http://localhost:8080/fhir/Practitioner/prac-001 \
  -H "Content-Type: application/fhir+json" \
  -d @03_practitioner.json

# PractitionerRole
curl -X PUT http://localhost:8080/fhir/PractitionerRole/role-001 \
  -H "Content-Type: application/fhir+json" \
  -d @03_practitionerrole.json
```

---

## Mehrere Ärzte

Pro einsendendem Arzt wird ein eigenes `Practitioner`- und `PractitionerRole`-Paar angelegt.  
Derselbe Arzt kann über mehrere `PractitionerRole` mit verschiedenen Organisationen verknüpft sein  
(z.B. Arzt arbeitet an zwei Standorten).

| Ressource | ID-Muster |
|-----------|-----------|
| Practitioner | `prac-001`, `prac-002`, … |
| PractitionerRole | `role-001`, `role-002`, … |
