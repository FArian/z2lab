# FHIR → HL7 v2 ORM^O01 Mapping

## Overview

This document describes how FHIR R4 resources from the ZetLab OrderEntry system
are mapped to an HL7 v2.5 ORM^O01 (General Order Message) for transmission to
the ZLZ laboratory information system (LIS).

### FHIR Resources Used

| FHIR Resource     | Role in Order                                      |
|-------------------|----------------------------------------------------|
| `ServiceRequest`  | The lab order itself (what to analyse, when, why)  |
| `Patient`         | Who the order is for                               |
| `Encounter`       | Clinical context / visit                           |
| `Practitioner`    | The ordering doctor (identity + GLN)               |
| `PractitionerRole`| Doctor's role and ordering organization            |
| `Organization`    | Ordering facility and performing lab               |
| `Coverage`        | Insurance information                              |

### HL7 ORM^O01 Segment Overview

```
MSH  — Message Header
PID  — Patient Identification        ← Patient
PD1  — Patient Additional Demographic
PV1  — Patient Visit                 ← Encounter
IN1  — Insurance                     ← Coverage
ORC  — Common Order                  ← ServiceRequest + PractitionerRole
OBR  — Observation Request           ← ServiceRequest.code (LOINC)
NTE  — Notes (optional)
```

---

## MSH — Message Header

| HL7 Field | HL7 Name                  | FHIR Source                                      | Example Value         |
|-----------|---------------------------|--------------------------------------------------|-----------------------|
| MSH.1     | Field Separator           | Hardcoded                                        | `\|`                  |
| MSH.2     | Encoding Characters       | Hardcoded                                        | `^~\&`                |
| MSH.3     | Sending Application       | Hardcoded (OrderEntry system name)               | `ORDERENTRY`          |
| MSH.4     | Sending Facility          | `Organization.identifier` (GLN, urn:oid:2.51.1.3) | `7601009336904`     |
| MSH.5     | Receiving Application     | Hardcoded (LIS name)                             | `LIS`                 |
| MSH.6     | Receiving Facility        | `Organization/zetlab` identifier                 | `7601009336904`       |
| MSH.7     | Date/Time of Message      | `ServiceRequest.authoredOn`                      | `20260329100000`      |
| MSH.9     | Message Type              | Hardcoded                                        | `ORM^O01`             |
| MSH.10    | Message Control ID        | Generated UUID / `ServiceRequest.id`             | `order-1`             |
| MSH.11    | Processing ID             | Hardcoded                                        | `P` (Production)      |
| MSH.12    | Version ID                | Hardcoded                                        | `2.5`                 |

---

## PID — Patient Identification

Source: `Patient/farhad-arian`

| HL7 Field | HL7 Name              | FHIR Source                                                        | Example Value            |
|-----------|-----------------------|--------------------------------------------------------------------|--------------------------|
| PID.2     | Patient ID (External) | `Patient.identifier` where system = `urn:oid:2.16.756.5.32` (AHV) | `756.1234.5678.97`       |
| PID.3     | Patient ID (Internal) | `Patient.identifier` where system = `urn:oid:2.16.756.5.30.1.123.1.1` (KVK) | `80756001234567890123` |
| PID.5     | Patient Name          | `Patient.name[0].family` ^ `Patient.name[0].given[0]`             | `Arian^Farhad`           |
| PID.7     | Date of Birth         | `Patient.birthDate` (YYYYMMDD)                                     | `19830214`               |
| PID.8     | Sex                   | `Patient.gender` (male→M, female→F, other→O, unknown→U)           | `M`                      |
| PID.11    | Patient Address       | `Patient.address[0]` line ^ ^ city ^ ^ postalCode ^ country       | `Forchstrasse 454^^Zollikon^^8702^CH` |
| PID.13    | Phone (Home)          | `Patient.telecom` where system = `phone`                           | `+41791234567`           |

### Gender Mapping

| FHIR `Patient.gender` | HL7 PID.8 |
|-----------------------|-----------|
| `male`                | `M`       |
| `female`              | `F`       |
| `other`               | `O`       |
| `unknown`             | `U`       |

---

## PV1 — Patient Visit

Source: `Encounter/encounter-1`

