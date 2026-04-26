/**
 * ActuatorDto — Spring Boot Actuator-compatible DTOs.
 *
 * Shapes match Spring Actuator's response format so existing monitoring tools
 * (Spring Boot Admin, Prometheus operators, Grafana dashboards expecting
 * actuator) can consume them unchanged.
 */
import type { HealthStatus } from "@/domain/entities/HealthStatus";

// ── /actuator (discovery) ────────────────────────────────────────────────────

export interface ActuatorLink {
  readonly href:      string;
  readonly templated: boolean;
}

export interface ActuatorDiscoveryDto {
  readonly _links: Readonly<Record<string, ActuatorLink>>;
}

// ── /actuator/health, /actuator/health/{group} ───────────────────────────────

export interface HealthComponentDto {
  readonly status:   HealthStatus;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface HealthResponseDto {
  readonly status:      HealthStatus;
  readonly components?: Readonly<Record<string, HealthComponentDto>>;
  /** Internal — stripped before sending; carries the response HTTP status. */
  readonly httpStatus?: number;
}

// ── /actuator/info ────────────────────────────────────────────────────────────

export interface InfoResponseDto {
  readonly app: {
    readonly name:        string;
    readonly description: string;
    readonly version:     string;
    readonly labOrgId:    string;
    readonly labName:     string;
  };
  readonly build: {
    readonly time:        string;
    readonly nodeVersion: string;
  };
  readonly runtime: {
    readonly platform:  string;
    readonly arch:      string;
    readonly uptimeSec: number;
    readonly pid:       number;
  };
}

// ── /actuator/metrics ────────────────────────────────────────────────────────

export interface MetricsListDto {
  readonly names: readonly string[];
}

export interface MetricMeasurementDto {
  readonly statistic: "VALUE" | "COUNT" | "TOTAL_TIME" | "MAX";
  readonly value:     number;
}

export interface MetricTagDto {
  readonly tag:    string;
  readonly values: readonly string[];
}

export interface MetricDetailDto {
  readonly name:               string;
  readonly description?:       string;
  readonly baseUnit?:          string;
  readonly measurements:       readonly MetricMeasurementDto[];
  readonly availableTags:      readonly MetricTagDto[];
  /** Internal — stripped before sending; 404 when metric not found. */
  readonly httpStatus?:        number;
}

// ── /actuator/loggers, /actuator/loggers/{name} ──────────────────────────────

export type LoggerLevel =
  | "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "OFF";

export interface LoggerConfigDto {
  readonly configuredLevel: LoggerLevel | null;
  readonly effectiveLevel:  LoggerLevel;
}

export interface LoggersResponseDto {
  readonly levels:  readonly LoggerLevel[];
  readonly loggers: Readonly<Record<string, LoggerConfigDto>>;
}

export interface LoggerUpdateRequestDto {
  readonly configuredLevel: LoggerLevel | null;
}

export interface LoggerUpdateResponseDto {
  readonly ok:              boolean;
  readonly configuredLevel: LoggerLevel | null;
  readonly effectiveLevel:  LoggerLevel;
  /** Internal — stripped before sending; carries the response HTTP status. */
  readonly httpStatus?:     number;
  readonly message?:        string;
}

// ── /actuator/env (alias on top of EnvController) ─────────────────────────────

export interface EnvPropertyDto {
  readonly name:  string;
  readonly value: string;
}

export interface EnvResponseDto {
  readonly activeProfiles:  readonly string[];
  readonly propertySources: ReadonlyArray<{
    readonly name:       string;
    readonly properties: Readonly<Record<string, { value: string }>>;
  }>;
}
