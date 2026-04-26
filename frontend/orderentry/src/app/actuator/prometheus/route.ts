/**
 * GET /actuator/prometheus — Prometheus text-exposition scrape endpoint.
 *
 * Auth (matches /api/metrics):
 *   - METRICS_TOKEN env var set → Authorization: Bearer <token>
 *   - Otherwise                  → admin session or Bearer JWT/PAT
 */
import { actuatorController } from "@/infrastructure/api/controllers/ActuatorController";
import { checkAdminAccess } from "@/lib/auth";
import { EnvConfig } from "@/infrastructure/config/EnvConfig";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const unauthorized = new Response("Unauthorized", {
    status: 401,
    headers: { "www-authenticate": 'Bearer realm="zetlab metrics"' },
  });

  const metricsToken = EnvConfig.metricsToken;

  if (metricsToken) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${metricsToken}`) return unauthorized;
  } else {
    const access = await checkAdminAccess(req);
    if (!access.authorized) return unauthorized;
  }

  const { body, contentType } = await actuatorController.prometheus();
  return new Response(body, {
    status: 200,
    headers: { "content-type": contentType },
  });
}
