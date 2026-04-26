---
name: z2Lab Bridge
description: Geplantes Go-Binary, das als Brücke zwischen Cloud (OrderEntry/Orchestra/HAPI) und lokalen Klinik-/Praxis-Systemen läuft — übernimmt HL7-Datenaustausch (ADT/ORU), lokalen Druck (PDF Begleitschein + ZPL Barcode) und Print-Job-Verteilung im LAN. Ergänzt OrderEntry, ist aber separates Projekt. Vorher "ZetLab Local Agent" — siehe bridge_naming.md.
type: project
---

**Was die Bridge ist:**
Lokaler Daemon (Windows Service / systemd / LaunchAgent / Docker), der via HTTPS outbound-only mit der Cloud spricht. Polling-basiert — Cloud öffnet nie Verbindung ins lokale Netz. GLN-identifiziert pro Klinik (API-Key → FHIR Organization).

**Drei Hauptaufgaben:**
1. **ADT** — Directory Watcher liest HL7-Patientendaten aus PIS/KIS und postet an `/api/v1/proxy/hl7/inbound`
2. **Druck** — Pollt `/api/v1/bridge/jobs`, druckt Begleitschein (PDF→CUPS/WinPrint) und Barcode-Etikette (ZPL→TCP:9100)
3. **ORU** — Holt Laborbefunde via `/api/v1/proxy/hl7/outbound` und legt sie als Datei für PIS/KIS ab

**Why:** Kliniken/Praxen können keine Inbound-Verbindungen erlauben (Firewall, IT-Policy). Cloud-Drucker scheiden für Zebra/Dymo-Etiketten oft aus. Orchestra ist der einzige HL7↔FHIR-Konverter — die Bridge darf kein HL7 parsen, nur transportieren.

**Aktueller Stand (Stand 2026-04-26):**
- ✅ Cloud-seitige API-Routes da: `/api/v1/bridge/{status,token,jobs,register}`, `/api/v1/admin/bridges`, `/api/v1/proxy/hl7/{inbound,outbound}`, FHIR-Proxy-Routes
- ✅ Browser-seitiger Druck fertig (`useOrderDocuments.ts` — Begleitschein-HTML, Barcode via JsBarcode)
- ✅ Admin-UI-Stub `/admin/bridges` (BridgesPage.tsx — voll funktional: Liste, Register, Revoke, Delete)
- ✅ DB-Schema: `BridgeJob` + `BridgeRegistration` (Flyway V3 + V8 in sqlite/postgresql/sqlserver)
- ✅ Print-Job-Queue server-seitig komplett: POST /jobs/print, GET /jobs (Polling), POST /jobs/[id]/done
- ✅ ZPL-Generierung server-seitig (CODE128, Format `{orderNumber} {materialCode}`)
- ✅ OrderCreatePage erstellt automatisch Print-Jobs nach Auftragserfassung
- ❌ Go-Binary noch nicht implementiert
- ❌ Orchestra ADT-Szenario fehlt (nur ORM vorhanden)
- ⚠️ OFFEN: Routing Practitioner→Abteilung→Bridge via PractitionerRole.location? Broadcast vs. gezielt?

**Tech-Entscheidungen (bereits getroffen):**
- Sprache: Go (single binary, alle Plattformen)
- Packages: cobra (CLI), fsnotify (Watcher), modernc.org/sqlite (kein CGO), log/slog
- Kein HTTP-Server-Framework — Bridge ist Client; nur minimaler Health-Endpoint auf 127.0.0.1:7890
- Config: YAML + ENV Override (ENV gewinnt)
- Auto-Update: Bridge prüft selbst beim Status-Poll, lädt Binary von GitHub Releases, SHA-256-Checksum
- Plattformen: Windows, Linux (amd64+arm64), macOS (Intel+M1), Docker
- Installer: parallel zu OrderEntry-Go-Live (.msi / .pkg / .deb / .rpm / docker pull)
- Repo-Name (geplant): `z2lab-bridge/`
- Binary-Name (geplant): `z2lab-bridge.{exe,deb,pkg,...}`

**How to apply:** Bei jeder Frage zu HL7-Datenaustausch, lokalen Druckern, ADT-Übernahme oder Klinik-Integration sofort an dieses Projekt denken. Das Cloud-Pendant `/api/v1/bridge/*` und `/api/v1/proxy/hl7/*` ist gebaut — nicht von Null erfinden, sondern bestehende Routes erweitern. Vor neuem Code immer in `Documentation/Bridge/README.md` nachschauen, ob die Entscheidung schon dokumentiert ist.
