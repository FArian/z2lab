# Auftrag_Import_labsoft_LIS — HL7 ORM Import Configuration

## Overview

This file is a **Labsoft LIS import mapping configuration** for inbound **HL7 v2.x ORM (Order) messages**. It defines how incoming HL7 data from external senders (e.g. hospital information systems) is parsed and mapped into the Labsoft LIS data model at **ZLZ Zentrallabor AG**.

---

## File Structure

The configuration file is divided into the following sections:

### 1. ASCII Character Mapping
Converts extended characters from the sender's encoding to the Labsoft-compatible code page (e.g. `ü`, `ö`, `ä`, `Ü`, `Ö`, `Ä`).

### 2. Macros (`$xxx`)

| Macro | Purpose |
|-------|---------|
| `$CO1` | Lookup: find physician (`ARZT`) by `MATCH` field in ARZT table |
| `$IF1` / `$IF2` / `$IF3` | Conditional branching for Schein-UG and Lebensnummer logic |
| `$DA1`–`$DA4` | Date/time format converters (various input → Labsoft internal formats) |
| `$IN1`–`$IN4` | Static initializer values (Haus=0, Abteilung=ZLZ, default Schein-UG=107, empty) |
| `$EIL` | Priority flag mapping: `1` → `U` (urgent), `0` → `R` (routine) |
| `$SEX` | Gender mapping: `W`/`F` → `W`, `M` → `M` |
| `$SUG` | Schein-UG to routing group mapping (LAB0/LAB1/BAK0/BAK1) — *obsolete since 01.01.2026 (PRO-0033)* |
| `$PO1`–`$PO6` | Substring position extractors used in Lebensnummer parsing |
| `$AP1` | Append separator `-` |
| `$ME1`–`$ME7` / `$MA1`–`$MA7` | Temporary memory save/restore slots for multi-step macro chains |

### 3. Segment Mappings

Each mapping line follows the syntax:
```
<prefix>><SEGMENT>|<field>|<component>|||<variable>|<macro>|
```

**Prefixes:**
- `P>` — Patient level (one per patient, PID-triggered)
- `A>` — Auftrag (order) level (one per order)
- `C>` — Control/ACK (MSH/MSA response construction)

---

## Segment Details

### MSH — Message Header
- Constructs ACK response: sets sending app (`ZLZ`), facility (`ACK`), receiving app (`LABZLZ`), facility (`LAB`).
- Echoes back `MessageControlId`, `ProcessingId`, `VersionId` from the incoming message.

### PID — Patient Identification
| Field | Content |
|-------|---------|
| PID-3.1 / PID-3.2 | `PAT.LEBENSNR` — complex multi-step parsing with ZPPRIV and AGAMB prefix handling |
| PID-5.1 / PID-5.2 | `PAT.NAME` / `PAT.VORNAME` |
| PID-7 | `PAT.GEB` — date of birth (`$DA1`) |
| PID-8 | `PAT.SEX` (`$SEX` mapping) |
| PID-11.1–11.6 | Address: street, house number, city, postcode, country |
| PID-13.1 | Phone number |
| PID-13.4 | E-mail address |

### IN1 / IN2 — Insurance
| Field | Content |
|-------|---------|
| IN1-2.1 | `PAT.IK` / `SCH.IK` — insurance company number |
| IN1-36.1 | `PAT.VNR` / `SCH.VNR` — contract/policy number *(changed from IN1-49 on 30.04.2024)* |
| IN1-12.1 | `SCH.VK_GUELTIG_AB` — insurance card valid from |
| IN1-13.1 | `SCH.VK_GUELTIG_BIS` — insurance card valid to |
| IN2-2.1 | `PAT.@AHV` — AHV number (Swiss social security) |
| IN2-6.1 | `SCH.@VKN` — VeKa card number |

