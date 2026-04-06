#!/bin/bash
source .env
set -e

echo "======================================="
echo "🚀 ZetLab Traefik Certificate Trigger"
echo "======================================="

# -----------------------------
# DOMAIN LIST (anpassen!)
# -----------------------------
DOMAINS=(
  "orderentry.${BASE_DOMAIN}/api/health"
  "hapi.${BASE_DOMAIN}/fhir"
  "orchestra.${BASE_DOMAIN}/monitor"
  "api-orchestra.${BASE_DOMAIN}/Orchestra/default/RuntimeHealthMetrics/"
  "portainer.${BASE_DOMAIN}"
  "traefik.${BASE_DOMAIN}"
)

echo ""
echo "🌐 Trigger HTTP (Let's Encrypt Challenge vorbereiten)"
echo "----------------------------------------------------"

for domain in "${DOMAINS[@]}"; do
  echo "→ http://$domain"
  curl -s -o /dev/null -w "%{http_code}\n" "http://$domain" || echo "❌ HTTP FAIL"
done

echo ""
echo "🔐 Trigger HTTPS (Zertifikat anfordern)"
echo "----------------------------------------------------"

for domain in "${DOMAINS[@]}"; do
  echo "→ https://$domain"
  curl -k -s -o /dev/null -w "%{http_code}\n" "https://$domain" || echo "❌ HTTPS FAIL"
done

echo ""
echo "⏳ Warte 5 Sekunden für ACME..."
sleep 5

echo ""
echo "📜 Zertifikate prüfen (acme.json)"
echo "----------------------------------------------------"

if [ -f data/traefik/letsencrypt/acme.json ]; then
  cat data/traefik/letsencrypt/acme.json | grep -E "main|sans"
else
  echo "❌ acme.json nicht gefunden!"
fi

echo ""
echo "✅ Fertig!"
echo "======================================="
