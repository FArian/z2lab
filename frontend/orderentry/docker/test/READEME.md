## 🐳 Docker Compose (Default: Public HAPI)

Die Testumgebung verwendet standardmäßig den **public HAPI FHIR Server**, damit OrderEntry ohne zusätzliche Infrastruktur sofort gestartet werden kann.

### Standardverhalten

```yaml
services:
  orderentry:
    image: farian/orderentry:dev
    container_name: orderentry
    restart: unless-stopped

    ports:
      - "${ORDERENTRY_PORT:-3000}:3000"

    environment:
      NODE_ENV: production
      DATABASE_URL: file:/app/data/orderentry.db

      ORDERENTRY_AUTH__ALLOW_LOCAL: ${ORDERENTRY_AUTH__ALLOW_LOCAL:-false}
      ORDERENTRY_AUTH__SECRET: ${ORDERENTRY_AUTH__SECRET:-change-me-dev-secret-min-32-chars}

      # Default: public HAPI FHIR server
      ORDERENTRY_FHIR__BASE_URL: ${ORDERENTRY_FHIR__BASE_URL:-https://hapi.fhir.org/baseR4}
      ORDERENTRY_FHIR__AUTH_TYPE: ${ORDERENTRY_FHIR__AUTH_TYPE:-none}
      ORDERENTRY_FHIR__SEED_ENABLED: ${ORDERENTRY_FHIR__SEED_ENABLED:-false}
      ORDERENTRY_FHIR__SEED_DEMO: ${ORDERENTRY_FHIR__SEED_DEMO:-false}
      ORDERENTRY_FHIR__SEED_CATALOG: ${ORDERENTRY_FHIR__SEED_CATALOG:-false}

      ORDERENTRY_LOG__LEVEL: ${ORDERENTRY_LOG__LEVEL:-info}
      ORDERENTRY_LOG__FILE: /app/logs/zetlab.log

    volumes:
      - orderentry-data:/app/data
      - orderentry-logs:/app/logs

    networks:
      - orderentry-net

    healthcheck:
      test: ["CMD-SHELL", "curl -sf -o /dev/null -w '%{http_code}' http://localhost:3000/api/me | grep -qE '^(200|401)$'"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  orderentry-net:
    name: orderentry-net
    driver: bridge

volumes:
  orderentry-data:
  orderentry-logs:
```

---

## 🔁 Eigenen FHIR Server verwenden

Falls ein eigener FHIR Server (z. B. HAPI lokal oder extern) vorhanden ist, kann dieser einfach über die `.env` Datei konfiguriert werden.

### Beispiel: Lokaler HAPI Server

```env
ORDERENTRY_FHIR__BASE_URL=http://hapi:8080/fhir
ORDERENTRY_FHIR__SEED_ENABLED=true
```

---

### Beispiel: Externer FHIR Server

```env
ORDERENTRY_FHIR__BASE_URL=https://mein-fhir-server.example.com/fhir
ORDERENTRY_FHIR__SEED_ENABLED=false
```

---

## 🧠 Bedeutung der wichtigsten Variablen

| Variable                      | Beschreibung                                             |
| ----------------------------- | -------------------------------------------------------- |
| ORDERENTRY_FHIR__BASE_URL     | URL des FHIR Servers                                     |
| ORDERENTRY_FHIR__SEED_ENABLED | aktiviert Initialdaten (nur bei eigenem Server sinnvoll) |
| ORDERENTRY_FHIR__SEED_DEMO    | Demo-Daten laden                                         |
| ORDERENTRY_FHIR__SEED_CATALOG | Katalogdaten laden                                       |

---

## ⚠️ Wichtige Hinweise

### Public HAPI (Default)

* keine zusätzliche Installation notwendig
* ideal für schnellen Start
* Daten sind **nicht persistent**
* nicht für Produktion geeignet

---

### Eigener FHIR Server

* empfohlen für:

  * Integration
  * Test
  * Produktion
* ermöglicht:

  * stabile Datenhaltung
  * kontrollierte Umgebung
  * sichere Verarbeitung

---

## 🎯 Empfehlung

```text
DEV     → public HAPI oder lokal
TEST    → eigener HAPI Server
PROD    → eigener FHIR Server
```