### PV1 — Patient Visit
| Field | Content |
|-------|---------|
| PV1-2.1 | `FAL.BEHANDLUNGSART` — treatment type |
| PV1-3.1 | `ARZT` — ordering physician (lookup via `$CO1`) |
| PV1-10.1 | `SCH.SCHEIN_UG` — insurance/billing group (from order) |
| PV1-11.1 | `AUF.SSW` — gestational week |
| PV1-12.1 | `AUF.SSW_TAG` — gestational week day |
| PV1-19.1 | `FALL` — case number |
| PV1-44.1 | `FAL.DATUM_AUFNAHME` — admission date |
| PV1-45.1 | `FAL.DATUM_ENTLASSUNG` — discharge date |

### ORC — Order Control
| Field | Content |
|-------|---------|
| ORC-2.1 | `AUF.EXTERN` / `AUF.BARCODE` — external order number / barcode |
| ORC-5.1 | `AUF.ANFSTATUS` — order request status |
| ORC-7.6 | `AUF.EILT` — priority flag (via `$EIL`) |
| ORC-7.6 | `SCH.SCHEIN_UG` — billing group routing (via `$EIL`, `$SUG`) |

### OBR — Observation Request
| Field | Content |
|-------|---------|
| OBR-4.1 | `TEST` — external test code |
| OBR-7.1 | `AUF.ABNAHMEDATUM` — sample collection date (`$DA1`) |
| OBR-7.1 | `AUF.ABNAHMEZEIT` — sample collection time (`$DA2`) |

### OBX — Observation Result
| Field | Content |
|-------|---------|
| OBX-3.1 | `TEST` — test code (for results) |
| OBX-5.1 | `WERT` — result value |

---

## NTE Segment — Notes and Comments

The NTE (Notes and Comments) segment has **no fixed meaning on its own**. Its meaning depends entirely on **which segment it directly follows**. NTE always belongs to the segment above it.

### NTE Position in ORM^O01 Message

```
MSH
PID
  └── NTE  ←  [1] Patient-level NTE
PV1
IN1 / IN2
ORC
  └── NTE  ←  [2] Order-level NTE        ← primary place for clinical info
OBR
  └── NTE  ←  [3] Test-level NTE
OBX
  └── NTE  ←  [4] Result-level NTE
SPM
  └── NTE  ←  [5] Specimen-level NTE
```

---

### [1] NTE after PID — Patient Remark

```
PID|1||P43211^^^TESTDEV^PI||Musterfrau^Sabine|||19700101|F|...
NTE|1|P|Bekannte Penicillin-Allergie
NTE|2|P|Rollstuhlfahrer, bitte Hausbesuch
```

| Property | Value |
|----------|-------|
| Belongs to | PID — the patient |
| Content | Permanent patient remarks, allergies, special needs |
| Labsoft variable | `PAT.INFO` |
| Config mapping | `A>NTE\|3\|2\|\|\|PAT.INFO\|\|` |
| NTE field | NTE-3 component **2** |

---

### [2] NTE after ORC — Order Clinical Indication *(most important)*

```
ORC|NW|7401010001||10093|IP||^^^20260330083000^^R|...
NTE|1|P|V.a. Eisenmangelanämie, Fatigue seit 4 Wochen
NTE|2|P|Aktuelle Medikation: Metformin 500mg 2x täglich
```

| Property | Value |
|----------|-------|
| Belongs to | ORC — the entire order |
| Content | Clinical indication, diagnosis, medication, free-text order notes |
| Labsoft variable | `AUF.TEXT` |
| Config mapping | `A>NTE\|3\|1\|\|\|AUF.TEXT\|\|` |
| NTE field | NTE-3 component **1** |
| Note | This is the **primary place** to send clinical information with an order |

---

### [3] NTE after OBR — Test-specific Note

```
OBR|1|||TRFS^Transferrinsättigung|||20260330082000|
NTE|1|P|Patient seit 12h nüchtern
NTE|2|P|Abnahme aus Venenkatheter links
```

| Property | Value |
|----------|-------|
| Belongs to | OBR — only this specific test |
| Content | Collection condition, fasting state, special note for one test |
| Labsoft variable | `AUF.TEXT` |
| Config mapping | `A>NTE\|3\|1\|\|\|AUF.TEXT\|\|` |
| NTE field | NTE-3 component **1** |
| Note | Labsoft merges this into the same `AUF.TEXT` as ORC-level NTE |

