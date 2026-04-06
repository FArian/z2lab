# GLN Validation — RefData SOAP Integration

> **Commit:** `b0698c5` — *feat(gln): replace Orchestra REST with RefData SOAP client*

---

## Was wurde gebaut und warum?

### Ausgangslage (vorher)

Die GLN-Abfrage lief bisher über einen **Orchestra-Middleware-REST-Endpoint**:

```
GET http://orchestra:8019/middleware/gln/api/versionVal/refdata/partner/?GLN=xxx&UUID=yyy
→ JSON-Antwort (proprietäres Format)
```

**Probleme:**
- Abhängigkeit von Orchestra als Zwischenschicht — wenn Orchestra nicht läuft, keine GLN-Abfrage
- Proprietäres JSON-Format (nicht standardisiert)
- UUID-Parameter war unnötig komplex
- ENV-Variable `GLN_API_BASE` zeigte auf Orchestra, nicht auf RefData direkt

### Lösung (nachher)

Die GLN-Abfrage läuft jetzt **direkt gegen den offiziellen RefData SOAP-Service**:

```
POST https://refdatabase.refdata.ch/Service/Partner.asmx
→ SOAP/XML-Antwort (offizielle Schweizer Referenzdatenbank)
```

**Vorteile:**
- Keine Abhängigkeit von Orchestra
- Offizieller Schweizer Gesundheitsdatenstandard (GS1 / refdata.ch)
- SOAP ist der native Protokoll dieser Schnittstelle (kein Adapter nötig)
- Direkte Kontrolle über Timeout, Fehlerbehandlung, Logging

---

## Architektur

Die Implementierung folgt dem **Clean Architecture Adapter-Pattern**:

```
┌─────────────────────────────────────────────────────────────────┐
│  app/api/gln-lookup/route.ts   (API Route — dünn, kein Business)│
└────────────────────┬────────────────────────────────────────────┘
                     │ ruft auf
┌────────────────────▼────────────────────────────────────────────┐
│  infrastructure/gln/RefDataSoapClient.ts   (Adapter)            │
│  • baut SOAP-Envelope                                           │
│  • sendet HTTP POST mit AbortController (5s Timeout)            │
│  • wirft GlnNotFoundError / GlnLookupError                      │
└───────────┬─────────────────────────────────────────────────────┘
            │ parst XML
┌───────────▼──────────────────────────────────────────────┐
│  infrastructure/gln/RefDataXmlParser.ts   (Parser)        │
│  • fast-xml-parser (XXE-sicher)                           │
│  • navigiert SOAP-Envelope → Body → GLN_DETAILResult      │
│  • gibt RefDataItem (flaches Intermediate) zurück         │
└───────────┬──────────────────────────────────────────────┘
            │ mapped
┌───────────▼──────────────────────────────────────────────┐
│  infrastructure/gln/RefDataToDomainMapper.ts   (Mapper)   │
│  • NAT vs JUR Name-Logik                                  │
│  • gibt GlnLookupResult (Domain Entity) zurück            │
└───────────┬──────────────────────────────────────────────┘
            │ ist definiert in
┌───────────▼──────────────────────────────────────────────┐
│  domain/entities/GlnLookupResult.ts   (Domain Entity)     │
│  • reine TypeScript-Interface                             │
│  • kein Framework, kein fetch, kein process.env           │
└──────────────────────────────────────────────────────────┘
```

---

## SOAP-Protokoll

### Request

```http
POST https://refdatabase.refdata.ch/Service/Partner.asmx HTTP/1.1
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://refdatabase.refdata.ch/GLN_DETAIL"

<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:ref="http://refdatabase.refdata.ch/">
  <soap:Body>
    <ref:GLN_DETAIL>
      <ref:sGLN>7601000123456</ref:sGLN>
      <ref:sLang>DE</ref:sLang>
    </ref:GLN_DETAIL>
  </soap:Body>
</soap:Envelope>
```

**Parameter:**
| Feld | Wert | Bedeutung |
|---|---|---|
| `sGLN` | 13-stellige Ziffernfolge | Die zu suchende GLN |
| `sLang` | `DE` (fix) | Sprache für Beschriftungen |

### Response (Erfolg)

