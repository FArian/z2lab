---
name: Error Monitoring Plan (Loki + Grafana)
description: Geplante Error/Log-Monitoring-Lösung — Loki + Promtail in den bestehenden Docker-Stack, lesbar in der schon vorhandenen Grafana-UI. Decision-Memo aus 2026-04-26 für späteres Setup.
type: project
---

**Status:** Geplant, noch nicht implementiert. Eintrag in CLAUDE.md → "Pending Work".

**Why:** Grafana ist schon im Einsatz, Prometheus für Metrics ebenfalls. Loki ist die natürliche Logs-Komponente desselben "LGTM"-Stacks (Loki/Grafana/Tempo/Mimir). Keine neue UI lernen, kein zweites Konto-System, alles bleibt zentral. Sentry/GlitchTip wurden verworfen weil sie eigene UI mitbringen und der reine Use-Case ("Errors sehen + Alerts") mit Loki erfüllt ist.

**Verworfen:**
- **Elasticsearch / OpenSearch** — zu schwer (~2 GB RAM), Lizenz-Drama, Volltext-Suche wird nicht gebraucht
- **GlitchTip / Sentry-Self-Hosted** — eigene UI, Issue-Workflow nicht nötig
- **PostHog / Highlight.io** — Analytics + Replay nicht nötig
- **SigNoz** — wäre All-in-One Datadog-Klon, Komplexität nicht gerechtfertigt da Logger/Metrics schon stehen

**Konkretes Setup (~30 Min):**

1. **2 Container** in `infrastructure/docker/docker-compose.yml`:
   - `grafana/loki:latest` — Storage + Query-Engine, ~200 MB RAM, Port 3100 (intern)
   - `grafana/promtail:latest` — Tail-Agent, ~50 MB, mountet `orderentry.log`

2. **Promtail-Config** (`./data/promtail/promtail-config.yaml`, ~30 Zeilen):
   - `scrape_configs.job_name: z2lab` — liest `/var/log/orderentry/orderentry.log`
   - Labels: `app=z2lab`, `env=$ENV`
   - Pipeline-Stage `json` → extrahiert `level`, `ctx`, `msg` als Indizes

3. **Volume-Mount** zwischen z2Lab und Promtail:
   - z2Lab Container: `ORDERENTRY_LOG__FILE=/var/log/orderentry/orderentry.log`
   - Promtail Container: `/var/log/orderentry:/var/log/orderentry:ro`
   - Shared Docker Volume

4. **In Grafana:** Add Datasource → Loki → URL `http://loki:3100` → Save

5. **Erste Queries (LogQL):**
   - Live Tail: `{app="z2lab"} | json`
   - Errors: `{app="z2lab"} | json | level="error"`
   - Error-Rate: `sum(rate({app="z2lab"} | json | level="error" [5m]))`
   - Top-Module: `topk(10, sum by (ctx) (count_over_time({app="z2lab"} | json | level="error" [1h])))`

6. **Alerts** in Grafana → Slack/Mail via Webhooks (z.B. „mehr als 5 errors in 10 min")

**Voraussetzung erfüllt:** Logger schreibt schon strukturierte JSON-Lines (`time`, `level`, `ctx`, `msg`) — Promtails JSON-Pipeline kann sie nativ parsen, kein Logger-Refactor nötig.

**Aufwand:**
| Schritt | Zeit |
|---|---|
| docker-compose erweitern | 10 Min |
| Promtail-Config schreiben + mounten | 10 Min |
| Grafana Datasource + erstes Dashboard | 10 Min |
| **Total** | **~30 Min** |

**Vorgeschlagene Folge-Schritte (optional, für später):**
- **Tempo** für Distributed Tracing (OTel ist im Code schon vorbereitet, opt-in via `ENABLE_TRACING=true`)
- **Mimir** statt Prometheus wenn Metrics-Retention > 15 Tage gebraucht wird
