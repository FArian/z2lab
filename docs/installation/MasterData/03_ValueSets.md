# Schritt 3 — ValueSets

> ValueSets definieren die erlaubten Codes für Kategorien, Probentypen und Prioritäten.  
> Sie müssen **vor** `ActivityDefinition` und `SpecimenDefinition` angelegt sein.

---

## Warum ValueSets zuerst?

`ActivityDefinition.topic` referenziert Codes aus dem ValueSet `labor-kategorien`.  
`SpecimenDefinition.typeCollected` referenziert Codes für den Probentyp.  
Ohne diese ValueSets können Tests nicht korrekt kategorisiert werden, und die Filterung im UI funktioniert nicht.

---

## 1. Testkatalog-Kategorien (Topics)

Jeder Labortest (`ActivityDefinition`) muss einer Kategorie zugewiesen sein.  
Die App gruppiert und filtert Tests nach diesen Topics.

> **Wichtig:** Das System ist **`https://www.zetlab.ch/fhir/category`** (nicht ein generischer ValueSet).  
> Die Codes kommen direkt aus dem LIS (Labsoft) und werden vom Orchestra-Konverter übernommen.

### Kategorien aus den LIS-Stammdaten

| Code | Display | Beispiele |
|------|---------|-----------|
| `MIBI` | Mikrobiologie | Abstrich, Bakteriologie, PCR, Viren |
| `Routine` | Routine | Allgemeinbakteriologie |
| *(weitere Codes aus LIS möglich)* | | Je nach Labsoft-Konfiguration |

**Diese Codes sind nicht als FHIR-ValueSet zu pflegen** — sie werden automatisch aus  
`StammdatenAusLIS.xml` in die `ActivityDefinition.topic`-Felder geschrieben.

### Verwendung im ActivityDefinition

```json
"topic": [
  {
    "coding": [
      {
        "system": "https://www.zetlab.ch/fhir/category",
        "code": "MIBI",
        "display": "Mikrobiologie"
      }
    ]
  }
]
```

### Falls ein eigener ValueSet gewünscht

```json
{
  "resourceType": "ValueSet",
  "id": "labor-kategorien",
  "url": "https://www.zetlab.ch/fhir/ValueSet/labor-kategorien",
  "version": "1.0.0",
  "name": "LaborKategorien",
  "status": "active",
  "compose": {
    "include": [
      {
        "system": "https://www.zetlab.ch/fhir/category",
        "concept": [
          { "code": "MIBI",    "display": "Mikrobiologie" },
          { "code": "Routine", "display": "Routine" }
        ]
      }
    ]
  }
}
```

---

## 2. Probentypen (Specimen Types)

Referenziert von `SpecimenDefinition.typeCollected`.

> **System:** `https://www.zetlab.ch/fhir/specimen-types`  
> Codes kommen aus dem XML-Feld `BARCODE_ZUSATZ` des LIS-Exports.  
> Jeder Code entspricht einem eindeutigen Probengefäss/-typ im Labor.

### Probentypen aus den LIS-Stammdaten (Beispiele)

| Code | Display | Entspricht XML `MATERIAL_TEXT` |
|------|---------|-------------------------------|
| `AA` | Abstrich Auge/Nase/Mund/Ohr | Abstrich Auge/Nase/Mund/Ohr |
| `60` | Abstrich/Sekret | Abstrich/Sekret |
| `AT` | Abstrich Bronch./Trachealsekret | Abstrich Bronch./Trachealsekret |
| *(weitere aus LIS)* | | Je nach `BARCODE_ZUSATZ`-Werten |

**Diese Codes werden automatisch aus dem LIS übernommen** — kein manueller ValueSet nötig.  
Dual-Kodierung: jeder Probentyp hat zusätzlich einen **SNOMED CT Code** (aus XML-Feld `M_SNOMED_CODE`).

### Verwendung in SpecimenDefinition

```json
"typeCollected": {
  "coding": [
    {
      "system": "https://www.zetlab.ch/fhir/specimen-types",
      "code": "AA",
      "display": "Abstrich Auge/Nase/Mund/Ohr"
    },
    {
      "system": "http://snomed.info/sct",
      "code": "119399004",
      "display": "Specimen from Eye (specimen)"
    }
  ],
  "text": "Eye"
}

---

## 3. Auftragsprioritäten

Referenziert von `ServiceRequest.priority`.  
FHIR R4 verwendet den Standard-Code `http://hl7.org/fhir/request-priority`.

| Code | Display | Verwendung |
|------|---------|------------|
| `routine` | Routine | Normaler Auftrag |
| `urgent` | Urgent (STAT) | Dringlich, innerhalb 2h |
| `asap` | ASAP | So bald wie möglich |
| `stat` | STAT (Notfall) | Sofortige Bearbeitung |

> **Hinweis:** Diese Codes sind FHIR-Standard und müssen **nicht** als eigener ValueSet angelegt werden.  
> Die App verwendet `urgent` für STAT-Aufträge (orange Badge-Farbe im UI).

---

## Anlegen

```bash
# Kategorien-ValueSet
curl -X PUT http://localhost:8080/fhir/ValueSet/labor-kategorien \
  -H "Content-Type: application/fhir+json" \
  -d @02_valueset_kategorien.json

# Probentypen-ValueSet
curl -X PUT http://localhost:8080/fhir/ValueSet/probentypen \
  -H "Content-Type: application/fhir+json" \
  -d @02_valueset_probentypen.json
```
