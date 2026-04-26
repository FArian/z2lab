/**
 * IHealthIndicator — application-layer contract for one health probe.
 *
 * Implementations live under `infrastructure/health/`. They MUST:
 *   - Return UP / DOWN / UNKNOWN / OUT_OF_SERVICE (never throw)
 *   - Honour the timeoutMs argument (default 2000) — no hanging probes
 *   - Be safe to call on every /actuator/health request (cheap or cached)
 *
 * Indicators are registered in HealthIndicatorRegistry and can be tagged with
 * one or more groups: "liveness" (process alive) or "readiness" (ready for
 * traffic). The same indicator may belong to multiple groups.
 */
import type { HealthCheckResult } from "@/domain/entities/HealthCheckResult";

export type HealthGroup = "liveness" | "readiness";

export interface IHealthIndicator {
  /** Unique short name, e.g. "db", "fhir", "liveness". */
  readonly name: string;

  /** Probe groups this indicator belongs to. */
  readonly groups: readonly HealthGroup[];

  /**
   * Run the probe. Must complete within `timeoutMs` (default 2000).
   * Implementations MUST catch their own errors and return DOWN with
   * `details.error` instead of throwing.
   */
  check(timeoutMs?: number): Promise<HealthCheckResult>;
}
