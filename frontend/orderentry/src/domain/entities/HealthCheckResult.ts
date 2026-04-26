/**
 * HealthCheckResult — outcome of a single health indicator probe.
 *
 * Mirrors Spring Boot Actuator's `Health` object: each indicator returns a
 * status and an opaque `details` map. Details are surfaced to authenticated
 * callers but stripped (or summarised) for unauthenticated `/actuator/health`
 * responses to avoid information leaks.
 */
import type { HealthStatus } from "./HealthStatus";

export interface HealthCheckResult {
  /** Indicator name, e.g. "db", "fhir", "liveness". */
  readonly name:    string;
  readonly status:  HealthStatus;
  /** Free-form diagnostic details (latency, version, error code, …). */
  readonly details: Readonly<Record<string, unknown>>;
}

export function buildHealthCheckResult(
  name: string,
  status: HealthStatus,
  details: Record<string, unknown> = {},
): HealthCheckResult {
  return { name, status, details };
}
