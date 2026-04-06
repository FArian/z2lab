# environments/dev — Development Environment

## Purpose

This folder holds configuration and documentation for the local development
environment. It is not used at runtime — configuration is loaded from `.env`
and `.env.local` files directly.

## Current setup

The development environment runs via Docker Compose:

```
infrastructure/docker/docker-compose.yml
```

Services: traefik, postgres, hapi-fhir, orchestra, orderentry, portainer, watchtower.

To start:

```bash
cd infrastructure/docker
docker compose up -d
```

The Next.js frontend dev server runs separately:

```bash
cd frontend/orderentry
npm run dev
```

## Future content (Phase 3+)

When the monorepo structure is introduced, this folder will contain:

- `docker-compose.dev.yml` — dev-only service overrides
- `.env.dev.example` — environment variable template for local dev
- `seed/` — dev database seed scripts
- `setup.sh` — one-command dev environment bootstrap

## Environment variable templates

Until then, the reference template is:

```
frontend/orderentry/.env.local.example
```

Copy it to `frontend/orderentry/.env.local` and fill in the required values
before starting the dev server.
