/**
 * HealthIndicatorRegistry — production wiring for the HealthService.
 *
 * Single source of truth for the indicators exposed via /actuator/health.
 * Tests construct their own HealthService directly with mock indicators.
 */
import { HealthService } from "@/application/services/HealthService";
import { livenessIndicator }        from "./LivenessIndicator";
import { databaseHealthIndicator }  from "./DatabaseHealthIndicator";
import { fhirHealthIndicator }      from "./FhirHealthIndicator";

export const healthService = new HealthService([
  livenessIndicator,
  databaseHealthIndicator,
  fhirHealthIndicator,
]);