| HL7 Field | HL7 Name              | FHIR Source                                              | Example Value  |
|-----------|-----------------------|----------------------------------------------------------|----------------|
| PV1.1     | Set ID                | Hardcoded                                                | `1`            |
| PV1.2     | Patient Class         | `Encounter.class.code` (see mapping below)               | `O`            |
| PV1.3     | Assigned Location     | `Encounter.serviceProvider` → `Organization.name`        | `ZLZ AG`       |
| PV1.7     | Attending Doctor      | `PractitionerRole.practitioner` → `Practitioner` (GLN^family^given) | `7601001619241^Dede^Ersin` |
| PV1.19    | Visit Number          | `Encounter.id`                                           | `encounter-1`  |
| PV1.44    | Admit Date/Time       | `Encounter.period.start` (if present)                    | `20260329100000` |

### Encounter Class Mapping

| FHIR `Encounter.class.code` | HL7 PV1.2 | Description     |
|-----------------------------|-----------|-----------------|
| `AMB`                       | `O`       | Outpatient      |
| `IMP`                       | `I`       | Inpatient       |
| `EMER`                      | `E`       | Emergency       |
| `HH`                        | `H`       | Home Health     |

---

## IN1 — Insurance

Source: `Coverage/coverage-1`

| HL7 Field | HL7 Name           | FHIR Source                                                    | Example Value          |
|-----------|--------------------|----------------------------------------------------------------|------------------------|
| IN1.1     | Set ID             | Hardcoded                                                      | `1`                    |
| IN1.2     | Insurance Plan ID  | `Coverage.type.text`                                           | `KVG Grundversicherung`|
| IN1.3     | Insurance Company  | `Coverage.payor[0]` → `Organization.name`                      | `CSS Versicherung`     |
| IN1.4     | Insurance GLN      | `Coverage.payor[0]` → `Organization.identifier` (urn:oid:2.51.1.3) | `7601003001082`   |
| IN1.36    | Policy Number      | `Coverage.identifier` where system = `urn:oid:2.16.756.5.30.1.123.1.1` | `80756001234567890123` |

---

## ORC — Common Order

Source: `ServiceRequest/order-1` + `PractitionerRole/ersin-role`

| HL7 Field | HL7 Name                    | FHIR Source                                                         | Example Value            |
|-----------|-----------------------------|---------------------------------------------------------------------|--------------------------|
| ORC.1     | Order Control               | Hardcoded (new order)                                               | `NW`                     |
| ORC.2     | Placer Order Number         | `ServiceRequest.id`                                                 | `order-1`                |
| ORC.3     | Filler Order Number         | Generated by LIS                                                    | *(assigned by LIS)*      |
| ORC.5     | Order Status                | `ServiceRequest.status` (see mapping below)                         | `IP`                     |
| ORC.9     | Date/Time of Transaction    | `ServiceRequest.authoredOn` (YYYYMMDDHHMMSS)                        | `20260329100000`         |
| ORC.12    | Ordering Provider           | `Practitioner.identifier`^`name.family`^`name.given`^``^``^``^``^``^`GLN` | `7601001619241^Dede^Ersin^^^^^^^^GLN` |
| ORC.13    | Enterer's Location          | `PractitionerRole.organization` → `Organization.name`               | `ZLZ AG`                 |
| ORC.21    | Ordering Facility Name      | `PractitionerRole.organization` → `Organization.name`               | `ZLZ AG`                 |
| ORC.22    | Ordering Facility Address   | `PractitionerRole.organization` → `Organization.address`            | `Forchstrasse 454^^Zollikon^^8702^CH` |
| ORC.23    | Ordering Facility Phone     | `PractitionerRole.organization` → `Organization.telecom` (phone)    | *(if available)*         |

### ORC.1 Order Control Mapping

| Trigger                         | HL7 ORC.1 |
|---------------------------------|-----------|
| New order created               | `NW`      |
| Order cancelled                 | `CA`      |
| Order replaced                  | `RP`      |
| Order status update             | `SC`      |

### ServiceRequest.status → ORC.5 Mapping

| FHIR `ServiceRequest.status` | HL7 ORC.5 | Description          |
|------------------------------|-----------|----------------------|
| `draft`                      | `HD`      | Hold                 |
| `active`                     | `IP`      | In Process           |
| `on-hold`                    | `HD`      | Hold                 |
| `revoked`                    | `CA`      | Cancelled            |
| `completed`                  | `CM`      | Completed            |
| `entered-in-error`           | `DC`      | Discontinued         |

