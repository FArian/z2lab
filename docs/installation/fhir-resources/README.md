# FHIR Master Data Resources

Alle FHIR-Ressourcen für den produktiven Setup der OrderEntry App.
Ordnerstruktur entspricht der Setup-Reihenfolge in [../Setup-Guide.md](../Setup-Guide.md).

---

## Ordnerstruktur

```
fhir-resources/
├── 01_terminologie/      Phase 3 — Wörterbuch, Auswahllisten, Übersetzer
├── 02_organisationen/    Phase 4 — Labore, Kliniken, Standorte, Beziehungen
├── 03_personen/          Phase 5 — Ärzte und Rollen
└── 04_test-workflow/     Phase 7 — Testpatient, Versicherung, Besuch
```

---

## 01 — Terminologie (14 Dateien)

| Datei | Inhalt |
|-------|--------|
| `CodeSystem_zlz-material-codes.json` | 107 Probentypen aus Labsoft LIS |
| `CodeSystem_zlz-lis-test-codes.json` | 4218 aktive LIS Test-Codes |
| `ValueSet_zlz-aktive-tests.json` | Alle 4218 bestellbaren Tests |
| `ValueSet_zlz-aktive-labor-tests.json` | 3572 LABOR-Tests |
| `ValueSet_zlz-aktive-mibi-tests.json` | 646 MIBI-Tests |
| `ValueSet_zlz-tests-risch.json` | Befundgruppe RISCH (2120) |
| `ValueSet_zlz-tests-kc.json` | Befundgruppe KC (914) |
| `ValueSet_zlz-tests-rischmb.json` | Befundgruppe RISCHMB (548) |
| `ValueSet_zlz-tests-h-ma.json` | Befundgruppe HÄMA (215) |
| `ValueSet_zlz-tests-bb.json` | Befundgruppe BB (145) |
| `ValueSet_zlz-tests-sero.json` | Befundgruppe SERO (124) |
| `ValueSet_zlz-tests-bak-myko.json` | Befundgruppe BAK/MYKO (98) |
| `ValueSet_zlz-tests-ger.json` | Befundgruppe GER (54) |
| `ConceptMap_zlz-loinc-zu-lis.json` | ⚠️ Platzhalter — wartet auf vollständige LIS-Code-Liste |

---

## 02 — Organisationen (11 Dateien)

```
zlz-gruppe  (gemeinsames organisatorisches Dach)
  ├── zlz       GLN 7601009336904 — Forchstrasse 454, 8702 Zollikon
  │     └── Location: zlz-zollikon (Hauptstandort)
  │     └── Location: zlz-notfall-im-park (Bellariastrasse 38, 8038 Zürich)
  └── zetlab    GLN 7601009336904 — Forchstrasse 454, 8702 Zollikon
        └── Location: zetlab-zollikon

klinik-hirslanden   GLN 7601002074810
  └── Location: klinik-hirslanden
  ← OrganizationAffiliation ← zlz       (ZLZ ist Labor-Dienstleister)
  ← OrganizationAffiliation ← zetlab    (ZetLab ist Labor-Dienstleister)

versicherung-css    CSS Versicherung AG, Luzern
```

---

## 03 — Personen (2 Dateien)

| Datei | Inhalt |
|-------|--------|
| `Practitioner_prac-001.json` | Dr. med. Hans Müller, Facharzt Innere Medizin |
| `PractitionerRole_role-001.json` | Rolle bei Klinik Hirslanden |

---

## 04 — Test-Workflow (3 Dateien)

| Datei | Inhalt |
|-------|--------|
| `Patient_test-001.json` | Anna Testperson, geb. 15.03.1980, Klinik Hirslanden |
| `Coverage_test-001.json` | KVG Grundversicherung, Payor: CSS Versicherung AG |
| `Encounter_test-001.json` | Ambulanter Besuch, serviceProvider: Klinik Hirslanden |

---

## Setup-Reihenfolge

```bash
BASE=http://localhost:8080/fhir
HDR="-H 'Content-Type: application/fhir+json'"

# Phase 3 — Terminologie
curl -X PUT $BASE/CodeSystem/zlz-material-codes  $HDR -d @01_terminologie/CodeSystem_zlz-material-codes.json
curl -X PUT $BASE/CodeSystem/zlz-lis-test-codes  $HDR -d @01_terminologie/CodeSystem_zlz-lis-test-codes.json
curl -X PUT $BASE/ValueSet/zlz-aktive-tests       $HDR -d @01_terminologie/ValueSet_zlz-aktive-tests.json

# Phase 4 — Organisationen (Reihenfolge einhalten: partOf-Referenzen!)
curl -X PUT $BASE/Organization/zlz-gruppe          $HDR -d @02_organisationen/Organization_zlz-gruppe.json
curl -X PUT $BASE/Organization/zlz                 $HDR -d @02_organisationen/Organization_zlz.json
curl -X PUT $BASE/Organization/zetlab              $HDR -d @02_organisationen/Organization_zetlab.json
curl -X PUT $BASE/Organization/klinik-hirslanden   $HDR -d @02_organisationen/Organization_klinik-hirslanden.json
curl -X PUT $BASE/Organization/versicherung-css    $HDR -d @02_organisationen/Organization_versicherung-css.json
curl -X PUT $BASE/Location/zlz-zollikon            $HDR -d @02_organisationen/Location_zlz-zollikon.json
curl -X PUT $BASE/Location/zlz-notfall-im-park     $HDR -d @02_organisationen/Location_zlz-notfall-im-park.json
curl -X PUT $BASE/Location/zetlab-zollikon         $HDR -d @02_organisationen/Location_zetlab-zollikon.json
curl -X PUT $BASE/Location/klinik-hirslanden       $HDR -d @02_organisationen/Location_klinik-hirslanden.json
curl -X PUT $BASE/OrganizationAffiliation/aff-zlz-hirslanden    $HDR -d @02_organisationen/OrganizationAffiliation_zlz-hirslanden.json
curl -X PUT $BASE/OrganizationAffiliation/aff-zetlab-hirslanden $HDR -d @02_organisationen/OrganizationAffiliation_zetlab-hirslanden.json

# Phase 5 — Personen
curl -X PUT $BASE/Practitioner/prac-001      $HDR -d @03_personen/Practitioner_prac-001.json
curl -X PUT $BASE/PractitionerRole/role-001  $HDR -d @03_personen/PractitionerRole_role-001.json

# Phase 7 — Test-Workflow
curl -X PUT $BASE/Patient/test-001       $HDR -d @04_test-workflow/Patient_test-001.json
curl -X PUT $BASE/Coverage/cov-test-001  $HDR -d @04_test-workflow/Coverage_test-001.json
curl -X PUT $BASE/Encounter/enc-test-001 $HDR -d @04_test-workflow/Encounter_test-001.json
```

---

## Validierung

```bash
curl "$BASE/Organization?_count=0"            | jq '.total'   # 5
curl "$BASE/Location?_count=0"                | jq '.total'   # 4
curl "$BASE/OrganizationAffiliation?_count=0" | jq '.total'   # 2
curl "$BASE/CodeSystem?_count=0"              | jq '.total'   # 2
curl "$BASE/ValueSet?_count=0"                | jq '.total'   # 13
curl "$BASE/Practitioner?_count=0"            | jq '.total'   # 1
curl "$BASE/Patient?_count=0"                 | jq '.total'   # 1
```
