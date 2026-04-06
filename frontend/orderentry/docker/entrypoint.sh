#!/bin/sh
set -e

echo "🚀 Starting OrderEntry..."

# Default values (falls nicht gesetzt)
FHIR_URL=${ORDERENTRY_FHIR__BASE_URL:-https://hapi.fhir.org/baseR4}
SEED_ENABLED=${ORDERENTRY_FHIR__SEED_ENABLED:-false}

echo "FHIR URL: $FHIR_URL"
echo "Seed enabled: $SEED_ENABLED"

# Optional: warten bis FHIR erreichbar ist
if [ "$SEED_ENABLED" = "true" ]; then
  echo "⏳ Waiting for FHIR server..."

  until curl -s "$FHIR_URL/metadata" > /dev/null; do
    echo "FHIR not ready yet..."
    sleep 2
  done

  echo "✅ FHIR is ready"

  echo "🌱 Running FHIR seed..."
  node /app/scripts/fhir-seed.mjs
else
  echo "⏭️ Skipping seed"
fi

echo "🟢 Starting server..."
exec node server.js