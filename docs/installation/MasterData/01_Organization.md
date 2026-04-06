# Schritt 1 — Organization

> **Wurzelobjekt** — muss als erstes angelegt werden.  
> Alle anderen Ressourcen (Patient, Practitioner, Tests) referenzieren diese Organization.

---

## Warum Organization zuerst?

Die OrderEntry-App setzt voraus, dass:

- `Patient.managingOrganization` → auf die Organization zeigt
- `PractitionerRole.organization` → auf die Organization zeigt
- `ServiceRequest` (Auftrag) → indirekt über Practitioner mit der Organization verknüpft ist

Ohne eine gültige Organization können Patienten nicht im Kontext des Labors dargestellt werden.

---

## Pflichtfelder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Logische FHIR-ID (stabil, sprechend, z.B. `zlz`) |
| `resourceType` | `"Organization"` | Fix |
| `active` | boolean | Muss `true` sein |
| `type` | CodeableConcept[] | Art der Organisation (z.B. `prov` = Gesundheitsdienstleister) |
| `name` | string | Offizieller Name des Labors |
| `identifier` | Identifier[] | GLN der Organisation (System: `https://www.gs1.org/gln`) |
| `telecom` | ContactPoint[] | Telefon / E-Mail |
| `address` | Address[] | Postadresse (Pflicht für Schweizer Kontext) |

---

## FHIR JSON — Beispiel ZLZ

```json
{
  "resourceType": "Organization",
  "id": "zlz",
  "active": true,
  "identifier": [
    {
      "system": "https://www.gs1.org/gln",
      "value": "7601001234567"
    }
  ],
  "type": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/organization-type",
          "code": "prov",
          "display": "Healthcare Provider"
        }
      ],
      "text": "Klinisches Labor"
    }
  ],
  "name": "ZLZ Zentrallabor AG",
  "telecom": [
    {
      "system": "phone",
      "value": "+41 61 000 00 00",
      "use": "work"
    },
    {
      "system": "email",
      "value": "info@zlz.ch",
      "use": "work"
    }
  ],
  "address": [
    {
      "use": "work",
      "type": "physical",
      "line": ["Beispielstrasse 1"],
      "city": "Basel",
      "postalCode": "4000",
      "country": "CH"
    }
  ]
}
```

---

## Anlegen

```bash
curl -X PUT http://localhost:8080/fhir/Organization/zlz \
  -H "Content-Type: application/fhir+json" \
  -d @01_organization_zlz.json
```

Erwartete Antwort: `HTTP 200 OK` oder `HTTP 201 Created`

---

## Validierung

```bash
# Prüfen ob Organization korrekt angelegt
curl http://localhost:8080/fhir/Organization/zlz | jq '.name, .active'
# Erwartete Ausgabe:
# "ZLZ Zentrallabor AG"
# true
```

---

## Mehrere Organizations (Standorte)

Falls mehrere Laborstandorte existieren, wird jeder als eigene Organization angelegt.  
Die Hauptorganisation kann als übergeordnete `partOf`-Referenz angegeben werden:

```json
{
  "resourceType": "Organization",
  "id": "zlz-standort-aarau",
  "partOf": { "reference": "Organization/zlz" },
  "name": "ZLZ Standort Aarau",
  "active": true
}
```
