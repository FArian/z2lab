# Schritt 2 — Location

> Eine `Location` repräsentiert einen physischen Ort innerhalb einer Organisation —
> typischerweise eine **Abteilung**, ein **Standort** oder ein **Arbeitsbereich** in einer Klinik oder Praxis.
>
> `Location` muss **nach** `Organization` und **vor** `Practitioner` angelegt werden,
> da `PractitionerRole.location` darauf referenziert.

---

## Warum Location?

| Zweck | Erklärung |
|---|---|
| **Druckjob-Routing** | Jeder registrierte Agent ist einer Location zugeordnet. Druckjobs (Begleitschein + Barcode) werden an den Agent der Abteilung gesendet, in der der Practitioner gerade arbeitet. |
| **Organisationsstruktur** | Bildet die interne Struktur einer Klinik ab (Abteilungen, Stationen, Standorte). |
| **PractitionerRole.location** | Verknüpft einen Arzt mit seinem Arbeitsort — Grundlage für gezieltes Druckjob-Routing. |

---

## Abhängigkeiten

```
Organization  ← muss zuerst existieren
    └── Location  (managingOrganization → Organization)
            └── PractitionerRole.location  (Referenz auf Location)
            └── Agent-Registrierung  (AGENT_LOCATION_ID → Location)
```

---

## Pflichtfelder

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | string | Logische FHIR-ID (sprechend, z.B. `loc-kardiologie`) |
| `resourceType` | `"Location"` | Fix |
| `status` | `"active"` | Muss `active` sein |
| `name` | string | Anzeigename der Abteilung / des Standorts |
| `managingOrganization` | Reference | → `Organization/{id}` — **Pflicht** |

## Empfohlene Felder

| Feld | Beschreibung |
|---|---|
| `identifier` | Interne Abteilungs-ID oder GLN des Standorts |
| `type` | Art des Orts (z.B. Abteilung, Ambulatorium, Labor) |
| `telecom` | Telefon / Fax der Abteilung |
| `address` | Physische Adresse (bei Aussenstandorten) |
| `partOf` | Referenz auf übergeordnete Location (z.B. Station → Klinik) |

---

## FHIR JSON — Beispiel: Abteilung in einer Klinik

```json
{
  "resourceType": "Location",
  "id": "loc-kardiologie",
  "status": "active",
  "name": "Kardiologie Ambulatorium",
  "identifier": [
    {
      "system": "https://zlz.ch/fhir/location-id",
      "value": "ABT-KARDIO-001"
    }
  ],
  "type": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          "code": "CARD",
          "display": "Ambulatory Health Care Facilities"
        }
      ],
      "text": "Kardiologie Ambulatorium"
    }
  ],
  "telecom": [
    {
      "system": "phone",
      "value": "+41 61 000 22 33",
      "use": "work"
    }
  ],
  "managingOrganization": {
    "reference": "Organization/klinik-hirslanden",
    "display": "Klinik Hirslanden"
  }
}
```

---

## FHIR JSON — Beispiel: Laborstandort (ZLZ)

```json
{
  "resourceType": "Location",
  "id": "loc-zlz-zollikon",
  "status": "active",
  "name": "ZLZ Zentrallabor — Standort Zollikon",
  "identifier": [
    {
      "system": "https://www.gs1.org/gln",
      "value": "7601001234568"
    }
  ],
  "type": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
          "code": "LAB",
          "display": "Laboratory"
        }
      ],
      "text": "Labor"
    }
  ],
  "managingOrganization": {
    "reference": "Organization/zlz",
    "display": "ZLZ Zentrallabor AG"
  }
}
```

---

## Hierarchie — mehrere Locations (partOf)

Eine Klinik mit mehreren Abteilungen kann als Hierarchie abgebildet werden:

```json
{
  "resourceType": "Location",
  "id": "loc-station-b3",
  "status": "active",
  "name": "Station B3",
  "partOf": {
    "reference": "Location/loc-kardiologie"
  },
  "managingOrganization": {
    "reference": "Organization/klinik-hirslanden"
  }
}
```

---

## Verbindung zum Agent (Druckjob-Routing)

Jeder registrierte Agent gibt beim Verbinden seine `Location`-ID mit:

```
AGENT_LOCATION_ID=loc-kardiologie
```

OrderEntry routet Druckjobs wie folgt:

```
Practitioner (in Auftrag ausgewählt)
  → PractitionerRole.location → Location/loc-kardiologie
  → Agent mit AGENT_LOCATION_ID=loc-kardiologie
  → Druckjob an diesen Agent
```

**Fallback (Broadcast):** Falls kein Agent für die Location registriert ist,
geht der Druckjob an alle Agents der Organization.

> ⚠️ Das Routing-Konzept (Broadcast vs. gezielt) ist noch als TODO offen —
> siehe `agent/README.md` → Offene Implementierungen → Punkt 5.

---

## Anlegen

```bash
# Einzelne Location
curl -X PUT http://localhost:8080/fhir/Location/loc-kardiologie \
  -H "Content-Type: application/fhir+json" \
  -d @02_location_kardiologie.json

# Labor-Standort
curl -X PUT http://localhost:8080/fhir/Location/loc-zlz-zollikon \
  -H "Content-Type: application/fhir+json" \
  -d @02_location_zlz_zollikon.json
```

Erwartete Antwort: `HTTP 200 OK` oder `HTTP 201 Created`

---

## Validierung

```bash
curl http://localhost:8080/fhir/Location/loc-kardiologie | jq '.name, .status'
# Erwartete Ausgabe:
# "Kardiologie Ambulatorium"
# "active"
```
