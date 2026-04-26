/**
 * FhirHealthIndicator — pings the FHIR server's CapabilityStatement endpoint.
 *
 * GET <fhirBaseUrl>/metadata is the FHIR-standard liveness check. We use
 * `accept: application/fhir+json` and a short timeout so a slow HAPI doesn't
 * stall /actuator/health.
 *
 * Belongs to the "readiness" group only — if FHIR is briefly down we want
 * Kubernetes to stop routing traffic, but we do NOT want Docker to restart
 * the container (that would mask the real failure and produce a restart loop).
 *
 * Result cache: 5 seconds.
 *
 * Constructor accepts `fetchFn` for testability — production code uses
 * the global fetch.
 */
import type { HealthCheckResult } from "@/domain/entities/HealthCheckResult";
import type { HealthGroup, IHealthIndicator } from "@/application/interfaces/health/IHealthIndicator";
import type { HealthStatus } from "@/domain/entities/HealthStatus";
import { EnvConfig } from "@/infrastructure/config/EnvConfig";

const CACHE_TTL_MS = 5000;

export class FhirHealthIndicator implements IHealthIndicator {
  readonly name   = "fhir";
  readonly groups: readonly HealthGroup[] = ["readiness"];

  private cached:    HealthCheckResult | null = null;
  private cachedAt:  number = 0;

  constructor(
    private readonly baseUrl: string = EnvConfig.fhirBaseUrl,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async check(timeoutMs = 2000): Promise<HealthCheckResult> {
    const now = Date.now();
    if (this.cached && now - this.cachedAt < CACHE_TTL_MS) {
      return this.cached;
    }

    const start = Date.now();
    const probe = await runProbe(this.baseUrl, this.fetchFn, timeoutMs);
    const took  = Date.now() - start;

    const result: HealthCheckResult = {
      name:   this.name,
      status: probe.status,
      details: {
        baseUrl:   this.baseUrl,
        latencyMs: took,
        ...(probe.httpStatus !== undefined ? { httpStatus: probe.httpStatus } : {}),
        ...(probe.error ? { error: probe.error } : {}),
      },
    };
    this.cached   = result;
    this.cachedAt = now;
    return result;
  }
}

interface ProbeOutcome {
  status:      HealthStatus;
  httpStatus?: number;
  error?:      string;
}

async function runProbe(
  baseUrl: string,
  fetchFn: typeof fetch,
  timeoutMs: number,
): Promise<ProbeOutcome> {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = baseUrl.replace(/\/+$/, "") + "/metadata";
    const res = await fetchFn(url, {
      method: "GET",
      headers: { accept: "application/fhir+json" },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (res.ok) {
      return { status: "UP", httpStatus: res.status };
    }
    return { status: "DOWN", httpStatus: res.status, error: `FHIR ${res.status}` };
  } catch (err) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    return { status: "DOWN", error: message };
  }
}

export const fhirHealthIndicator = new FhirHealthIndicator();
