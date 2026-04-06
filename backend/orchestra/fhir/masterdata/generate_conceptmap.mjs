// generate_conceptmap.mjs — generates ConceptMap_zlz-snomed-zu-material.json
// Run: node generate_conceptmap.mjs

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = resolve(__dirname, "../MapingCode");

// =============================================================================
// SNOMED CT mapping for all 107 ZLZ material codes (specimen_additionalinfo)
// Source: MASTERDATA_fromLIS.xml → specimenname.de
// Equivalence "subsumes": SNOMED code is the superordinate concept of the ZLZ material
// =============================================================================
const SNOMED = {
  "01": { code: "119364003", display: "Serum specimen (specimen)" },
  "02": { code: "119361005", display: "Plasma specimen (specimen)" },
  "03": { code: "445295009", display: "Blood specimen with EDTA (specimen)" },
  "04": { code: "119361005", display: "Plasma specimen (specimen)" },
  "05": { code: "445295009", display: "Blood specimen with EDTA (specimen)" },
  "06": { code: "420135007", display: "Whole blood (substance)" },
  "07": { code: "122575003", display: "Urine specimen (specimen)" },
  "08": { code: "258455001", display: "Fluid specimen (specimen)" },
  "09": { code: "258455001", display: "Fluid specimen (specimen)" },
  "10": { code: "258450006", display: "Cerebrospinal fluid specimen (specimen)" },
  "11": { code: "258450006", display: "Cerebrospinal fluid specimen (specimen)" },
  "12": { code: "258455001", display: "Fluid specimen (specimen)" },
  "13": { code: "258455001", display: "Fluid specimen (specimen)" },
  "14": { code: "119361005", display: "Plasma specimen (specimen)" },
  "15": { code: "420135007", display: "Whole blood (substance)" },
  "16": { code: "119339001", display: "Stool specimen (specimen)" },
  "17": { code: "420135007", display: "Whole blood (substance)" },
  "18": { code: "420135007", display: "Whole blood (substance)" },
  "20": { code: "119362003", display: "Erythrocyte specimen (specimen)" },
  "22": { code: "119362003", display: "Erythrocyte specimen (specimen)" },
  "24": { code: "258450006", display: "Cerebrospinal fluid specimen (specimen)" },
  "25": { code: "418566009", display: "Blood smear (specimen)" },
  "26": { code: "119364003", display: "Serum specimen (specimen)" },
  "27": { code: "119364003", display: "Serum specimen (specimen)" },
  "29": { code: "119364003", display: "Serum specimen (specimen)" },
  "30": { code: "119364003", display: "Serum specimen (specimen)" },
  "31": { code: "119364003", display: "Serum specimen (specimen)" },
  "32": { code: "119364003", display: "Serum specimen (specimen)" },
  "33": { code: "122554006", display: "Cord blood specimen (specimen)" },
  "35": { code: "119364003", display: "Serum specimen (specimen)" },
  "36": { code: "119346000", display: "Amniotic fluid specimen (specimen)" },
  "37": { code: "445295009", display: "Blood specimen with EDTA (specimen)" },
  "43": { code: "119361005", display: "Plasma specimen (specimen)" },
  "44": { code: "445295009", display: "Blood specimen with EDTA (specimen)" },
  "45": { code: "445295009", display: "Blood specimen with EDTA (specimen)" },
  "46": { code: "119361005", display: "Plasma specimen (specimen)" },
  "47": { code: "119364003", display: "Serum specimen (specimen)" },
  "48": { code: "119364003", display: "Serum specimen (specimen)" },
  "49": { code: "119361005", display: "Plasma specimen (specimen)" },
  "50": { code: "445295009", display: "Blood specimen with EDTA (specimen)" },
  "51": { code: "445295009", display: "Blood specimen with EDTA (specimen)" },
  "52": { code: "420135007", display: "Whole blood (substance)" },
  "54": { code: "122575003", display: "Urine specimen (specimen)" },
  "55": { code: "420135007", display: "Whole blood (substance)" },
  "56": { code: "447154002", display: "Blood culture specimen (specimen)" },
  "57": { code: "119361005", display: "Plasma specimen (specimen)" },
  "58": { code: "420135007", display: "Whole blood (substance)" },
  "59": { code: "420135007", display: "Whole blood (substance)" },
  "60": { code: "257861003", display: "Swab specimen (specimen)" },
  "62": { code: "258455001", display: "Fluid specimen (specimen)" },
  "63": { code: "258452001", display: "Biopsy specimen (specimen)" },
  "64": { code: "257630004", display: "Calculus specimen (specimen)" },
  "65": { code: "119342007", display: "Saliva specimen (specimen)" },
  "66": { code: "258455001", display: "Fluid specimen (specimen)" },
  "75": { code: "122575003", display: "Urine specimen (specimen)" },
  "76": { code: "276833005", display: "24-hour urine specimen (specimen)" },
  "77": { code: "276833005", display: "24-hour urine specimen (specimen)" },
  "78": { code: "276833005", display: "24-hour urine specimen (specimen)" },
  "80": { code: "122575003", display: "Urine specimen (specimen)" },
  "83": { code: "420135007", display: "Whole blood (substance)" },
  "84": { code: "421399002", display: "Erythrocyte-poor plasma specimen (specimen)" },
  "86": { code: "447154002", display: "Blood culture specimen (specimen)" },
  "91": { code: "258500001", display: "Nasopharyngeal swab (specimen)" },
  "95": { code: "276833005", display: "24-hour urine specimen (specimen)" },
  "96": { code: "119361005", display: "Plasma specimen (specimen)" },
  "97": { code: "420135007", display: "Whole blood (substance)" },
  "98": { code: "257861003", display: "Swab specimen (specimen)" },
  "A1": { code: "258543008", display: "Exhaled air specimen (specimen)" },
  "AA": { code: "257863000", display: "Swab specimen from eye (specimen)" },
  "AB": { code: "258462009", display: "Vesicle swab (specimen)" },
  "AC": { code: "430229002", display: "Swab from vaginal fornix (specimen)" },
  "AE": { code: "258468009", display: "Swab from wound (specimen)" },
  "AH": { code: "258435002", display: "Skin scraping specimen (specimen)" },
  "AR": { code: "430229002", display: "Rectal swab (specimen)" },
  "AT": { code: "119398005", display: "Specimen from trachea (specimen)" },
  "AU": { code: "258499004", display: "Urethral swab (specimen)" },
  "AV": { code: "430229002", display: "Recto-vaginal swab (specimen)" },
  "AW": { code: "258468009", display: "Swab from wound (specimen)" },
  "BA": { code: "258607008", display: "Bronchoalveolar lavage fluid specimen (specimen)" },
  "DP": { code: "258455001", display: "Fluid specimen (specimen)" },
  "FM": { code: "258528007", display: "Implant specimen (specimen)" },
  "GP": { code: "441695006", display: "Synovial fluid specimen (specimen)" },
  "HA": { code: "257910001", display: "Hair specimen (specimen)" },
  "KS": { code: "258435002", display: "Skin scraping specimen (specimen)" },
  "L1": { code: "258450006", display: "Cerebrospinal fluid specimen (specimen)" },
  "LP": { code: "258580003", display: "Lymph node biopsy specimen (specimen)" },
  "NA": { code: "258448003", display: "Nail specimen (specimen)" },
  "P1": { code: "258455001", display: "Fluid specimen (specimen)" },
  "PE": { code: "258499004", display: "Urethral swab (specimen)" },
  "PP": { code: "418564007", display: "Pleural fluid specimen (specimen)" },
  "PR": { code: "446252009", display: "Prostate fluid specimen (specimen)" },
  "PW": { code: "119339001", display: "Stool specimen (specimen)" },
  "Q1": { code: "420135007", display: "Whole blood (substance)" },
  "Q2": { code: "420135007", display: "Whole blood (substance)" },
  "Q3": { code: "420135007", display: "Whole blood (substance)" },
  "Q4": { code: "420135007", display: "Whole blood (substance)" },
  "RN": { code: "258500001", display: "Nasopharyngeal swab (specimen)" },
  "RT": { code: "258530009", display: "Throat swab (specimen)" },
  "SE": { code: "258508009", display: "Seminal fluid specimen (specimen)" },
  "SH": { code: "258435002", display: "Skin scraping specimen (specimen)" },
  "SP": { code: "119334006", display: "Sputum specimen (specimen)" },
  "U1": { code: "122575003", display: "Urine specimen (specimen)" },
  "U2": { code: "122575003", display: "Urine specimen (specimen)" },
  "U3": { code: "122575003", display: "Urine specimen (specimen)" },
  "U4": { code: "122579009", display: "Catheterized urine specimen (specimen)" },
  "U5": { code: "122579009", display: "Catheterized urine specimen (specimen)" },
  "VI": null, // Virtuelles Material — kein SNOMED-Äquivalent
};

