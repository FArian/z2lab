# Schritt 6 — Testkatalog

> Der Testkatalog besteht aus drei verknüpften FHIR-Ressourcen, die **als Bundle** angelegt werden:
> - **`ActivityDefinition`** — beschreibt den Labortest (Name, Kategorie, Probenanforderung)
> - **`SpecimenDefinition`** — beschreibt das Probenmaterial (Probengefäss, Volumen, Lagerung)
> - **`ObservationDefinition`** — beschreibt das erwartete Resultat (LIS-Bezeichnung)
>
> Quelle: **`StammdatenAusLIS.xml`** (LIS-Export aus Labsoft) →
> wird durch den Orchestra-Konverter in FHIR-Bundles umgewandelt.

---

## Bundle-Format

Jede Test-Definition wird als **`transaction`-Bundle** mit genau 3 Einträgen gesendet:

```
Bundle (type: transaction)
  ├── entry[0]: ActivityDefinition  (PUT ActivityDefinition/actdef-{CODE})
  ├── entry[1]: SpecimenDefinition  (PUT SpecimenDefinition/specdef-{BARCODE})
  └── entry[2]: ObservationDefinition (PUT ObservationDefinition/obsdef-{CODE})
```

---

## Topic-Kategorien — Pflicht für Topic-Button-Feature

> **Wichtig:** Die App baut **einen Button pro Topic-Kategorie**.
> Alle Tests mit demselben `topic.code` erscheinen unter diesem Button.
> **Jeder `ActivityDefinition` muss einen korrekten Topic-Code haben.**

### Konsequenz bei fehlendem oder falschem Topic

| Situation | Auswirkung in der App |
|-----------|----------------------|
| `topic` fehlt | Test erscheint in keiner Kategorie |
| `topic.code = "Routine"` für Mikrobiologie-Tests | Test landet unter falschem Button |
| Topic-Code unbekannt | Button wird trotzdem erstellt, aber semantisch falsch |

### Verwendete Topic-Codes (aus `https://www.zetlab.ch/fhir/category`)

| Code | Display | Verwendung |
|------|---------|-----------|
| `MIBI` | Mikrobiologie | Abstrich, Bakteriologie, PCR, Virologie |
| `CHEM` | Klinische Chemie | Elektrolyte, Leber, Niere, Lipide |
| `HAEM` | Hämatologie | Blutbild, Differentialblutbild |
| `COAG` | Gerinnung | INR, aPTT, Fibrinogen |
| `IMMU` | Immunologie / Serologie | Antikörper, Autoimmun |
| `ENDO` | Endokrinologie | Hormone, Schilddrüse |
| `URIN` | Urinanalytik | Urinstatus, Urinchemie |
| `TUMO` | Tumormarker | PSA, CEA, CA 125 |
| `MOLE` | Molekularbiologie / PCR | PCR, DNA-Tests |
| `BGRP` | Blutgruppe / Transfusion | AB0, Rh, Antikörpersuchtest |

> Die gültigen Codes werden im LIS (Labsoft) konfiguriert und vom Konverter in `topic.code` übernommen.

---

## ID-Konventionen

| Ressource | ID-Pattern | Beispiel |
|-----------|-----------|---------|
| `ActivityDefinition` | `actdef-{LIS-CODE}` | `actdef-AAUG` |
| `SpecimenDefinition` | `specdef-{BARCODE_ZUSATZ}` | `specdef-AA` |
| `ObservationDefinition` | `obsdef-{LIS-CODE}` | `obsdef-AAUG` |

Mehrere `ActivityDefinition` können dieselbe `SpecimenDefinition` teilen  
(z.B. AAUG, ABANMO, ADENPAU, BAKPAU → alle `specdef-AA`).

---

## ActivityDefinition — vollständige Struktur

### Pflichtfelder

| Feld | System / Wert | Beschreibung |
|------|--------------|--------------|
| `id` | `actdef-{CODE}` | Logische FHIR-ID |
| `url` | `https://www.zetlab.ch/fhir/activity/{CODE}` | Canonical URL |
| `status` | `"active"` | Nur aktive Tests im UI sichtbar |
| `subtitle` | Material-Text (z.B. "Abstrich Auge/Nase/Mund/Ohr") | Probentyp-Beschreibung |
| `description` | Deutscher Testname | Anzeige im UI |
| `topic[0].coding[0].system` | `https://www.zetlab.ch/fhir/category` | Kategorie-System |
| `topic[0].coding[0].code` | z.B. `MIBI` | **Topic-Code — Pflicht für Button-Feature** |
| `topic[0].coding[0].display` | z.B. `"Mikrobiologie"` | Anzeigename im Button |
| `kind` | `"ServiceRequest"` | Fix |
| `code.coding[0].system` | `https://www.zetlab.ch/lis/codes` | LIS-Code-System |
| `code.coding[0].code` | `#{LIS-CODE}` | LIS-Test-Code (mit `#`-Präfix) |
| `location.identifier.value` | z.B. `RISCHMB` | GRUPPE_BEFUND aus LIS |