```xml
<soap:Envelope>
  <soap:Body>
    <GLN_DETAILResponse xmlns="http://refdatabase.refdata.ch/">
      <GLN_DETAILResult>
        <RESULT>
          <OK_ERROR>OK</OK_ERROR>
          <NBR_RECORD>1</NBR_RECORD>
        </RESULT>
        <ITEM>
          <PTYPE>NAT</PTYPE>           <!-- NAT = natürliche Person, JUR = juristische Person -->
          <GLN>7601000123456</GLN>
          <DESCR1>Müller</DESCR1>      <!-- NAT: Familienname | JUR: Organisationsname -->
          <DESCR2>Hans</DESCR2>        <!-- NAT: Vorname     | JUR: leer -->
          <ROLE>
            <TYPE>HPC</TYPE>           <!-- Rolle (HPC, ORG, …) -->
            <STREET>Bahnhofstrasse</STREET>
            <STRNO>1</STRNO>
            <ZIP>8001</ZIP>
            <CITY>Zürich</CITY>
            <CTN>ZH</CTN>             <!-- Kanton -->
            <CNTRY>CH</CNTRY>
          </ROLE>
        </ITEM>
      </GLN_DETAILResult>
    </GLN_DETAILResponse>
  </soap:Body>
</soap:Envelope>
```

### Response (nicht gefunden)

```xml
<RESULT>
  <OK_ERROR>ERROR</OK_ERROR>
  <NBR_RECORD>0</NBR_RECORD>
</RESULT>
```

---

## NAT vs JUR Namens-Logik

RefData kodiert Namen unterschiedlich je nach Personentyp (`PTYPE`):

| `PTYPE` | `DESCR1` | `DESCR2` | GlnLookupResult |
|---|---|---|---|
| `NAT` | Familienname | Vorname | `lastName = DESCR1`, `firstName = DESCR2`, `organization = ""` |
| `JUR` | Organisationsname | (leer) | `organization = DESCR1`, `lastName = ""`, `firstName = ""` |

Diese Logik ist in [RefDataToDomainMapper.ts](../../frontend/zetlab/src/infrastructure/gln/RefDataToDomainMapper.ts) isoliert.

---

## XML-Parsing — Sicherheit (XXE)

**XXE (XML External Entity Injection)** ist ein bekannter Angriff bei XML-Verarbeitung:
Ein präparierter XML-Response könnte lokale Dateien oder interne URLs auslesen.

Schutz durch `fast-xml-parser` mit diesen Optionen:

```typescript
new XMLParser({
  processEntities: false,   // ← keine externen Entities auflösen
  htmlEntities:    false,   // ← auch HTML-Entities deaktiviert
})
```

`fast-xml-parser` lädt standardmässig keine DTDs und startet keinen HTTP-Request für externe Entities — es ist damit XXE-sicher by default, und `processEntities: false` schliesst den letzten Spielraum.

### Namespace-robuste Navigation

Der XML-Parser navigiert den SOAP-Envelope **namespace-tolerant**:

```typescript
// Findet das Element unabhängig vom Namespace-Präfix
const responseKey = Object.keys(body).find((k) => k.includes("GLN_DETAILResponse"));
```

Dies ist notwendig weil RefData den Namespace-Präfix variieren kann (z.B. `ref:GLN_DETAILResponse` oder `GLN_DETAILResponse`).

---

## ROLE als Array oder Objekt

Die RefData API gibt `ROLE` manchmal als einzelnes Objekt und manchmal als Array zurück (wenn ein Partner mehrere Rollen hat). Der Parser behandelt beide Fälle:

```typescript
const rawRole = item["ROLE"];
const role = (Array.isArray(rawRole) ? rawRole[0] : rawRole ?? {}) as Record<string, unknown>;
```

Es wird immer die erste Rolle verwendet (Hauptrolle).

---

## Fehlerbehandlung

Zwei typisierte Fehlerklassen in [RefDataSoapClient.ts](../../frontend/zetlab/src/infrastructure/gln/RefDataSoapClient.ts):

| Fehlerklasse | Wann | HTTP-Status in API |
|---|---|---|
| `GlnNotFoundError` | `RESULT.OK_ERROR !== "OK"` | `404` + `{ error: "glnNotFound" }` |
| `GlnLookupError` | Netzwerkfehler, Timeout, HTTP non-2xx, Parse-Fehler | `502` + `{ error: "..." }` |

Die API-Route (`/api/gln-lookup`) fängt diese Fehler ab und gibt strukturierte JSON-Fehler zurück — keine rohen Strings, keine Stack Traces.

---

## Timeout

Standardmässig **5 Sekunden** via `AbortController`:

```typescript
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), this.timeoutMs); // 5000ms
```

Wenn RefData nicht antwortet, bricht der Request nach 5s ab → `GlnLookupError`.

---

