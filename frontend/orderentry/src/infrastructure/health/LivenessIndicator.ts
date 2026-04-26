/**
 * LivenessIndicator — minimal probe used by Docker / Kubernetes liveness checks.
 *
 * The Node.js process is alive if this code runs at all, so the indicator
 * always returns UP. It exists so /actuator/health/liveness can return a
 * uniform shape without bringing in heavyweight dependencies.
 *
 * Reports `details.uptimeSec` for trend monitoring.
 */
import type { HealthCheckResult } from "@/domain/entities/HealthCheckResult";
import type { HealthGroup, IHealthIndicator } from "@/application/interfaces/health/IHealthIndicator";

export class LivenessIndicator implements IHealthIndicator {
  readonly name   = "liveness";
  readonly groups: readonly HealthGroup[] = ["liveness"];

  async check(): Promise<HealthCheckResult> {
    return {
      name:   this.name,
      status: "UP",
      details: {
        uptimeSec: Math.round(process.uptime()),
      },
    };
  }
}

export const livenessIndicator = new LivenessIndicator();
