# ZetLab OrderEntry — Backend & Deployment

This directory contains the Docker Compose stack and OIE Juno integration engine configuration.

```
backend/
├── docker/          # Docker Compose stack (all production services)
│   ├── docker-compose.yml
│   ├── .env         # Environment variables — adjust per environment
│   └── data/        # Persistent data (volumes, configs)
└── orchestra/       # OIE Juno channels, FHIR seed resources
```

See [docker/README.md](docker/README.md) for the full Docker Compose stack reference.

---

## Build & Push the Frontend Image

Run from `frontend/zetlab/` (repo root → `frontend/zetlab/`):

```bash
cd ../frontend/zetlab

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t farian/orderentry:v0.1.0 \
  -t farian/orderentry:latest \
  --push \
  .
```

### Why Two Platforms?

| Platform | Used by |
|---|---|
| `linux/amd64` | Standard x86-64 servers, most cloud VMs (Hetzner, AWS EC2, etc.) |
| `linux/arm64` | ARM-based servers (AWS Graviton, Apple Silicon VMs, Raspberry Pi) |

The production server runs on **ARM64**. Building for both platforms creates a multi-arch manifest on Docker Hub — Docker automatically pulls the correct variant for the host CPU.

Without `linux/arm64` you would get:
```
no matching manifest for linux/arm64/v8 in the manifest list entries
```

### Prerequisites

```bash
# Create a multi-platform builder (one-time)
docker buildx create --name multibuilder --use
docker buildx inspect --bootstrap

# Log in to Docker Hub
docker login
```

---

## Deploy on Server

```bash
cd backend/docker

# Pull latest image and restart only the orderentry service
docker compose pull orderentry
docker compose up -d orderentry

# View live logs
docker compose logs -f orderentry
```

To restart the full stack:

```bash
docker compose up -d
```

---

## First-Time Setup

```bash
cd backend/docker

# Copy and edit environment variables
cp .env .env.local   # or edit .env directly

# Create data directories with correct ownership
# orderentry container runs as uid 1001 by default
mkdir -p data/orderentry/data
sudo chown -R 1001:1001 data/orderentry/data

# Start all services
docker compose up -d

# Verify all containers are healthy
docker compose ps
```

---

## Running the Container as a Specific Linux User

By default the `orderentry` container runs as `nextjs` (uid 1001). To match your server user:

```bash
# Find your uid/gid on the server
id farin
# uid=1000(farin) gid=1000(farin)
```

**Option A — hardcode in `docker-compose.yml`:**

```yaml
orderentry:
  image: farian/orderentry:latest
  user: "1000:1000"
```

```bash
sudo chown -R 1000:1000 data/orderentry/data
```

**Option B — dynamic user (recommended):**

Set in `docker-compose.yml`:
```yaml
orderentry:
  image: farian/orderentry:latest
  user: "${UID}:${GID}"
```

Add to `~/.bashrc` on the server (one-time):
```bash
echo 'export UID=$(id -u) GID=$(id -g)' >> ~/.bashrc
source ~/.bashrc
```

Or run inline:
```bash
UID=$(id -u) GID=$(id -g) docker compose up -d
```

---

## Environment Variables

Edit `docker/` before deploying. Key variables:

| Variable | Description |
|---|---|
| `BASE_DOMAIN` | Base domain — all service subdomains are derived from this |
| `AUTH_SECRET` | HMAC key for session cookies — **generate a new value for production** (`openssl rand -hex 32`) |
| `ACME_EMAIL` | Email for Let's Encrypt certificate notifications |
| `POSTGRES_PASSWORD` | PostgreSQL password — change in production |
| `ALLOW_LOCAL_AUTH` | `false` in production; `true` enables browser localStorage auth fallback |

See [docker/README.md](docker/README.md) for the full variable reference.

---

## Architecture Note — Orchestra (OIE Juno)

The `orchestra` container image (`farian/oie-juno:4.10.1.1`) is **amd64-only**. On an ARM64 host it runs under QEMU emulation via:

```yaml
platform: linux/amd64   # in docker-compose.yml
```

Enable QEMU emulation on the server (one-time):

```bash
docker run --privileged --rm tonistiigi/binfmt --install all
```

This works but is slower than native. See [README_ArchitectureMismatch.md](README_ArchitectureMismatch.md) for details.