---

### [4] NTE after OBX — Result Comment / Finding

```
OBX|1|NM|TRFS^Transferrinsättigung||18.5|%|20.0-50.0|L|||F|||20260330093000
NTE|1|P|Transferrinsättigung erniedrigt, Eisenmangel wahrscheinlich
NTE|2|P|Bitte Ferritin nachfordern
```

| Property | Value |
|----------|-------|
| Belongs to | OBX — only this single result value |
| Content | Interpretive comment, finding remark, result-specific note |
| Labsoft variable | `BEFUND` |
| Config mapping | `A>NTE\|3\|1\|\|\|BEFUND\|\|` (placed after OBX block in config) |
| NTE field | NTE-3 component **1** |
| Note | Used for result import — not for order import |

---

### [5] NTE after SPM — Specimen Remark

```
SPM|1|7401010001|||SEGEL^Serum^LABOR||||||||||||20260330082000
NTE|1|P|Probe leicht hämolytisch
```

| Property | Value |
|----------|-------|
| Belongs to | SPM — the specimen/sample |
| Content | Sample quality, re-collection note, transport remark |
| Labsoft variable | *(not mapped in current config)* |
| Note | Not imported into Labsoft — would need new mapping if required |

---

### NTE Complete Summary Table

| # | NTE follows | Labsoft variable | NTE-3 component | Use case |
|---|-------------|-----------------|-----------------|----------|
| 1 | **PID** | `PAT.INFO` | **2** | Patient allergy, permanent remark |
| 2 | **ORC** | `AUF.TEXT` | **1** | Clinical indication, diagnosis, medication |
| 3 | **OBR** | `AUF.TEXT` | **1** | Test-specific note, fasting, collection condition |
| 4 | **OBX** | `BEFUND` | **1** | Result comment, interpretation, finding |
| 5 | **SPM** | *(not mapped)* | — | Specimen quality remark |

---

### NTE-2 Source Code (who wrote the comment)

| Code | Meaning |
|------|---------|
| `L` | Lab — comment from the laboratory |
| `P` | Placer — comment from the ordering system (sender) |
| `O` | Other |

---

### NTE Can Repeat

Multiple NTE segments in a row all belong to the same parent. NTE-1 is a sequence counter only.

```
OBR|1|||TRFS
NTE|1|P|First line of comment
NTE|2|P|Second line of comment    ← all three belong to OBR|1
NTE|3|P|Third line of comment
```

---

### NTE in Test Message NTE_TEST_AUFTRAG.hl7

The test file `NTE_TEST_AUFTRAG.hl7` contains the following NTE segments:

```
PID ...
NTE|1|P|{base64_encoded}|RE^Begleitschein    ← follows PID → PAT.INFO
                                                 PROBLEM: unresolved placeholder!
ORC ...
OBR|5|||KOPIE2
OBX|1|TX|KOPIE2||||||||F|||20260325114308
NTE|1|P|Herr TestVorname Test  Linke Zeile    ← follows OBX → BEFUND
         1000  3500 Krems (AT)                   copy address for KOPIE2
         test@test.test.at

OBR|6|||KOPIE3
OBX|2|TX|KOPIE3||||||||F|||20260325114308
NTE|1|P|Frau Testa Testroin  Testgasse 99     ← follows OBX → BEFUND
         1130 Wien (Österreich)                  copy address for KOPIE3
         test@tme.co.at                          PROBLEM: encoding error Ã– = Ö
```

**Issues found in test message:**

| # | Severity | NTE | Issue |
|---|----------|-----|-------|
| 1 | Critical | after PID | `{base64_encoded}` is an unresolved template variable — sender must fix |
| 2 | High | after OBX-2 | `Ã–sterreich` — UTF-8 encoding error, `Ö` garbled |
| 3 | Info | after OBX-1/2 | NTE used to send copy recipient addresses (KOPIE2, KOPIE3) — valid usage |

---

## Complete HL7 ORM Message Example

