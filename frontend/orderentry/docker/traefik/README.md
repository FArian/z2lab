# 🚀 Traefik Setup Guide (Docker & Podman + TLS + Custom Ports)

---

# 📌 Ziel

Diese Dokumentation beschreibt den vollständigen Aufbau von **Traefik als Reverse Proxy mit TLS** für:

* 🐳 Docker
* 🦭 Podman
* 🔐 Eigene Zertifikate (PFX / PEM / interne CA)
* 🌍 Öffentliche Zertifikate (Let's Encrypt)
* 🔌 Standard Ports (80/443)
* 🔌 Custom Ports (z. B. 9091 / 9411)

---

# 🧠 Architektur

```text
Browser → Traefik → Services (Grafana, GitLab, Prometheus, ...)
```

Traefik übernimmt:

* Routing (Host / Path)
* TLS Terminierung
* Load Balancing

---

# 📁 Projektstruktur

```bash
compose/
  docker-compose.yml        # oder podman-compose.yml

  volumes/
    traefik/
      config/
        traefik.yml
        dynamic.yml
      certs/
        fullchain.crt
        wildcard.key
```

---

# ⚙️ Traefik Konfiguration

---

## 🧩 1. Static Config (`traefik.yml`)

```yaml
api:
  dashboard: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https

  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false

  file:
    directory: /etc/traefik
    watch: true
```

---

## 🔐 2. Dynamic Config (`dynamic.yml`)

```yaml
tls:
  stores:
    default:
      defaultCertificate:
        certFile: /certs/fullchain.crt
        keyFile: /certs/wildcard.key
```

👉 Ohne `defaultCertificate` → Traefik nutzt eigenes Default Cert ❌

---

# 🐳 Docker Setup

---

## 📦 docker-compose.yml

```yaml
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik

    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"

      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"

      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"

      - "--api.dashboard=true"

    ports:
      - "80:80"
      - "443:443"

    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./volumes/traefik/config:/etc/traefik
      - ./volumes/traefik/certs:/certs
```

---

# 🦭 Podman Setup

---

## 📦 podman-compose.yml

```yaml
services:
  traefik:
    image: docker.io/library/traefik:v3.0
    container_name: traefik

    command:
      - "--providers.docker=true"
      - "--providers.docker.endpoint=unix:///var/run/docker.sock"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=podman"

      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"

      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"

      - "--api.dashboard=true"

    ports:
      - "9091:80"
      - "9411:443"

    volumes:
      - /run/user/1000/podman/podman.sock:/var/run/docker.sock:Z
      - /ABSOLUTE/PATH/volumes/traefik/config:/etc/traefik:Z
      - /ABSOLUTE/PATH/volumes/traefik/certs:/certs:Z
```

---

# ⚠️ Unterschied Docker vs Podman

| Feature  | Docker                 | Podman                              |
| -------- | ---------------------- | ----------------------------------- |
| Socket   | `/var/run/docker.sock` | `/run/user/1000/podman/podman.sock` |
| Pfade    | relativ ok             | ❗ absolute Pfade nötig              |
| SELinux  | selten Problem         | `:Z` notwendig                      |
| Netzwerk | automatisch            | manuell (`podman network`)          |

---

# 🔐 Zertifikate

---

## 🧩 PFX → PEM konvertieren

```bash
openssl pkcs12 -in cert.pfx -nocerts -nodes -out wildcard.key
openssl pkcs12 -in cert.pfx -clcerts -nokeys -out fullchain.crt
```

---

## 🔍 Prüfen

```bash
openssl x509 -in fullchain.crt -text -noout
```

👉 Erwartet:

```text
CN=zedgeserver.zlz.loc
```

---

## 🔗 Key + Cert Match

```bash
openssl x509 -noout -modulus -in fullchain.crt | openssl md5
openssl rsa -noout -modulus -in wildcard.key | openssl md5
```

---

# 🌐 Routing Beispiel

---

## 📊 Grafana

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.grafana.rule=Host(`zedgeserver.zlz.loc`) && PathPrefix(`/grafana`)"
  - "traefik.http.routers.grafana.entrypoints=websecure"
  - "traefik.http.routers.grafana.tls=true"
  - "traefik.http.services.grafana.loadbalancer.server.port=3000"
```

---

# 🔌 Ports Szenarien

---

## ✅ Standard (empfohlen für Produktion)

```text
80 / 443
```

✔ Let’s Encrypt möglich
✔ keine Ports im Browser

---

## ✅ Custom Ports (dein Setup)

```text
9091 / 9411
```

👉 Wichtig:

```text
https://host:9411
```

---

# 🔐 TLS Varianten

---

## 🏥 Interne CA (dein Setup)

✔ volle Kontrolle
✔ kein Internet nötig

❗ Browser vertraut nicht automatisch

👉 Lösung:

* Root CA importieren

---

## 🌍 Let’s Encrypt

Voraussetzungen:

* öffentliche Domain
* Port 80 oder DNS Challenge

---

## ❌ Ohne Domain

👉 Öffentliches Zertifikat NICHT möglich

---

# 🧠 Lessons Learned (heute 💥)

---

## ❌ Default Cert Problem

```text
TRAEFIK DEFAULT CERT
```

👉 Ursache:

* dynamic.yml fehlt oder nicht geladen

---

## ❌ Volume Problem (Podman)

👉 Lösung:

```text
Absolute Pfade verwenden
```

---

## ❌ TLS nicht geladen

👉 Lösung:

```yaml
tls:
  stores:
    default:
      defaultCertificate:
```

---

## ❌ Kein Router

👉 Traefik liefert kein Zertifikat ohne Router

---

## ❌ SNI Fehler

```text
tlsv1 unrecognized name
```

👉 Ursache:

* kein Host Match

---

# 🧪 Debugging

---

## TLS testen

```bash
openssl s_client -connect host:9411 -servername host
```

---

## Container prüfen

```bash
podman exec -it traefik ls /etc/traefik
podman exec -it traefik ls /certs
```

---

## Logs

```bash
podman logs traefik
```

---

# 🚀 Best Practices

---

## 🔥 Subdomains (empfohlen)

```text
grafana.zlz.loc
gitlab.zlz.loc
```

👉 benötigt Wildcard Zertifikat (*.zlz.loc)

---

## 🟡 Alternative (dein aktuelles Setup)

```text
zedgeserver.zlz.loc/grafana
```

---

# 🏁 Fazit

Du hast jetzt:

✔ funktionierendes TLS Setup
✔ Traefik mit Docker & Podman
✔ internes PKI integriert
✔ Debug-Wissen für Probleme

---

# 🚀 Next Steps

* Wildcard Zertifikat erstellen
* Subdomain Routing
* Kubernetes Migration

---
