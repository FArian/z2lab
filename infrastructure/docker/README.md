[← DevOps](../README.md) | [↑ Root](../../README.md)

# 🐳 ZetLab OrderEntry — Docker Compose Stack

Production deployment stack for ZetLab OrderEntry.
All services communicate on the internal `zetlab-net` bridge network.

---

## 📦 Services

| Service | Container | Image | Port (internal) | Public via Traefik |
|---|---|---|---|---|
| `traefik` | traefik | `traefik:v3.3` | 80, 443 | — (is the proxy) |
| `watchtower` | watchtower | `containrrr/watchtower:latest` | — | — |
| `portainer` | portainer | `portainer/portainer-ce:latest` | 9000 | `portainer.$BASE_DOMAIN` |
| `postgres` | postgres | `postgres:15-alpine` | 5432 | — (internal only) |
| `hapi` | hapi-fhir | `hapiproject/hapi:latest` | 8080 | `hapi.$BASE_DOMAIN` |
| `orchestra` | oie-juno | `farian/oie-juno:4.10.1.1` | 8090, 8019 | `orchestra.$BASE_DOMAIN` / `api-orchestra.$BASE_DOMAIN` |
| `orderentry` | orderentry | `farian/orderentry:latest` | 3000 | `orderentry.$BASE_DOMAIN` |

Keycloak / SMART on FHIR is reserved at the bottom of `docker-compose.yml` (commented out).

---

## ⚙️ Environment Variables (`.env`)

Copy `.env` and fill in real values before starting the stack.

### Domain

| Variable | Example | Description |
|---|---|---|
| `BASE_DOMAIN` | `z2lab.ddns.net` | Base domain — all service subdomains derived from this |

Derived automatically from `BASE_DOMAIN`:

```
TRAEFIK_DOMAIN=traefik.$BASE_DOMAIN
HAPI_DOMAIN=hapi.$BASE_DOMAIN
ORCHESTRA_DOMAIN=orchestra.$BASE_DOMAIN
ORCHESTRA_API_DOMAIN=api-orchestra.$BASE_DOMAIN
ORDERENTRY_DOMAIN=orderentry.$BASE_DOMAIN
PORTAINER_DOMAIN=portainer.$BASE_DOMAIN
```

