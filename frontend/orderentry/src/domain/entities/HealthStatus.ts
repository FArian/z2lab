/**
 * HealthStatus — Spring Boot Actuator-compatible health states.
 *
 * Used by the /actuator/health endpoint family. Order of severity:
 *   UP             > all is well
 *   UNKNOWN        > probe could not be evaluated (treat as best-effort UP)
 *   OUT_OF_SERVICE > intentionally taken offline (e.g. maintenance mode)
 *   DOWN           > probe failed; component is not usable
 *
 * Aggregate rule (HealthService.aggregate):
 *   - any DOWN              → overall DOWN
 *   - else any OUT_OF_SERVICE → overall OUT_OF_SERVICE
 *   - else any UNKNOWN      → overall UNKNOWN
 *   - else                  → UP
 */
export type HealthStatus = "UP" | "DOWN" | "OUT_OF_SERVICE" | "UNKNOWN";

export const HEALTH_STATUS_VALUES: readonly HealthStatus[] = [
  "UP",
  "UNKNOWN",
  "OUT_OF_SERVICE",
  "DOWN",
] as const;

/** HTTP status mapping per Spring Boot Actuator convention. */
export function httpStatusForHealth(status: HealthStatus): number {
  return status === "DOWN" || status === "OUT_OF_SERVICE" ? 503 : 200;
}
