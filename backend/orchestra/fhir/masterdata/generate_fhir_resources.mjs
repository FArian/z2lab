/**
 * Generiert FHIR-Terminologie-Ressourcen aus MASTERDATA_fromLIS.xml
 *
 * Output-Dateien (in backend/orchestra/fhir/MapingCode/):
 *   CodeSystem_zlz-material-codes.json
 *   CodeSystem_zlz-lis-test-codes.json
 *   ValueSet_zlz-aktive-labor-tests.json
 *   ValueSet_zlz-aktive-mibi-tests.json
 *   ValueSet_zlz-aktive-tests.json  (alle)
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir   = dirname(fileURLToPath(import.meta.url));
const xmlPath = join(__dir, "MASTERDATA_fromLIS.xml");
const outDir  = join(__dir, "..", "MapingCode");

mkdirSync(outDir, { recursive: true });

// ── XML parsen (ohne externe Bibliothek) ──────────────────────────────────

const xml = readFileSync(xmlPath, "utf-8");

// Alle <oetsts_entry> Elemente extrahieren
const entryRegex = /<oetsts_entry(?:\s+mode="([^"]*)")?>([\s\S]*?)<\/oetsts_entry>/g;

function getTag(str, tag) {
  const m = str.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`));
  return m ? m[1].trim() : "";
}

function getLangTag(str, tag, lang) {
  const block = str.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  if (!block) return "";
  const m = block[1].match(new RegExp(`<${lang}>([^<]*)<\\/${lang}>`));
  return m ? m[1].trim() : "";
}

const entries = [];
let m;
while ((m = entryRegex.exec(xml)) !== null) {
  const mode    = m[1];
  const body    = m[2];
  const code    = getTag(body, "code");
  const site    = getTag(body, "site");
  const status  = getTag(body, "status");
  const pu      = getTag(body, "PU");
  const label   = getTag(body, "label");
  const specCode= getTag(body, "specimen_additionalinfo");
  const specDe  = getLangTag(body, "specimenname", "de");
  const shortDe = getLangTag(body, "shorttext", "de");
  const shortEn = getLangTag(body, "shorttext", "en");
  const volume  = getTag(body, "volume");

  if (code && status === "1") {
    entries.push({ code, site: site || mode, pu, label, specCode, specDe, shortDe, shortEn, volume });
  }
}

console.log(`✅ ${entries.length} aktive Einträge gelesen`);

// ── 1. Material-CodeSystem ────────────────────────────────────────────────

const specimenMap = new Map();
for (const e of entries) {
  if (e.specCode && !specimenMap.has(e.specCode)) {
    specimenMap.set(e.specCode, { de: e.specDe, count: 0 });
  }
  if (e.specCode) specimenMap.get(e.specCode).count++;
}

const materialCS = {
  resourceType: "CodeSystem",
  id:           "zlz-material-codes",
  url:          "https://www.zetlab.ch/fhir/specimen-types",
  name:         "ZLZMaterialCodes",
  title:        "ZLZ Material-Codes (Probentypen)",
  status:       "active",
  content:      "complete",
  description:  "Interne Material-Codes des ZLZ Zentrallabor AG aus Labsoft LIS. Entspricht BARCODE_ZUSATZ.",
  count:        specimenMap.size,
  concept:      [...specimenMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([code, val]) => ({
      code,
      display:    val.de || code,
      definition: `Wird von ${val.count} Test(s) verwendet.`
    }))
};

writeFileSync(join(outDir, "CodeSystem_zlz-material-codes.json"), JSON.stringify(materialCS, null, 2));
console.log(`✅ CodeSystem_zlz-material-codes.json  (${specimenMap.size} Codes)`);

// ── 2. Test-CodeSystem ────────────────────────────────────────────────────

const testCS = {
  resourceType: "CodeSystem",
  id:           "zlz-lis-test-codes",
  url:          "https://www.zetlab.ch/lis/codes",
  name:         "ZLZLisTestCodes",
  title:        "ZLZ LIS Test-Codes",
  status:       "active",
  content:      "complete",
  description:  "Interne LIS Test-Codes des ZLZ Zentrallabor AG. Alle aktiven Tests aus Labsoft.",
  count:        entries.length,
  property: [
    { code: "site",     uri: "https://www.zetlab.ch/fhir/category",             description: "Kategorie (LABOR / MIBI)",        type: "code" },
    { code: "pu",       uri: "https://www.zetlab.ch/fhir/groups-observation",   description: "Befundgruppe (PU)",               type: "code" },
    { code: "specimen", uri: "https://www.zetlab.ch/fhir/specimen-types",       description: "Material-Code",                   type: "code" }
  ],
  concept: entries.map(e => {
    const c = {
      code:       e.code,
      display:    e.label || e.shortDe || e.code,
      definition: e.specDe ? `Material: ${e.specDe}` : undefined,
      property:   [
        { code: "site",     valueCode: e.site },
        { code: "pu",       valueCode: e.pu },
        { code: "specimen", valueCode: e.specCode }
      ].filter(p => p.valueCode)
    };
    if (!c.definition) delete c.definition;
    return c;
  })
};

writeFileSync(join(outDir, "CodeSystem_zlz-lis-test-codes.json"), JSON.stringify(testCS, null, 2));
console.log(`✅ CodeSystem_zlz-lis-test-codes.json  (${entries.length} Codes)`);

// ── 3. ValueSets ──────────────────────────────────────────────────────────

function makeValueSet(id, title, description, filterEntries) {
  return {
    resourceType: "ValueSet",
    id,
    url:          `https://www.zetlab.ch/fhir/ValueSet/${id}`,
    name:         id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
    title,
    status:       "active",
    description,
    compose: {
      include: [{
        system:  "https://www.zetlab.ch/lis/codes",
        concept: filterEntries.map(e => ({
          code:        e.code,
          display:     e.label || e.shortDe || e.code
        }))
      }]
    }
  };
}

// Alle aktiven Tests
const vsAll = makeValueSet(
  "zlz-aktive-tests",
  "ZLZ — Alle aktiven Tests",
  "Alle aktiven, bestellbaren Tests des ZLZ Zentrallabor AG.",
  entries
);
writeFileSync(join(outDir, "ValueSet_zlz-aktive-tests.json"), JSON.stringify(vsAll, null, 2));
console.log(`✅ ValueSet_zlz-aktive-tests.json       (${entries.length} Einträge)`);

// LABOR Tests
const laborEntries = entries.filter(e => e.site === "LABOR");
const vsLabor = makeValueSet(
  "zlz-aktive-labor-tests",
  "ZLZ — Aktive Labor-Tests",
  "Alle aktiven Labortests (Klinische Chemie, Hämatologie, Gerinnung, Serologie etc.).",
  laborEntries
);
writeFileSync(join(outDir, "ValueSet_zlz-aktive-labor-tests.json"), JSON.stringify(vsLabor, null, 2));
console.log(`✅ ValueSet_zlz-aktive-labor-tests.json (${laborEntries.length} Einträge)`);

// MIBI Tests
const mibiEntries = entries.filter(e => e.site === "MIBI");
const vsMibi = makeValueSet(
  "zlz-aktive-mibi-tests",
  "ZLZ — Aktive Mikrobiologie-Tests",
  "Alle aktiven mikrobiologischen Tests (Abstrich, Bakteriologie, PCR, Virologie).",
  mibiEntries
);
writeFileSync(join(outDir, "ValueSet_zlz-aktive-mibi-tests.json"), JSON.stringify(vsMibi, null, 2));
console.log(`✅ ValueSet_zlz-aktive-mibi-tests.json  (${mibiEntries.length} Einträge)`);

// ValueSets pro PU (Befundgruppe)
const puGroups = {};
for (const e of entries) {
  if (e.pu) {
    if (!puGroups[e.pu]) puGroups[e.pu] = [];
    puGroups[e.pu].push(e);
  }
}

const puNames = {
  "RISCH":    "Routine Chemie",
  "KC":       "Klinische Chemie",
  "RISCHMB":  "Mikrobiologie Routine",
  "HÄMA":     "Hämatologie",
  "BB":       "Blutbild",
  "SERO":     "Serologie / Immunologie",
  "BAK/MYKO": "Bakteriologie / Mykologie",
  "GER":      "Gerinnung"
};

for (const [pu, puEntries] of Object.entries(puGroups)) {
  const safeId = `zlz-tests-${pu.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  const title  = `ZLZ — ${puNames[pu] || pu}`;
  const vs = makeValueSet(safeId, title, `Tests der Befundgruppe ${pu}.`, puEntries);
  writeFileSync(join(outDir, `ValueSet_${safeId}.json`), JSON.stringify(vs, null, 2));
  console.log(`✅ ValueSet_${safeId}.json  (${puEntries.length} Einträge)`);
}

console.log("\n🎉 Alle FHIR-Terminologie-Ressourcen erfolgreich generiert.");
console.log(`   Ausgabe: ${outDir}`);

// ── 4. ActivityDefinition + SpecimenDefinition + ObservationDefinition ────────
//
// Generiert pro PU-Gruppe ein Transaction-Bundle mit:
//   - ActivityDefinition   (actdef-{CODE})
//   - ObservationDefinition (obsdef-{CODE})
// Dazu ein separates Bundle mit allen SpecimenDefinitions.
//
// Ausgabe: masterdata/generated/

const genDir = join(__dir, "generated");
mkdirSync(genDir, { recursive: true });

const LAB_ORG_ID = "zlz";

// SNOMED-Codes für bekannte Probentypen
const SPECIMEN_SNOMED = {
  "01": { code: "119364003", display: "Serum specimen (specimen)" },
  "02": { code: "119361006", display: "Platelet poor plasma specimen (specimen)" },
  "03": { code: "445295009", display: "Blood specimen with EDTA (specimen)" },
  "04": { code: "119361006", display: "Platelet poor plasma specimen (specimen)" },
  "05": { code: "119361006", display: "Platelet poor plasma specimen (specimen)" },
  "06": { code: "119297000", display: "Blood specimen (specimen)" },
  "07": { code: "122575003", display: "Urine specimen (specimen)" },
  "08": { code: "122571007", display: "Specimen from body cavity (specimen)" },
  "09": { code: "122571007", display: "Specimen from body cavity (specimen)" },
  "10": { code: "258450006", display: "Cerebrospinal fluid specimen (specimen)" },
  "11": { code: "258450006", display: "Cerebrospinal fluid specimen (specimen)" },
  "12": { code: "122571007", display: "Specimen from body cavity (specimen)" },
  "13": { code: "122571007", display: "Specimen from body cavity (specimen)" },
  "14": { code: "119361006", display: "Platelet poor plasma specimen (specimen)" },
  "15": { code: "119297000", display: "Blood specimen (specimen)" },
  "16": { code: "119339001", display: "Stool specimen (specimen)" },
  "17": { code: "420135007", display: "Whole blood specimen (specimen)" },
  "18": { code: "420135007", display: "Whole blood specimen (specimen)" },
  "25": { code: "726551006", display: "Blood smear specimen (specimen)" },
  "36": { code: "119373006", display: "Amniotic fluid specimen (specimen)" },
  "56": { code: "447154002", display: "Specimen from blood culture (specimen)" },
  "60": { code: "257261003", display: "Swab specimen (specimen)" },
  "63": { code: "309072003", display: "Tissue specimen (specimen)" },
  "65": { code: "119342007", display: "Saliva specimen (specimen)" },
  "77": { code: "122575003", display: "Urine specimen (specimen)" },
  "78": { code: "122575003", display: "Urine specimen (specimen)" },
  "80": { code: "122575003", display: "Urine specimen (specimen)" },
  "86": { code: "447154002", display: "Specimen from blood culture (specimen)" },
  "91": { code: "258500001", display: "Nasopharyngeal swab (specimen)" },
  "97": { code: "258443003", display: "Blood specimen for culture (specimen)" },
  "98": { code: "123038009", display: "Specimen (specimen)" },
  "AA": { code: "119399004", display: "Specimen from eye (specimen)" },
  "AB": { code: "257261003", display: "Swab specimen (specimen)" },
  "AC": { code: "119378002", display: "Cervix specimen (specimen)" },
  "AE": { code: "119323008", display: "Pus specimen (specimen)" },
  "AH": { code: "119325001", display: "Tissue specimen from skin (specimen)" },
  "AR": { code: "119393003", display: "Specimen from anus (specimen)" },
  "AT": { code: "119398005", display: "Specimen from trachea (specimen)" },
  "AU": { code: "122591003", display: "Urethral specimen (specimen)" },
  "AV": { code: "119393003", display: "Specimen from anus (specimen)" },
  "AW": { code: "119323008", display: "Pus specimen (specimen)" },
  "BA": { code: "258607008", display: "Bronchoalveolar lavage fluid specimen (specimen)" },
  "DP": { code: "122571007", display: "Specimen from body cavity (specimen)" },
  "GP": { code: "119380003", display: "Fluid specimen from joint (specimen)" },
  "LP": { code: "258450006", display: "Cerebrospinal fluid specimen (specimen)" },
  "PP": { code: "418564007", display: "Pleural fluid specimen (specimen)" },
  "RN": { code: "258500001", display: "Nasopharyngeal swab (specimen)" },
  "RT": { code: "258529004", display: "Throat swab (specimen)" },
  "SE": { code: "119371008", display: "Semen specimen (specimen)" },
  "SP": { code: "119334006", display: "Sputum specimen (specimen)" },
  "U1": { code: "122575003", display: "Urine specimen (specimen)" },
  "U2": { code: "122575003", display: "Urine specimen (specimen)" },
  "U3": { code: "122575003", display: "Urine specimen (specimen)" },
  "U4": { code: "122575003", display: "Urine specimen (specimen)" },
  "U5": { code: "122575003", display: "Urine specimen (specimen)" },
};
const SNOMED_DEFAULT = { code: "123038009", display: "Specimen (specimen)" };

function makeSpecimenDefinitionEntry(specCode, specDe) {
  const snomed = SPECIMEN_SNOMED[specCode] || SNOMED_DEFAULT;
  const resource = {
    resourceType: "SpecimenDefinition",
    id: `specdef-${specCode}`,
    identifier: { system: "https://www.zetlab.ch/fhir/specimen", value: specCode },
    typeCollected: {
      coding: [
        { system: "https://www.zetlab.ch/fhir/specimen-types", code: specCode, display: specDe || specCode },
        { system: "http://snomed.info/sct", code: snomed.code, display: snomed.display }
      ],
      text: specDe || specCode
    },
    typeTested: [{
      preference: "preferred",
      container: { description: specDe || specCode },
      rejectionCriterion: [{
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/rejection-criteria", code: "INSUFFICIENT", display: "Insufficient quantity" }],
        text: "Unzureichende Probenmenge"
      }],
      handling: [{
        temperatureQualifier: {
          coding: [{ system: "http://terminology.hl7.org/CodeSystem/handling-condition", code: "room", display: "Room Temperature" }],
          text: "Raumtemperatur"
        },
        maxDuration: { value: 24, unit: "h", system: "http://unitsofmeasure.org", code: "h" },
        instruction: "Schnellstmöglich ins Labor senden. Nicht einfrieren."
      }]
    }]
  };
  return { resource, request: { method: "PUT", url: `SpecimenDefinition/specdef-${specCode}` } };
}

function makeActivityDefinitionEntry(e) {
  const topicCode    = e.site === "MIBI" ? "MIBI" : "Routine";
  const topicDisplay = e.site === "MIBI" ? "Mikrobiologie" : "Routine";
  const puLabel      = puNames[e.pu] || e.pu || "Allgemein";
  const label        = e.label || e.shortDe || e.code;

  const extensions = [];
  const volNum = e.volume ? parseFloat(e.volume) : NaN;
  if (!isNaN(volNum) && volNum > 0) {
    extensions.push({
      url: "https://www.zetlab.ch/fhir/StructureDefinition/minimal-volume-microliter",
      valueQuantity: { value: volNum, unit: "µl", system: "http://unitsofmeasure.org", code: "uL" }
    });
  }
  if (e.specCode) {
    extensions.push({
      url: "https://www.zetlab.ch/StructureDefinition/specimen-definition",
      valueReference: { identifier: { system: "https://www.zetlab.ch/fhir/specimen", value: e.specCode } }
    });
  }

  const resource = {
    resourceType: "ActivityDefinition",
    id: `actdef-${e.code}`,
    ...(extensions.length > 0 ? { extension: extensions } : {}),
    url: `https://www.zetlab.ch/fhir/activity/${e.code}`,
    subtitle: label,
    status: "active",
    description: puLabel,
    useContext: [{
      code: { system: "http://terminology.hl7.org/CodeSystem/usage-context-type", code: "facility" },
      valueReference: { reference: `Organization/${LAB_ORG_ID}` }
    }],
    topic: [{ coding: [{ system: "https://www.zetlab.ch/fhir/category", code: topicCode, display: topicDisplay }] }],
    kind: "ServiceRequest",
    code: { coding: [{ system: "https://www.zetlab.ch/lis/codes", code: e.code, display: label }] },
    location: { identifier: { system: "https://www.zetlab.ch/fhir/groups-observation", value: e.pu } }
  };
  return { resource, request: { method: "PUT", url: `ActivityDefinition/actdef-${e.code}` } };
}

function makeObservationDefinitionEntry(e) {
  const label = e.label || e.shortDe || e.code;
  const resource = {
    resourceType: "ObservationDefinition",
    id: `obsdef-${e.code}`,
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "laboratory", display: "Laboratory" }] }],
    code: { coding: [{ system: "https://www.zetlab.ch/lis/codes", code: e.code, display: label }], text: label },
    identifier: [{ system: "https://www.zetlab.ch/lis/codes", value: e.code }],
    ...(e.shortEn ? { preferredReportName: e.shortEn } : {})
  };
  return { resource, request: { method: "PUT", url: `ObservationDefinition/obsdef-${e.code}` } };
}

// ── 4a. SpecimenDefinitions Bundle ───────────────────────────────────────────

const sdEntries = [...specimenMap.entries()].map(([code, val]) =>
  makeSpecimenDefinitionEntry(code, val.de)
);
const sdBundle = { resourceType: "Bundle", type: "transaction", entry: sdEntries };
writeFileSync(join(genDir, "Bundle_specdef-all.json"), JSON.stringify(sdBundle, null, 2));
console.log(`\n✅ generated/Bundle_specdef-all.json  (${sdEntries.length} SpecimenDefinitions)`);

// ── 4b. ActivityDefinition + ObservationDefinition Bundles pro PU-Gruppe ─────

let totalAD = 0;
for (const [pu, puEntries] of Object.entries(puGroups)) {
  const safeId = pu.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const adEntries = [];
  for (const e of puEntries) {
    adEntries.push(makeActivityDefinitionEntry(e));
    adEntries.push(makeObservationDefinitionEntry(e));
  }
  const bundle = { resourceType: "Bundle", type: "transaction", entry: adEntries };
  writeFileSync(join(genDir, `Bundle_catalog-${safeId}.json`), JSON.stringify(bundle, null, 2));
  console.log(`✅ generated/Bundle_catalog-${safeId}.json  (${puEntries.length} Tests, ${adEntries.length} Ressourcen)`);
  totalAD += puEntries.length;
}

console.log(`\n🎉 ActivityDefinition-Bundles: ${totalAD} Tests generiert.`);
console.log(`   Ausgabe: ${genDir}`);
