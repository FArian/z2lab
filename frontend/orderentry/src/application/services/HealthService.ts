/**
 * HealthService — aggregates multiple IHealthIndicator results.
 *
 * Aggregate rule (Spring Boot Actuator-compatible):
 *   - any DOWN              → DOWN
 *   - else any OUT_OF_SERVICE → OUT_OF_SERVICE
 *   - else any UNKNOWN      → UNKNOWN
 *   - else                  → UP
 *
 * Indicators run in parallel via Promise.all. Each indicator owns its
 * own timeout (passed through); HealthService never throws.
 */
import type { HealthCheckResult } from "@/domain/entities/HealthCheckResult";
import type { HealthStatus }      from "@/domain/entities/HealthStatus";
import type { HealthGroup, IHealthIndicator } from "@/application/interfaces/health/IHealthIndicator";

export interface AggregateHealth {
  readonly status:     HealthStatus;
  /** Individual indicator results, keyed by indicator.name. */
  readonly components: Readonly<Record<string, HealthCheckResult>>;
}

const SEVERITY_RANK: Record<HealthStatus, number> = {
  UP: 0,
  UNKNOWN: 1,
  OUT_OF_SERVICE: 2,
  DOWN: 3,
};

export class HealthService {
  constructor(private readonly indicators: readonly IHealthIndicator[]) {}

  /** Run all indicators (or only those in `group`) and aggregate. */
  async check(group?: HealthGroup, timeoutMs = 2000): Promise<AggregateHealth> {
    const selected = group
      ? this.indicators.filter((i) => i.groups.includes(group))
      : this.indicators;

    const results = await Promise.all(selected.map((i) => i.check(timeoutMs)));
    return aggregate(results);
  }

  /** List all registered indicator names (for /actuator/health discovery). */
  listIndicatorNames(): readonly string[] {
    return this.indicators.map((i) => i.name);
  }
}

export function aggregate(results: readonly HealthCheckResult[]): AggregateHealth {
  const components: Record<string, HealthCheckResult> = {};
  let worstRank = 0;
  let worstStatus: HealthStatus = "UP";

  for (const r of results) {
    components[r.name] = r;
    const rank = SEVERITY_RANK[r.status];
    if (rank > worstRank) {
      worstRank = rank;
      worstStatus = r.status;
    }
  }

  return { status: worstStatus, components };
}