### Custom Extensions

| URL | Typ | Beschreibung |
|-----|-----|-------------|
| `.../minimal-volume-microliter` | `valueQuantity` (µl) | Mindestvolumen in µl |
| `.../specimen-definition` | `valueReference.identifier` | Link zur SpecimenDefinition (via Identifier, KEIN `specimenRequirement`) |

### Multilingual Translation Extensions

`code.coding[0]` enthält Translation-Extensions für `de` und `en`:

```json
"extension": [
  { "url": "http://hl7.org/fhir/StructureDefinition/translation",
    "extension": [{ "url": "lang", "valueCode": "de" }, { "url": "content", "valueString": "Auge" }] },
  { "url": "http://hl7.org/fhir/StructureDefinition/translation",
    "extension": [{ "url": "lang", "valueCode": "en" }, { "url": "content", "valueString": "Eye" }] }
]
```

---

## SpecimenDefinition — vollständige Struktur

### Pflichtfelder

| Feld | System | Beschreibung |
|------|--------|-------------|
| `id` | `specdef-{BARCODE}` | Aus XML-Feld `BARCODE_ZUSATZ` |
| `identifier.system` | `https://www.zetlab.ch/fhir/specimen` | ZetLab Specimen-System |
| `typeCollected.coding[0].system` | `https://www.zetlab.ch/fhir/specimen-types` | ZetLab-Probentyp |
| `typeCollected.coding[1].system` | `http://snomed.info/sct` | SNOMED CT (dual coding) |
| `typeCollected.coding[1].display` | **Muss offizielle SNOMED-Bezeichnung sein** | ❌ Nicht den Testnamen verwenden! |
| `typeCollected.text` | Deutscher Probentyp-Text | ❌ Nicht den Testnamen verwenden! |

### Korrekte SNOMED CT Codes und Displays (aus den Stammdaten)

| Specimen-Code | ZetLab-Display | SNOMED-Code | Korrekter SNOMED-Display |
|--------------|----------------|-------------|--------------------------|
| `AA` | Abstrich Auge/Nase/Mund/Ohr | `119399004` | `Specimen from eye (specimen)` |
| `60` | Abstrich/Sekret | `257261003` | `Swab specimen` |
| `AT` | Abstrich Bronch./Trachealsekret | `257261003` | `Swab specimen` |
| `91` | Nasopharyngialabstrich | `258500001` | `Nasopharyngeal swab (specimen)` |

> ❌ **Fehler im Konverter:** SNOMED-Display wird mit dem englischen Testnamen befüllt
> (z.B. `"Specimen from Adenoviruses (specimen)"` — das ist kein SNOMED-Konzeptname).
> Die SNOMED-Displays müssen die offiziellen SNOMED CT Bezeichnungen enthalten.

### typeTested — vollständig (Pflicht)

```
typeTested[0]:
  preference: "preferred"
  container:
    description     → Gefässtyp / Transportmedium (Freitext)
    minimumVolumeQuantity → Mindestvolumen in mL
  retentionTime     → Stabilität (z.B. 48 h)
  rejectionCriterion[] → Ablehnungsgründe
  handling[]:
    temperatureQualifier → Raumtemperatur / Gekühlt / Gefroren
    temperatureRange     → min/max in °C
    maxDuration          → Maximale Dauer bei dieser Temperatur
    instruction          → Freitext-Anweisung
```

#### Handling-Condition Codes (FHIR Standard)

| Code | Bedeutung |
|------|-----------|
| `room` | Raumtemperatur (15–25°C) |
| `refrigerated` | Gekühlt (2–8°C) |
| `frozen` | Gefroren (≤ −20°C) |

#### Rejection Criteria Codes (FHIR Standard)

| Code | Bedeutung |
|------|-----------|
| `INSUFFICIENT` | Unzureichende Probenmenge |
| `HEMOLYSIS` | Hämolysiert |
| `LIPEMIA` | Lipämisch |
| `WRONG TEMPERATURE` | Falsche Lagertemperatur |

#### Vollständiges typeTested-Beispiel (Abstrich)

