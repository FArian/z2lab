# Docker Architecture Mismatch — Troubleshooting Guide

> **Platform:** OrderEntry + FHIR + Orchestra on Docker Compose (Linux servers)

---

## 1. Problem Explanation

### Why does `exec format error` occur?

Docker images contain compiled binaries. A binary compiled for `amd64` cannot be executed on an `arm64` CPU — the instruction sets are fundamentally different.

| Architecture | Also known as | Typical hardware |
|---|---|---|
| `amd64` | `x86_64` | Intel/AMD servers, most cloud VMs |
| `arm64` | `aarch64` | Hetzner CAX, AWS Graviton, Apple M1/M2, Raspberry Pi 4+ |

When Docker tries to run an `amd64` binary on an `arm64` host, the Linux kernel rejects it:

```
exec format error
```

This is not a Docker bug — it is enforced by the CPU itself.

---

## 2. How to Detect System Architecture

```bash
# Check host CPU architecture
uname -m

# Check Docker Engine architecture
docker info | grep Architecture
```

| Output | Meaning |
|---|---|
| `x86_64` | amd64 system |
| `aarch64` | arm64 system |

---

## 3. Solution A — Emulation via QEMU (Quick Fix)

QEMU allows an arm64 host to emulate amd64 binaries using software translation.

### Enable QEMU emulation

```bash
docker run --privileged --rm tonistiigi/binfmt --install all
```

This installs QEMU binary format handlers into the kernel. The change persists until reboot.

### Start the stack

```bash
docker compose up -d
```

### Optional — force platform in docker-compose.yml

```yaml
services:
  orchestra:
    image: farian/oie-juno:4.10.1.1
    platform: linux/amd64   # force amd64 emulation on arm64 host
```

### When to use

- Temporary fix while waiting for a native arm64 image
- Development and testing environments
- Non-production deployments

### Performance implications

⚠️ QEMU emulation adds **30–50% CPU overhead**. Java-based services (Orchestra, HAPI FHIR) will start slower and consume more memory. **Do not use in production under load.**

---

## 4. Solution B — Multi-Architecture Images (Recommended)

Build images that contain both `amd64` and `arm64` variants in a single manifest. Docker automatically selects the correct one at pull time.

### Build and push multi-arch image

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t farian/orderentry:latest \
  --push \
  -f docker/Dockerfile \
  .
```

### Why this is the best long-term solution

| Benefit | Detail |
|---|---|
| No emulation overhead | Native binary runs on each platform |
| Single image tag | No platform-specific tags to manage |
| Cloud + edge compatible | Works on AWS Graviton, Hetzner CAX, Apple M1/M2, Raspberry Pi |
| CI/CD friendly | Build once, deploy anywhere |
| Future-proof | arm64 server share is growing rapidly |

---

## 5. Can a Multi-Arch Image Run on amd64?

**Yes.** Docker automatically selects the correct architecture variant from the image manifest.

| Host Architecture | Selected Image Variant |
|---|---|
| `amd64` | `linux/amd64` |
| `arm64` | `linux/arm64` |

A multi-arch image is fully backward compatible. Existing amd64 servers require no changes.

---

## 6. Best Practices

- **Docker Compose is for runtime, not for building.** Use `docker buildx` in CI/CD pipelines.
- **Always build multi-architecture images** for any image that may run on mixed infrastructure.
- **Use `platform:` in docker-compose.yml only** for third-party images that do not provide arm64 variants (e.g. legacy `farian/oie-juno`).
- **Avoid QEMU emulation in production** — use it only as a temporary bridge while a native image is being prepared.
- **Pin image versions** (`image: farian/orderentry:v1.2.0`) to avoid silent architecture changes on pull.

---

## 7. Recommended Project Structure

```
docker/
├── docker-compose.yml               # Runtime stack
├── docker-compose.hapi.yml          # Dev stack with local HAPI
├── Dockerfile                       # Multi-arch build definition
├── README_ArchitectureMismatch.md   # This file
└── .env                             # Environment variables (never commit)
```

---

## 8. Troubleshooting

### Verify what architectures an image supports

```bash
docker buildx imagetools inspect farian/orderentry:latest
```

Expected output for a multi-arch image:

```
MediaType: application/vnd.docker.distribution.manifest.list.v2+json
...
Platform:  linux/amd64
Platform:  linux/arm64
```

### Confirm which platform a running container uses

```bash
# List running containers
docker ps

# Inspect a specific container
docker inspect orderentry | grep -i arch
```

### Check if QEMU is active

```bash
ls /proc/sys/fs/binfmt_misc/ | grep qemu
```

If QEMU handlers are listed, emulation is active.

### Force re-pull after enabling QEMU

```bash
docker compose pull
docker compose up -d
```

---

## 9. Known Images — Architecture Status

| Image | amd64 | arm64 | Notes |
|---|---|---|---|
| `farian/orderentry` | ✅ | ✅ | Multi-arch via `docker buildx` |
| `hapiproject/hapi` | ✅ | ✅ | Official multi-arch |
| `postgres:15-alpine` | ✅ | ✅ | Official multi-arch |
| `traefik:v3.3` | ✅ | ✅ | Official multi-arch |
| `farian/oie-juno` | ✅ | ❌ | amd64 only — requires QEMU on arm64 hosts |

> **`farian/oie-juno`** requires `platform: linux/amd64` in docker-compose.yml when running on arm64 hosts. Enable QEMU first with `tonistiigi/binfmt`.