## Betroffene Dateien

### Neu erstellt

| Datei | Schicht | Zweck |
|---|---|---|
| [domain/entities/GlnLookupResult.ts](../../frontend/zetlab/src/domain/entities/GlnLookupResult.ts) | Domain | Entity-Interface ohne Abhängigkeiten |
| [infrastructure/gln/RefDataXmlParser.ts](../../frontend/zetlab/src/infrastructure/gln/RefDataXmlParser.ts) | Infrastructure | SOAP-XML → RefDataItem (Intermediate) |
| [infrastructure/gln/RefDataToDomainMapper.ts](../../frontend/zetlab/src/infrastructure/gln/RefDataToDomainMapper.ts) | Infrastructure | RefDataItem → GlnLookupResult |
| [infrastructure/gln/RefDataSoapClient.ts](../../frontend/zetlab/src/infrastructure/gln/RefDataSoapClient.ts) | Infrastructure | HTTP SOAP Adapter |

### Geändert

| Datei | Änderung |
|---|---|
| [infrastructure/config/EnvConfig.ts](../../frontend/zetlab/src/infrastructure/config/EnvConfig.ts) | `glnApiBase` / `GLN_API_BASE` → `refdataSoapUrl` / `REFDATA_SOAP_URL` |
| [app/api/gln-lookup/route.ts](../../frontend/zetlab/src/app/api/gln-lookup/route.ts) | Komplette Neufassung — delegiert an `RefDataSoapClient` |
| [app/profile/page.tsx](../../frontend/zetlab/src/app/profile/page.tsx) | `lookupGln()` und `lookupOrgGln()` rufen jetzt `/api/gln-lookup` statt `/api/fhir/gln-search` |

---

## ENV-Konfiguration

| Variable | Default | Bedeutung |
|---|---|---|
| `REFDATA_SOAP_URL` | `https://refdatabase.refdata.ch/Service/Partner.asmx` | RefData SOAP-Endpoint |

Für **Staging / Mock** kann ein lokaler SOAP-Server (z.B. SoapUI MockService) gesetzt werden:

```env
REFDATA_SOAP_URL=http://localhost:8088/MockRefData
```

**Nicht mehr verwendet (entfernt):**
- `GLN_API_BASE` — war der Orchestra-Middleware-URL

---

## API-Endpunkt

```
GET /api/gln-lookup?gln={13-stellige-GLN}
```

**Authentifizierung:** Session-Cookie erforderlich (401 ohne Session)

**Erfolg (200):**
```json
{
  "gln":          "7601000123456",
  "ptype":        "NAT",
  "roleType":     "HPC",
  "organization": "",
  "lastName":     "Müller",
  "firstName":    "Hans",
  "street":       "Bahnhofstrasse",
  "streetNo":     "1",
  "zip":          "8001",
  "city":         "Zürich",
  "canton":       "ZH",
  "country":      "CH"
}
```

**Fehler:**
| Status | `error` | Bedeutung |
|---|---|---|
| `400` | `"invalidGln"` | GLN nicht 13-stellig |
| `401` | `"Unauthorized"` | Keine Session |
| `404` | `"glnNotFound"` | GLN nicht in RefData vorhanden |
| `502` | `"SOAP request failed: ..."` | Netzwerkfehler / Timeout |
| `503` | `"noGlnApi"` | `REFDATA_SOAP_URL` nicht konfiguriert |

---

## Warum kein WSDL-Client?

Die RefData WSDL (`https://refdatabase.refdata.ch/Service/Partner.asmx?WSDL`) definiert mehrere Operationen. Wir verwenden genau **eine**: `GLN_DETAIL`.

Ein vollständiger WSDL-Client (`soap` npm-Paket) würde:
- ~1 MB zusätzliche Abhängigkeiten bringen
- WSDL zur Laufzeit herunterladen (langsam, fragil)
- Deutlich mehr Komplexität erzeugen

**Stattdessen:** Manuell erstellter SOAP-Envelope für genau diese eine Operation. Das ist in diesem Kontext die robustere und wartbarere Lösung.

---

## Abhängigkeiten

| Paket | Version | Zweck |
|---|---|---|
| `fast-xml-parser` | `^4.x` | XXE-sicheres XML-Parsing |

`fast-xml-parser` wurde gewählt weil:
- Kein `DOMParser` in Node.js (nur im Browser verfügbar)
- Keine nativen XML-APIs in Node.js ohne externe Pakete
- `fast-xml-parser` ist gängig, klein, TypeScript-nativ, XXE-sicher
