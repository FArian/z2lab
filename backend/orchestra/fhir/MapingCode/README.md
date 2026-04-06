# FHIR Terminologie — Code Mapping

> Dieses Verzeichnis enthält die FHIR-Terminologie-Ressourcen für die ZetLab OrderEntry App.
> Diese Ressourcen definieren, validieren und übersetzen alle Labor-Codes zwischen
> internen LIS-Systemen und internationalen Standards (LOINC, SNOMED CT).

---

## Die drei Bausteine

| Ressource | Frage die sie beantwortet | Analogie |
|-----------|--------------------------|---------|
| `CodeSystem` | Was bedeutet dieser Code? | Wörterbuch |
| `ValueSet` | Welche Codes sind hier erlaubt? | Auswahlliste |
| `ConceptMap` | Welcher Code ist das Äquivalent in einem anderen System? | Übersetzer |

---

## 1. CodeSystem — Das Wörterbuch

Definiert alle internen LIS-Codes und ihre Bedeutung.  
Ohne CodeSystem weiss der FHIR-Server nicht, was `#AAUG` bedeutet.

### Problem ohne CodeSystem

```
FHIR-Server sieht:  code   = "#AAUG"
                    system = "https://www.zetlab.ch/lis/codes"

→ Unbekanntes System → nicht validierbar ❌
```

### Lösung mit CodeSystem

```json
{
  "resourceType": "CodeSystem",
  "id": "zlz-lis-test-codes",
  "url": "https://www.zetlab.ch/lis/codes",
  "name": "ZLZLisTestCodes",
  "title": "ZLZ Interne LIS Test-Codes",
  "status": "active",
  "content": "complete",
  "concept": [
    { "code": "#AAUG",    "display": "Auge",                               "definition": "Abstrich Auge/Nase/Mund/Ohr" },
    { "code": "#ABAB",    "display": "Allgemeine Bakteriologie inkl. Pilze","definition": "Abstrich/Sekret" },
    { "code": "#ABANMO",  "display": "Allgemeine Bakteriologie",            "definition": "Abstrich Auge/Nase/Mund/Ohr" },
    { "code": "#ADENPAU", "display": "Adenoviren",                          "definition": "Abstrich Auge/Nase/Mund/Ohr" },
    { "code": "#ADENPNA", "display": "Adenoviren",                          "definition": "Nasopharyngialabstrich" },
    { "code": "#BAKPAU",  "display": "Bakterielle Breitband-PCR",           "definition": "Abstrich Auge/Nase/Mund/Ohr" },
    { "code": "#BOPAPBR", "display": "Bordetella parapertussis",            "definition": "Abstrich Bronch./Trachealsekret" }
  ]
}
```

```
FHIR-Server sieht:  code   = "#AAUG"
                    system = "https://www.zetlab.ch/lis/codes"

→ System bekannt → bedeutet "Auge, Abstrich" → validiert ✅
```

---

## 2. ValueSet — Die Auswahlliste

Wählt aus dem CodeSystem nur die Codes aus, die für einen bestimmten Zweck erlaubt sind.  
Ein CodeSystem enthält **alle** Codes (auch inaktive). Ein ValueSet filtert auf **erlaubte** Codes.

### Problem ohne ValueSet

```
CodeSystem enthält:  #AAUG, #ABAB, #BAKPAU, #HAEM (inaktiv), #CRP

App zeigt dem Arzt alle 5 Tests → Arzt bestellt #HAEM → Labor bietet es nicht mehr an ❌
```

### Lösung mit ValueSet

```json
{
  "resourceType": "ValueSet",
  "id": "zlz-aktive-tests",
  "url": "https://www.zetlab.ch/fhir/ValueSet/zlz-aktive-tests",
  "name": "ZLZAktiveTests",
  "title": "ZLZ — Aktive bestellbare Tests",
  "status": "active",
  "compose": {
    "include": [
      {
        "system": "https://www.zetlab.ch/lis/codes",
        "concept": [
          { "code": "#AAUG" },
          { "code": "#ABAB" },
          { "code": "#ABANMO" },
          { "code": "#ADENPAU" },
          { "code": "#ADENPNA" },
          { "code": "#BAKPAU" },
          { "code": "#BOPAPBR" }
        ]
      }
    ]
  }
}
```

```
App ruft ValueSet/$expand auf → bekommt nur 7 aktive Tests
#HAEM fehlt → erscheint nicht im UI → Arzt kann es nicht bestellen ✅
```

### Weitere ValueSets in diesem Projekt

| ValueSet ID | Zweck |
|-------------|-------|
| `zlz-aktive-tests` | Bestellbare Tests im Testkatalog |
| `labor-kategorien` | Gültige Topic-Codes für Filter-Buttons im UI |
| `zlz-material-codes` | Gültige Probentypen für SpecimenDefinition |

