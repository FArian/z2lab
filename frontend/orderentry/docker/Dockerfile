# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./

# Use BuildKit cache mount to avoid re-downloading packages on repeated builds.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --fetch-retry-maxtimeout=300000 --fetch-timeout=300000


# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Git is needed by scripts/write-version.mjs
RUN apk add --no-cache git

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept git metadata as build args so the version string matches the source commit.
ARG GIT_COMMIT=
ARG GIT_BRANCH=
ARG GIT_COUNT=

# NEXT_PUBLIC_* vars must be baked into the client bundle at build time.
ARG NEXT_PUBLIC_LAB_ORG_ID=zlz
ARG NEXT_PUBLIC_LAB_NAME="ZLZ Zentrallabor AG"
ARG NEXT_PUBLIC_ORDER_SERVICE_TYPES=MIBI,ROUTINE,POC
ARG NEXT_PUBLIC_GLN_ENABLED=false
ARG NEXT_PUBLIC_SASIS_ENABLED=false

# Inject git-based version info into .env.local so write-version.mjs can use it
RUN if [ -n "$GIT_COMMIT" ]; then \
      PKG_VER=$(node -e "process.stdout.write(require('./package.json').version)"); \
      TS=$(date -u +"%Y%m%d%H%M"); \
      COUNT_PART=$([ -n "$GIT_COUNT" ] && echo "$GIT_COUNT" || echo "0"); \
      BRANCH_PART=$([ -n "$GIT_BRANCH" ] && echo "@$GIT_BRANCH" || echo ""); \
      printf "NEXT_PUBLIC_APP_VERSION=v%s+%s-%s%s (%s)\n" \
        "$PKG_VER" "$COUNT_PART" "$GIT_COMMIT" "$BRANCH_PART" "$TS" > .env.local; \
    fi

# Write build-time frontend configuration
RUN printf "NEXT_PUBLIC_LAB_ORG_ID=%s\n" "$NEXT_PUBLIC_LAB_ORG_ID" >> .env.local && \
    printf "NEXT_PUBLIC_LAB_NAME=%s\n" "$NEXT_PUBLIC_LAB_NAME" >> .env.local && \
    printf "NEXT_PUBLIC_ORDER_SERVICE_TYPES=%s\n" "$NEXT_PUBLIC_ORDER_SERVICE_TYPES" >> .env.local && \
    printf "NEXT_PUBLIC_GLN_ENABLED=%s\n" "$NEXT_PUBLIC_GLN_ENABLED" >> .env.local && \
    printf "NEXT_PUBLIC_SASIS_ENABLED=%s\n" "$NEXT_PUBLIC_SASIS_ENABLED" >> .env.local

# Build app
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build


# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    ORDERENTRY_FHIR__BASE_URL=https://hapi.fhir.org/baseR4 \
    ORDERENTRY_FHIR__AUTH_TYPE=none \
    ORDERENTRY_FHIR__SEED_ENABLED=false \
    ORDERENTRY_FHIR__SEED_DEMO=false \
    ORDERENTRY_FHIR__SEED_CATALOG=false \
    ORDERENTRY_AUTH__ALLOW_LOCAL=false

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN apk add --no-cache curl

# Copy standalone output (server + node_modules subset)
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Carry generated build env so server.js can load it via @next/env
COPY --from=builder /app/.env.local ./.env.local

# Copy Prisma schema + runtime files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy FHIR seed bundles and script
COPY --from=builder /app/seed ./seed
COPY --from=builder /app/scripts/fhir-seed.mjs ./scripts/fhir-seed.mjs

# Copy Flyway SQL migration files for SQLite startup migrations
COPY --from=builder /app/flyway ./flyway

# Ensure runtime directories exist
RUN mkdir -p /app/data /app/logs /app/scripts && \
    chown -R nextjs:nodejs /app/data /app/logs /app/prisma /app/seed /app/scripts /app/flyway

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node /app/scripts/fhir-seed.mjs || true; node server.js"]