// Load display names from existing CodeSystem
const cs = JSON.parse(readFileSync(resolve(BASE, "CodeSystem_zlz-material-codes.json"), "utf8"));
const matNames = {};
(cs.concept ?? []).forEach((c) => { matNames[c.code] = c.display; });

// Build ConceptMap elements
const elements = [];
const noMap = [];

for (const [matCode, snomed] of Object.entries(SNOMED)) {
  const display = matNames[matCode] ?? matCode;
  if (!snomed) {
    noMap.push({ code: matCode, display });
    continue;
  }
  elements.push({
    code: matCode,
    display,
    target: [
      {
        code: snomed.code,
        display: snomed.display,
        equivalence: "subsumes",
        comment:
          "Annäherung: SNOMED-Code ist das übergeordnete Konzept. " +
          "ZLZ-Material kann laborspezifische Zusatzinformationen enthalten (z.B. Temperatur, Antikoagulans).",
      },
    ],
  });
}

const today = new Date().toISOString().slice(0, 10);

const conceptMap = {
  resourceType: "ConceptMap",
  id: "zlz-snomed-zu-material",
  url: "https://zlz-zentrallabor.ch/fhir/ConceptMap/zlz-snomed-zu-material",
  version: "1.0.0",
  name: "ZlzSnomedZuMaterial",
  title: "ZLZ Material-Code zu SNOMED CT Specimen",
  status: "active",
  experimental: false,
  date: today,
  publisher: "ZLZ Zentrallabor AG",
  contact: [{ name: "ZLZ Zentrallabor AG", telecom: [{ system: "url", value: "https://www.zlz.ch" }] }],
  description:
    "Übersetzt ZLZ-interne Material-Codes (specimen_additionalinfo aus dem LIS) auf SNOMED CT Specimen-Konzepte.\n\n" +
    "WICHTIG — Barcode-Format im Labor:\n" +
    "  Auftrags-Barcode = Auftragsnummer + Leerzeichen + Material-Code\n" +
    "  Beispiel: Auftragsnummer 7004003000 + Material-Code 16 → Barcode '7004003000 16'\n" +
    "  Das LIS-System erkennt das Material anhand dieser kombinierten Barcode-Struktur.\n\n" +
    "Äquivalenz 'subsumes': Der SNOMED-Code ist Oberbegriff des ZLZ-Materials; ZLZ-Codes können " +
    "laborspezifische Details enthalten (Antikoagulans, Temperatur, Zeitpunkt).",
  purpose:
    "Wird von Orchestra/OIE Juno verwendet, um FHIR Specimen.type (SNOMED CT) auf den LIS-internen " +
    "Material-Code (specimen_additionalinfo) zu übersetzen und umgekehrt.",
  copyright: "ZLZ Zentrallabor AG, Forchstrasse 454, 8702 Zollikon",
  sourceUri: "https://zlz-zentrallabor.ch/fhir/CodeSystem/zlz-material-codes",
  targetUri: "http://snomed.info/sct",
  group: [
    {
      source: "https://zlz-zentrallabor.ch/fhir/CodeSystem/zlz-material-codes",
      sourceVersion: "1.0.0",
      target: "http://snomed.info/sct",
      targetVersion: "http://snomed.info/sct/900000000000207008",
      element: elements,
      unmapped: {
        mode: "fixed",
        code: "OTH",
        display: "Sonstiges Material — kein SNOMED CT Äquivalent definiert",
      },
    },
  ],
};

const outPath = resolve(BASE, "ConceptMap_zlz-snomed-zu-material.json");
writeFileSync(outPath, JSON.stringify(conceptMap, null, 2), "utf8");

console.log("Generated:", outPath);
console.log("  Mapped entries:", elements.length);
console.log("  No SNOMED (VI):", noMap.map((x) => x.code).join(", ") || "none");