---

## 3. ConceptMap — Der Übersetzer

Übersetzt Codes zwischen zwei Systemen.  
Die Klinik kennt LOINC. Das Labor arbeitet intern mit LIS-Codes.  
Die ConceptMap verbindet beide.

### Problem ohne ConceptMap

```
Klinik sendet:   LOINC 624-7  (Bacterial culture, Specimen)
Labor empfängt:  LOINC 624-7  → LIS kennt diesen Code nicht → Auftrag fehlgeschlagen ❌
```

### Lösung mit ConceptMap

```json
{
  "resourceType": "ConceptMap",
  "id": "zlz-loinc-zu-lis",
  "url": "https://www.zetlab.ch/fhir/ConceptMap/zlz-loinc-zu-lis",
  "name": "ZLZLoincZuLis",
  "title": "ZLZ — LOINC zu LIS Test-Code Mapping",
  "status": "active",
  "sourceUri": "http://loinc.org",
  "targetUri": "https://www.zetlab.ch/lis/codes",
  "group": [
    {
      "source": "http://loinc.org",
      "target": "https://www.zetlab.ch/lis/codes",
      "element": [
        { "code": "6463-4",  "display": "Bacteria identified in Eye by Culture",       "target": [{ "code": "#AAUG",    "equivalence": "equivalent" }] },
        { "code": "624-7",   "display": "Bacteria identified in Sputum by Culture",    "target": [{ "code": "#ABAB",    "equivalence": "equivalent" }] },
        { "code": "624-7",   "display": "Bacteria identified by Culture",               "target": [{ "code": "#ABANMO",  "equivalence": "equivalent" }] },
        { "code": "33694-5", "display": "Bacteria identified in Specimen by Sequencing","target": [{ "code": "#BAKPAU",  "equivalence": "equivalent" }] },
        { "code": "101556-0","display": "Bordetella parapertussis DNA in Nasopharynx",  "target": [{ "code": "#BOPAPBR", "equivalence": "equivalent" }] }
      ]
    }
  ]
}
```

```
Klinik sendet:   LOINC 624-7
ConceptMap:      624-7  →  #ABAB
Labor empfängt:  #ABAB  → LIS verarbeitet Auftrag ✅
```

---

## Zusammenspiel aller drei Ressourcen

Am Beispiel des Tests `#AAUG` (Auge-Abstrich):

```
1. CodeSystem   →  "#AAUG existiert" und bedeutet "Abstrich Auge/Nase/Mund/Ohr"
                   (Wörterbuch: Definition des Codes)

2. ValueSet     →  "#AAUG ist aktiv und bestellbar bei ZLZ"
                   (Auswahlliste: Arzt sieht ihn im Testkatalog)

3. ConceptMap   →  "LOINC 6463-4  =  ZLZ intern #AAUG"
                   (Übersetzer: Klinik bestellt in LOINC, Labor verarbeitet in LIS)
```

---

## Reihenfolge beim Anlegen auf dem FHIR-Server

```
1. CodeSystem     (zuerst — ValueSet und ConceptMap referenzieren es)
2. ValueSet       (referenziert CodeSystem)
3. ConceptMap     (referenziert beide CodeSystems: LOINC und ZLZ-LIS)
```

```bash
# CodeSystem anlegen
curl -X PUT http://localhost:8080/fhir/CodeSystem/zlz-lis-test-codes \
  -H "Content-Type: application/fhir+json" -d @CodeSystem_zlz-lis-test-codes.json

# ValueSet anlegen
curl -X PUT http://localhost:8080/fhir/ValueSet/zlz-aktive-tests \
  -H "Content-Type: application/fhir+json" -d @ValueSet_zlz-aktive-tests.json

# ConceptMap anlegen
curl -X PUT http://localhost:8080/fhir/ConceptMap/zlz-loinc-zu-lis \
  -H "Content-Type: application/fhir+json" -d @ConceptMap_zlz-loinc-zu-lis.json
```

---

## Validierung

```bash
# Code nachschlagen
curl "http://localhost:8080/fhir/CodeSystem/zlz-lis-test-codes/$lookup?code=%23AAUG"

# ValueSet expandieren (alle aktiven Tests)
curl "http://localhost:8080/fhir/ValueSet/zlz-aktive-tests/\$expand" | jq '.expansion.contains[].code'

# Code übersetzen (LOINC → LIS)
curl "http://localhost:8080/fhir/ConceptMap/zlz-loinc-zu-lis/\$translate?code=6463-4&system=http://loinc.org"
```