You can also use [nip.io](https://nip.io) for IP-based domains (no DNS config needed):
`BASE_DOMAIN=185-88-104-178.nip.io`

### Let's Encrypt

| Variable | Description |
|---|---|
| `ACME_EMAIL` | Email for certificate expiry notifications |

### Traefik

| Variable | Description |
|---|---|
| `TRAEFIK_AUTH` | BasicAuth credentials for the dashboard. Generate: `htpasswd -nB admin \| sed 's/\$/\$\$/g'` |

### PostgreSQL (HAPI FHIR backend)

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `hapi` | Database name |
| `POSTGRES_USER` | `hapi` | Database user |
| `POSTGRES_PASSWORD` | — | **Change in production** |

### OrderEntry (Next.js)

| Variable | Description |
|---|---|
| `AUTH_SECRET` | HMAC-SHA256 key for session cookies. Generate: `openssl rand -hex 32` |
| `ALLOW_LOCAL_AUTH` | `false` in production. `true` enables browser localStorage auth fallback |
| `FHIR_BASE_URL` | Internal FHIR URL (default: `http://hapi-fhir:8080/fhir`) |
| `SASIS_API_BASE` | SASIS/OFAC insurance card lookup API via Orchestra |
| `NEXT_PUBLIC_SASIS_ENABLED` | `true` to show VeKa card lookup in UI |
| `GLN_API_BASE` | GLN/Refdata partner lookup API via Orchestra |
| `NEXT_PUBLIC_GLN_ENABLED` | `true` to show GLN lookup in UI |
| `NEXT_PUBLIC_LAB_ORG_ID` | FHIR Organization ID of the lab (default: `zlz`) |
| `ORCHESTRA_JWT_SECRET` | Shared HS256 secret for `/api/launch` JWT validation. Generate: `openssl rand -hex 32` |
| `LOG_LEVEL` | Log verbosity: `debug` \| `info` \| `warn` \| `error` \| `silent` (default: `info`) |
| `LOG_FILE` | Absolute path inside the container for persistent structured logs (default: `/app/logs/zetlab.log`). **Required for the Logs viewer UI.** |

### Orchestra (OIE Juno)

| Variable | Description |
|---|---|
| `ORCHESTRA_RT_DB_USER` | Runtime Derby DB user (encrypted token) |
| `ORCHESTRA_RT_DB_PASSWORD` | Runtime Derby DB password (encrypted token) |
| `ORCHESTRA_AR_DB_USER` | Archive Derby DB user (encrypted token) |
| `ORCHESTRA_AR_DB_PASSWORD` | Archive Derby DB password (encrypted token) |

### Container User (optional)

| Variable | Description |
|---|---|
| `UID` | User ID for running containers (`id -u`) |
| `GID` | Group ID for running containers (`id -g`) |

---

## 💾 Volumes & Persistent Data

Named Docker volumes:

| Volume | Purpose |
|---|---|
| `traefik-certs` | Let's Encrypt certificates (`acme.json`) |
| `pgdata` | PostgreSQL data |
| `portainer-data` | Portainer configuration |
| `orc-database` | OIE Juno Derby runtime database |

Bind-mounted host directories under `data/`:

```
data/
├── hapi/config/           # HAPI FHIR application.yaml
├── orc/
│   ├── logs/              # OIE Juno logs
│   ├── licensestore/      # OIE Juno license file
│   ├── autodeployment/    # Channels/scenarios auto-deployed on start
│   ├── deploypath/
│   ├── localpath/
│   └── longtimearchive/
└── orderentry/
    └── data/              # users.json + config.json (server-side user store)
logs/                      # OrderEntry persistent log files
```

---

## 🔒 Security

### HTTPS & Certificates

- HTTP (port 80) permanently redirects to HTTPS (port 443)
- TLS certificates provisioned automatically via Let's Encrypt HTTP-01 challenge
- Certificates stored in the named volume `traefik-certs` (persisted across restarts)
- To test without hitting rate limits, uncomment the `caserver` staging line in `docker-compose.yml`

### Security Headers (Healthcare-grade)

Applied to all services via the `secure-headers@docker` middleware:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Server` | *(removed)* |
| `X-Powered-By` | *(removed)* |

### Rate Limiting

OrderEntry has `ratelimit@docker` applied: 100 req/s average, burst 50.

### Traefik Dashboard

Protected by BasicAuth (`TRAEFIK_AUTH`). Available at `https://traefik.$BASE_DOMAIN`.

---

## 📋 Logging

### Konfiguration

OrderEntry schreibt strukturierte JSON-Logs (ein Objekt pro Zeile) nach `stdout` **und** optional in eine persistente Datei.

| Variable | Standardwert | Beschreibung |
|---|---|---|
| `LOG_LEVEL` | `info` | Mindeststufe: `debug` \| `info` \| `warn` \| `error` \| `silent` |
| `LOG_FILE` | `/app/logs/zetlab.log` | Absoluter Pfad **im Container** — muss auf das Bind-Mount `./logs` zeigen |

Der Docker-Compose-Stack setzt beide Variablen mit sinnvollen Standardwerten. Das Bind-Mount `./logs:/app/logs` stellt sicher, dass die Datei auf dem Host unter `devops/docker/logs/zetlab.log` erhalten bleibt.

### Log-Viewer UI

Administratoren können Logs direkt in der Web-UI lesen:

```
https://orderentry.$BASE_DOMAIN/admin/logs
```

Features:
- **Level-Filter**: Alle / DEBUG / INFO / WARN / **SEVERE** (= `error`, Standard)
- **Freitextsuche** über Nachricht und Kontext (Controller-Name)
- **Letzte N Einträge**: 100 / 200 / 500 / 1000 (Standard: 200)
- **Auto-Refresh** alle 10 Sekunden
- Farbkodierung: SEVERE = rot, WARN = amber, INFO = teal, DEBUG = grau
- Meta-Felder (z. B. `patientId`, HTTP-Status) per Klick auf die Zeile aufklappbar

> Der Viewer ist nur sichtbar, wenn `LOG_FILE` gesetzt ist. Ohne Datei wird ein Konfigurationshinweis angezeigt.

### Log-Format (JSON)

```json
{"time":"2025-04-03T08:12:45.123Z","level":"error","ctx":"ResultsController","msg":"FHIR DiagnosticReport list failed","status":503}
```

| Feld | Beschreibung |
|---|---|
| `time` | ISO-8601 Zeitstempel (UTC) |
| `level` | `debug` / `info` / `warn` / `error` |
| `ctx` | Kontext (Controller- oder Modulname) |
| `msg` | Lognachricht |
| `…` | Weitere Felder je nach Aufruf (z. B. `patientId`, `status`) |

### Log-Rotation (empfohlen)

Docker beschränkt die Containerlogs bereits (`max-size: 10m`, `max-file: 5`). Für die Datei `./logs/zetlab.log` empfiehlt sich `logrotate` auf dem Host:

```bash
# /etc/logrotate.d/zetlab
/pfad/zu/devops/docker/logs/zetlab.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    copytruncate
}
```

### Log-Ebenen im Überblick

| Level | Wann verwenden | UI-Bezeichnung |
|---|---|---|
| `debug` | Detaillierte FHIR-URLs, Query-Parameter | DEBUG |
| `info` | Erfolgreiche Anfragen, Anzahl geladener Datensätze | INFO |
| `warn` | Soft-Delete-Fallback, fehlende optionale Felder | WARN |
| `error` | FHIR-Fehler, Netzwerkfehler, ungültige Tokens | **SEVERE** |

---

## 🔧 Common Operations

### Start / Stop

```bash
# Start all services
docker compose up -d

# Stop all services (keeps volumes)
docker compose down

# Stop and remove volumes (destructive — deletes all data!)
docker compose down -v
```

### Update orderentry manually

```bash
docker compose pull orderentry
docker compose up -d orderentry
```

Watchtower also does this automatically every night at 03:00 server time.

### Logs anzeigen

**Im Browser (empfohlen für Admins):**

```
https://orderentry.$BASE_DOMAIN/admin/logs
```

Filtert nach Level (Standard: SEVERE), Freitextsuche, Auto-Refresh alle 10 s.

**Via Docker-CLI (alle Servicelogs):**

```bash
docker compose logs -f orderentry
docker compose logs -f hapi
docker compose logs -f oie-juno
```

**Persistente Logdatei direkt lesen:**

```bash
# Letzte 100 Zeilen (JSON, neueste zuletzt)
tail -n 100 logs/zetlab.log

# Nur Fehler filtern
grep '"level":"error"' logs/zetlab.log | jq .

# Echtzeit-Tail
tail -f logs/zetlab.log | jq .
```

### Check service health

```bash
docker compose ps
```

### Upload FHIR seed data (requires HAPI port open)

Temporarily expose HAPI port (uncomment in `docker-compose.yml`), then:

```bash
curl -X POST http://<server-ip>:8080/fhir \
  -H "Content-Type: application/fhir+json" \
  -d @bundle.json
```

---

## 🎵 Orchestra (OIE Juno)

- Startup takes **2–3 minutes** — healthcheck has a 180s start period
- Health endpoint: `http://localhost:8019/Orchestra/default/RuntimeHealthMetrics/`
- Web UI (Monitor): `https://orchestra.$BASE_DOMAIN`
- API: `https://api-orchestra.$BASE_DOMAIN`
- Image is **amd64-only** — runs under QEMU emulation on ARM64 hosts

Enable QEMU on ARM64 server (one-time):

```bash
docker run --privileged --rm tonistiigi/binfmt --install all
```

---

## 🔄 Watchtower

Monitors `farian/orderentry:latest` and auto-updates daily at 03:00 server time.
Only containers with the label `com.centurylinklabs.watchtower.enable=true` are updated.

Manual update trigger:

```bash
docker exec watchtower /watchtower --run-once
```

---

## 🔑 Keycloak / SMART on FHIR (reserved)

A Keycloak service block is prepared at the bottom of `docker-compose.yml` (commented out).
To activate:
1. Uncomment the `keycloak:` service block
2. Add `KEYCLOAK_DOMAIN`, `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD` to `.env`
3. Enable `smart.enabled=true` in `data/hapi/config/application.yaml`
4. Restart the stack

[⬆ Back to top](#)
