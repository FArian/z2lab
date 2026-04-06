# ZetLab OrderEntry -- Docker Setup

## Overview

Full stack including: - Traefik (reverse proxy) - HAPI FHIR (H2) -
Orchestra (OIE Juno) - simple_orderentry (UI) - Portainer - Watchtower

------------------------------------------------------------------------

## Folder Structure

    project-root/
    ├── docker-compose.yml
    ├── simple_orderentry/
    │   ├── Dockerfile
    │   ├── nginx.conf
    │   └── index.html
    ├── data/
    │   ├── hapi/application.yaml
    │   └── orc/

------------------------------------------------------------------------

## Multi-Platform Build (Linux)

Build for: - linux/amd64 - linux/arm64 - linux/arm/v7

### Build command:

    docker buildx create --use
    docker buildx build \
      --platform linux/amd64,linux/arm64,linux/arm/v7 \
      -t yourrepo/simple_orderentry:latest \
      ./simple_orderentry --push

------------------------------------------------------------------------

## Docker Compose Build

    simple_orderentry:
      build:
        context: ./simple_orderentry
      image: simple_orderentry:latest

------------------------------------------------------------------------

## Start

    docker compose up -d --build

------------------------------------------------------------------------

## URLs

-   UI: https://ORDERENTRY_DOMAIN
-   FHIR: https://HAPI_DOMAIN/fhir
-   Orchestra: https://ORCHESTRA_DOMAIN