---

## OBR — Observation Request

Source: `ServiceRequest.code` (LOINC)

| HL7 Field | HL7 Name                    | FHIR Source                                                     | Example Value            |
|-----------|-----------------------------|-----------------------------------------------------------------|--------------------------|
| OBR.1     | Set ID                      | Hardcoded                                                       | `1`                      |
| OBR.2     | Placer Order Number         | `ServiceRequest.id`                                             | `order-1`                |
| OBR.3     | Filler Order Number         | Generated by LIS                                                | *(assigned by LIS)*      |
| OBR.4     | Universal Service ID        | `ServiceRequest.code.coding[LOINC]` code^display^system         | `1988-5^CRP^LN`          |
| OBR.4.1   | LOINC Code                  | `ServiceRequest.code.coding[0].code`                            | `1988-5`                 |
| OBR.4.2   | Display Text                | `ServiceRequest.code.text` (German label)                       | `CRP Analyse`            |
| OBR.4.3   | Coding System               | `ServiceRequest.code.coding[0].system` → `LN`                   | `LN`                     |
| OBR.6     | Requested Date/Time         | `ServiceRequest.authoredOn`                                     | `20260329100000`         |
| OBR.16    | Ordering Provider           | Same as ORC.12                                                  | `7601001619241^Dede^Ersin` |
| OBR.24    | Diagnostic Service Section  | Hardcoded                                                       | `LAB`                    |
| OBR.25    | Result Status               | `ServiceRequest.status` → (see ORC.5 mapping)                   | `IP`                     |
| OBR.27    | Quantity/Timing             | `ServiceRequest.priority` (see mapping below)                   | `^^^20260329100000^^R`   |

### ServiceRequest.priority → OBR.27 Timing Mapping

| FHIR `ServiceRequest.priority` | HL7 OBR.27 priority component |
|--------------------------------|-------------------------------|
| `routine`                      | `R`                           |
| `urgent`                       | `S` (Stat)                    |
| `asap`                         | `A` (ASAP)                    |
| `stat`                         | `S` (Stat)                    |

---

## Complete ORM^O01 Example

Based on `Bundle.json` test data:

```
MSH|^~\&|ORDERENTRY|7601009336904|LIS|7601009336904|20260329100000||ORM^O01|order-1|P|2.5
PID|1||756.1234.5678.97^^^AHV~80756001234567890123^^^KVK||Arian^Farhad||19830214|M|||Forchstrasse 454^^Zollikon^^8702^CH|||+41791234567
PV1|1|O|ZLZ AG|||7601001619241^Dede^Ersin||||||||||||encounter-1||||||||||||||||||||||||20260329100000
IN1|1|KVG Grundversicherung|7601003001082^CSS Versicherung||||||||||||80756001234567890123
ORC|NW|order-1||||||IP|||20260329100000|7601001619241^Dede^Ersin^^^^^^^^GLN||ZLZ AG|Forchstrasse 454^^Zollikon^^8702^CH
OBR|1|order-1||1988-5^CRP Analyse^LN|||20260329100000||||||||7601001619241^Dede^Ersin||||||||LAB||IP|||^^^20260329100000^^R
```

---

## Reference: OID Systems Used

| OID                             | System                          | Used In                    |
|---------------------------------|---------------------------------|----------------------------|
| `urn:oid:2.51.1.3`              | Swiss GLN (Global Location Nr)  | Organization, Practitioner |
| `urn:oid:2.16.756.5.32`         | Swiss AHV Number                | Patient.identifier         |
| `urn:oid:2.16.756.5.30.1.123.1.1` | Swiss KVK Insurance Card      | Patient.identifier, Coverage |
| `http://loinc.org`              | LOINC codes                     | ServiceRequest.code        |

---

## Notes

- **GLN** (Global Location Number, OID `2.51.1.3`) is the Swiss identifier for organizations and practitioners — used in MSH.4, ORC.12, ORC.21
- **AHV** number is the Swiss social security number — primary patient identifier in PID.2
- **KVK** is the insurance card number — used in PID.3 and IN1.36
- Orchestra resolves `PractitionerRole` → `Practitioner` and `Organization` via FHIR GET calls to HAPI before building the ORM message
- If `ServiceRequest.identifier` is present it takes precedence over `ServiceRequest.id` for ORC.2 / OBR.2
