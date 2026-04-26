---
name: CI/CD Docker Multi-Arch Build (working setup)
description: Funktionierende GitHub-Actions-Konfiguration für linux/amd64 + linux/arm64 Docker-Builds mit nativen Runnern statt QEMU. Validiert 2026-04-26.
type: project
---

**Status:** ✅ Funktioniert in Produktion (validiert 2026-04-26 auf branch `dev`).

**Workflow-Datei:** `.github/workflows/orderentry-ci.yml`

**Setup:** 4-Job-Pipeline mit Matrix für native ARM-Runner.

```
quality → tag → docker-build (matrix amd64 + arm64 parallel) → docker-merge
```

**Schlüssel-Konfiguration:**

```yaml
docker-build:
  strategy:
    fail-fast: false
    matrix:
      include:
        - platform: linux/amd64
          runner:   ubuntu-latest
        - platform: linux/arm64
          runner:   ubuntu-22.04-arm   # NATIVE ARM, kein QEMU
  steps:
    - uses: docker/build-push-action@v6
      with:
        platforms: ${{ matrix.platform }}
        outputs: type=image,name=${{ env.IMAGE_NAME }},push-by-digest=true,name-canonical=true,push=true
        cache-from: type=gha,scope=${{ matrix.platform }}
        cache-to:   type=gha,scope=${{ matrix.platform }},mode=max
```

Anschließend `docker-merge` Job kombiniert beide Digests via `docker buildx imagetools create` zu einem Multi-Arch-Manifest.

**Why:** Vorher mit QEMU-Emulation für `linux/arm64` auf amd64-Runner → Build crash mit `qemu: uncaught target signal 4 (Illegal instruction) - core dumped` weil Next.js SWC (Rust-Compiler) SIMD-Instruktionen emittiert die QEMU nicht emulieren kann. Lösung: GitHub bietet native ARM-Runner (`ubuntu-22.04-arm`) → jeder Build läuft auf seiner Ziel-Architektur, kein cross-compile nötig.

**How to apply:**
- **Niemals** `docker/setup-qemu-action` für arm64-Builds verwenden, wenn Next.js / SWC / native Rust-Code involviert ist
- Native Runner via Matrix: `ubuntu-latest` (amd64) + `ubuntu-22.04-arm` (arm64)
- Per-Platform Cache-Scope (`scope=${{ matrix.platform }}`) verhindert Cache-Kollisionen
- `push-by-digest=true` + separater Merge-Job für sauberes Multi-Arch-Manifest
- Erste Build-Zeit: ~6-10 min (kein Cache); Folge-Builds: ~3-4 min

**Trigger:**
- Auto auf `push` zu `dev` (nur wenn `frontend/orderentry/**` oder Workflow-Datei geändert)
- Manuell via `workflow_dispatch` mit `target_branch` Input (für test/master Releases)

**Tag-Mapping (Job `tag`):**
- `dev` → `farian/orderentry:dev`
- `test` → `farian/orderentry:test`
- `master` → `farian/orderentry:latest`
- andere Branches → kebab-case

Optionaler SHA-Tag (`sha-XXXXXXX`) ist auskommentiert — bei Bedarf in `docker-merge.meta.tags` aktivieren.