```hl7
MSH|^~\&|secureOrder^General|TESTDEV|LABZLZ|LAB|20260330083000||ORM^O01|MSG000001|P|2.5|||NE|NE|CH|UNICODE UTF-8
PID|1||P43211^^^TESTDEV^PI||Musterfrau^Sabine^^^Frau||19700101|F|||Testgasse 1^^Wien^^1200^AT||0123456789^^^sabine@email.at||||||1234567890
NTE|1|P|Bekannte Penicillin-Allergie
PV1|1|A|TESTDEV||||12345^Müller^Hans|||A0||||
IN1|1||CH12345678|Krankenkasse Muster||||||||20260101|20261231|||Musterfrau^Sabine||19700101|Testgasse 1^^Wien^^1200^CH|||||||||||||||||V98765
IN2|1|7561234567890||||||756.1234.5678.90
ORC|NW|7401010001||10093|IP||^^^20260330083000^^R||20260330082500|||TESTDEV
NTE|1|P|V.a. Eisenmangelanämie, Fatigue seit 4 Wochen
NTE|2|P|Aktuelle Medikation: Metformin 500mg 2x täglich
OBR|1|||TRFS^Transferrinsättigung|||20260330082000||||||||7401010001|
NTE|1|P|Patient seit 12h nüchtern
OBX|1|NM|TRFS^Transferrinsättigung||18.5|%|20.0-50.0|L|||F|||20260330093000
NTE|1|P|Transferrinsättigung erniedrigt, Eisenmangel wahrscheinlich
OBR|2|||BLUTBILD^Grosses Blutbild|||20260330082000|
OBX|2|NM|HB^Hämoglobin||11.2|g/dl|12.0-16.0|L|||F|||20260330093000
OBX|3|NM|HKT^Hämatokrit||34.1|%|37.0-47.0|L|||F|||20260330093000
OBX|4|NM|ERY^Erythrozyten||3.8|T/l|3.8-5.2||||F|||20260330093000
SPM|1|7401010001|||SEGEL^Serum^LABOR||||||||||||20260330082000
```

### Data flow in this example

```
PID  ─── Patient: Musterfrau Sabine
 NTE → PAT.INFO          "Bekannte Penicillin-Allergie"

ORC  ─── Order: Barcode 7401010001, Routine
 NTE → AUF.TEXT          "V.a. Eisenmangelanämie, Fatigue seit 4 Wochen"
 NTE → AUF.TEXT          "Aktuelle Medikation: Metformin 500mg 2x täglich"

OBR|1| TRFS ─── Test: Transferrin
 NTE → AUF.TEXT          "Patient seit 12h nüchtern"
 OBX|1| 18.5 %  L
  NTE → BEFUND            "Transferrinsättigung erniedrigt, Eisenmangel wahrscheinlich"

OBR|2| BLUTBILD ─── Test: Blood count
 OBX|2| HB   11.2 g/dl  L
 OBX|3| HKT  34.1 %     L
 OBX|4| ERY  3.8  T/l

SPM ─── Specimen: Serum 7401010001
```

---

## FHIR → HL7 ORM Mapping (ZetLab OrderEntry)

This section documents how FHIR `ServiceRequest` fields from the ZetLab OrderEntry app are mapped to HL7 ORM^O01 segments by the Orchestra scenario `sc_OrderEntry_Middleware`.

### ServiceRequest → ORC

| FHIR Field | Value | HL7 Segment | HL7 Field | Labsoft Variable |
|---|---|---|---|---|
| `ServiceRequest.identifier[order-numbers].value` | e.g. `ord-20261001-143022` | ORC-2.1 | External Order Number | `AUF.EXTERN` / `AUF.BARCODE` |
| `ServiceRequest.priority` | `routine` | ORC-7.6 | `R` | `AUF.EILT` = 0 |
| `ServiceRequest.priority` | `urgent` | ORC-7.6 | `U` | `AUF.EILT` = 1 |
| `ServiceRequest.status` | `active` | ORC-5.1 | `IP` | `AUF.ANFSTATUS` |
| `ServiceRequest.requester.display` | e.g. `Dr. Muster` | PV1-8 | Referring Doctor | `ARZT` |
| `ServiceRequest.note[0].text` | free text | NTE after ORC | Clinical indication | `AUF.TEXT` |
| `ServiceRequest.encounter` → `Encounter.class.code` | `AMB`/`IMP`/`EMER`/`SS`/`HH`/`VR` | PV1-2 | Patient class | `FAL.BEHANDLUNGSART` |

