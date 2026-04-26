---
name: z2Lab Bridge
description: Geplantes Go-Binary, das als Brücke zwischen Cloud (OrderEntry/Orchestra/HAPI) und lokalen Klinik-/Praxis-Systemen läuft — übernimmt HL7-Datenaustausch (ADT/ORU), lokalen Druck (PDF Begleitschein + ZPL Barcode) und Print-Job-Verteilung im LAN. Ergänzt OrderEntry, ist aber separates Projekt. Vorher "ZetLab Local Agent" — siehe bridge_naming.md.
type: project
---

**Was die Bridge ist:**
Lokaler Daemon (Windows Service / systemd / LaunchAgent / Docker), der via HTTPS outbound-only mit der Cloud spricht. Polling-basiert — Cloud öffnet nie Verbindung ins lokale Netz. GLN-identifiziert pro Klinik (API-Key → FHIR Organization).

**Drei Hauptaufgaben:**
1. **ADT** — Directory Watcher liest HL7-Patientendaten aus PIS/KIS und postet an `/api/v1/proxy/hl7/inbound`
2. **Druck** — Pollt `/api/v1/agent/jobs` (TODO: → `/bridge/jobs`), druckt Begleitschein (PDF→CUPS/WinPrint) und Barcode-Etikette (ZPL→TCP:9100)
3. **ORU** — Holt Laborbefunde via `/api/v1/proxy/hl7/outbound` und legt sie als Datei für PIS/KIS ab

**Why:** Kliniken/Praxen können keine Inbound-Verbindungen erlauben (Firewall, IT-Policy). Cloud-Drucker scheiden für Zebra/Dymo-Etiketten oft aus. Orchestra ist der einzige HL7↔FHIR-Konverter — die Bridge darf kein HL7 parsen, nur transportieren.

**Aktueller Stand (2026-04-26):**
- ✅ Cloud-seitige API-Routes teilweise da: `/api/v1/agent/{status,token,jobs,register}`, `/api/v1/admin/agents`, `/api/v1/proxy/hl7/{inbound,outbound}`, FHIR-Proxy-Routes (Pfade noch agent — siehe bridge_naming.md)
- ✅ Browser-seitiger Druck fertig (`useOrderDocuments.ts` — Begleitschein-HTML, Barcode via JsBarcode)
- ✅ Admin-UI-Stub `/admin/agents` (page.tsx, 226 B — leer)
- ❌ Go-Binary noch nicht implementiert
- ❌ Print Job Queue server-seitig fehlt (POST /jobs/print, /jobs/[id]/done)
- ❌ ZPL-Generierung server-seitig fehlt
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

**How to apply:** Bei jeder Frage zu HL7-Datenaustausch, lokalen Druckern, ADT-Übernahme oder Klinik-Integration sofort an dieses Projekt denken. Das Cloud-Pendant `/api/v1/agent/*` (TODO bridge) und `/api/v1/proxy/hl7/*` ist bereits zu großen Teilen gebaut — nicht von Null erfinden, sondern bestehende Routes erweitern. Vor neuem Code immer in `tmp/agent/README.md` (TODO bridge) nachschauen, ob die Entscheidung schon dokumentiert ist.