```json
"typeTested": [
  {
    "preference": "preferred",
    "container": {
      "description": "Abstrich-Transportmedium (z.B. Copan ESwab 480C)",
      "minimumVolumeQuantity": {
        "value": 0.5, "unit": "mL",
        "system": "http://unitsofmeasure.org", "code": "mL"
      }
    },
    "retentionTime": {
      "value": 48, "unit": "h",
      "system": "http://unitsofmeasure.org", "code": "h"
    },
    "rejectionCriterion": [
      {
        "coding": [{
          "system": "http://terminology.hl7.org/CodeSystem/rejection-criteria",
          "code": "INSUFFICIENT",
          "display": "Insufficient quantity"
        }],
        "text": "Getrockneter oder unzureichender Abstrich"
      }
    ],
    "handling": [
      {
        "temperatureQualifier": {
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/handling-condition",
            "code": "room",
            "display": "Room Temperature"
          }],
          "text": "Raumtemperatur"
        },
        "temperatureRange": {
          "low":  { "value": 15, "unit": "°C", "system": "http://unitsofmeasure.org", "code": "Cel" },
          "high": { "value": 25, "unit": "°C", "system": "http://unitsofmeasure.org", "code": "Cel" }
        },
        "maxDuration": {
          "value": 48, "unit": "h",
          "system": "http://unitsofmeasure.org", "code": "h"
        },
        "instruction": "Bei Raumtemperatur lagern. Nicht einfrieren. Schnellstmöglich ins Labor senden."
      }
    ]
  }
]
```

---

## ObservationDefinition — Struktur (unverändert)

| Feld | System | Beschreibung |
|------|--------|-------------|
| `id` | `obsdef-{CODE}` | Gleicher Code wie ActivityDefinition |
| `category[0].coding[0].code` | `"laboratory"` | HL7-Standard |
| `code.coding[0].system` | `https://www.zetlab.ch/lis/codes` | LIS-Code-System |
| `identifier[0].value` | `#{CODE}` | LIS-Code mit `#`-Präfix |
| `preferredReportName` | Englischer Name | Aus XML-Feld `BEZEICHNUNG` |

---

## XML-Quellstruktur (StammdatenAusLIS.xml)

| XML-Feld | → FHIR-Feld |
|----------|------------|
| `TEST` | `ActivityDefinition.code.coding[].code` (mit `#` Präfix) |
| `TEST_TEXT` | `ActivityDefinition.description`, `code.coding[].display` |
| `BEZEICHNUNG` | `ObservationDefinition.preferredReportName` (EN) |
| `GRUPPE_BEFUND` | `ActivityDefinition.location.identifier.value` |
| `MATERIAL_TEXT` | `ActivityDefinition.subtitle` + `SpecimenDefinition.typeCollected.coding[0].display` |
| `BARCODE_ZUSATZ` | `SpecimenDefinition.id` (`specdef-{BARCODE_ZUSATZ}`) |
| `M_SNOMED_CODE` | `SpecimenDefinition.typeCollected.coding[1].code` |

> ⚠️ **Konverter-Bug:** `M_SNOMED_CODE` wird korrekt übernommen, aber der `display`-Text
> wird fälschlicherweise mit dem englischen Testnamen (`BEZEICHNUNG`) befüllt statt mit der
> offiziellen SNOMED CT Bezeichnung. Dies muss im Konverter oder manuell korrigiert werden.

---

## Anlegen

```bash
# Jedes Bundle als FHIR Transaction senden
curl -X POST http://localhost:8080/fhir \
  -H "Content-Type: application/fhir+json" \
  -d @bundle-actdef-AAUG.json

# Alle Bundles in einem Ordner senden
for f in masterdata/*.json; do
  echo "Sending $f..."
  curl -s -X POST http://localhost:8080/fhir \
    -H "Content-Type: application/fhir+json" \
    -d @"$f" | jq '.type, .entry[].response.status'
done
```

---

## Validierung

```bash
# Alle aktiven Tests
curl "http://localhost:8080/fhir/ActivityDefinition?status=active&_count=100" | jq '.total'

# Tests nach Kategorie (MIBI-Button zeigt diese Tests)
curl "http://localhost:8080/fhir/ActivityDefinition?topic=MIBI" \
  | jq '[.entry[].resource | {id, description: .description}]'

# SpecimenDefinition mit typeTested prüfen
curl "http://localhost:8080/fhir/SpecimenDefinition/specdef-AA" \
  | jq '.typeTested[0] | {container: .container.description, stability: .retentionTime, temp: .handling[0].temperatureQualifier.text}'
```