### ServiceRequest → OBR

| FHIR Field | Value | HL7 Segment | HL7 Field | Labsoft Variable |
|---|---|---|---|---|
| `ServiceRequest.occurrenceDateTime` | e.g. `2026-10-01T14:30:00` | OBR-7.1 | Collection Date | `AUF.ABNAHMEDATUM` |
| `ServiceRequest.occurrenceDateTime` | e.g. `2026-10-01T14:30:00` | OBR-7.1 | Collection Time | `AUF.ABNAHMEZEIT` |
| `ServiceRequest.code.coding[lis].code` | e.g. `#AAUG` | OBR-4.1 | Test Code | `TEST` |

### Patient (from FHIR Patient resource) → PID

| FHIR Field | HL7 Field | Labsoft Variable |
|---|---|---|
| `Patient.id` | PID-3.1 | `PAT.LEBENSNR` |
| `Patient.name.family` | PID-5.1 | `PAT.NAME` |
| `Patient.name.given[0]` | PID-5.2 | `PAT.VORNAME` |
| `Patient.birthDate` | PID-7 | `PAT.GEB` |
| `Patient.gender` | PID-8 | `PAT.SEX` (via `$SEX`) |
| `Patient.identifier[ahv].value` | IN2-2.1 | `PAT.@AHV` |
| `Patient.identifier[veka].value` | IN2-6.1 | `SCH.@VKN` |

### Priority Mapping Detail

```
FHIR ServiceRequest.priority    →    ORC-7.6    →    Labsoft AUF.EILT
─────────────────────────────────────────────────────────────────────
"routine"                        →    R          →    0
"urgent"                         →    U          →    1  (via $EIL macro)
```

### ORC-7 Full Structure (Quantity/Timing)

```
ORC-7: ^^^<collectionDateTime>^^<priority>
         |||20261001143000    ||R
```

- Component 4: `occurrenceDateTime` formatted as `YYYYMMDDHHmmss`
- Component 6: `R` (routine) or `U` (urgent)

---

## Key Change History

| Date | Change | Reference |
|------|--------|-----------|
| 19.08.2021 | Default Schein-UG set to 107; Notfall Nacht/WoE → 167 | NHR |
| 22.11.2022 | Lebensnummer with ZPPRIV prefix handling added | TCH2200479 |
| 03.01.2023 | House number parsing added (PID-11.2 via `$PO2`) | PET |
| 17.08.2022 | E-Mail field added (PID-13.4) | SMA |
| 25.08.2023 | AHV-Nr, VeKa-Nr, insurance fields restructured (ACH220036) | GRR |
| 21.09.2023 | ZPPRIV and AGAMB prefix logic refactored (TCH2300438) | GRR |
| 30.04.2024 | IN1-49 → IN1-36 for VNR field | Farhad |
| 27.10.2024 | IHD-12190: STRING separator added | NH |
| 23.05.2024 | OBR-15 material mapping added, then reverted | IHD-11280, NHR |
| 01.01.2026 | `$SUG` routing (Openmedical) obsolete | PRO-0033, NHO |

---

## Notes

- The `$SUG` macro and related routing to LAB0/LAB1/BAK0/BAK1 was implemented for Openmedical and is **obsolete since 01.01.2026** per PRO-0033.
- OBR-15 (sample material) mapping was intentionally **removed** after IHD-11280.
- The Lebensnummer (PID-3) logic uses a multi-step macro chain to handle three cases: standard, ZPPRIV-prefixed, and AGAMB-prefixed patient IDs.
- NTE segments after ORC and OBR both map to `AUF.TEXT` — Labsoft does not distinguish between them.
- NTE after OBX maps to `BEFUND` — this is only relevant for result import, not order import.
- NTE after SPM is not mapped and will be ignored by Labsoft.
