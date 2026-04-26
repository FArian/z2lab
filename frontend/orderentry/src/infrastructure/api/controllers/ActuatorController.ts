/**
 * ActuatorController — Spring Boot Actuator-compatible endpoints.
 *
 * Routes are defined under src/app/actuator/* (NOT under /api/v1/) because the
 * Spring Boot convention is exactly /actuator/* and existing monitoring tools
 * (Spring Boot Admin, Prometheus operators) expect that path verbatim.
 *
 * Auth (per Spring defaults):
 *   - /actuator                   → public (discovery)
 *   - /actuator/health[/...]      → public
 *   - /actuator/info              → public
 *   - /actuator/metrics[/...]     → admin
 *   - /actuator/prometheus        → METRICS_TOKEN bearer OR admin
 *   - /actuator/loggers[/...]     → admin
 *   - /actuator/env               → admin
 *
 * The controller is constructor-injectable (HealthService, fetchFn) so tests
 * can run it without touching real DB / FHIR / disk.
 */

import { healthService as defaultHealthService } from "@/infrastructure/health/HealthIndicatorRegistry";
import type { HealthService } from "@/application/services/HealthService";
import type { HealthGroup }   from "@/application/interfaces/health/IHealthIndicator";
import { httpStatusForHealth } from "@/domain/entities/HealthStatus";

import { envController as defaultEnvController } from "./EnvController";
import type { EnvController } from "./EnvController";

import { prometheusService } from "@/infrastructure/metrics/PrometheusService";
import { EnvConfig }         from "@/infrastructure/config/EnvConfig";
import {
  refreshLogLevel,
  currentLogLevel,
  type LogLevel,
} from "@/infrastructure/logging/Logger";
import { saveOverrides } from "@/infrastructure/config/RuntimeConfig";

import type {
  ActuatorDiscoveryDto,
  HealthResponseDto,
  HealthComponentDto,
  InfoResponseDto,
  MetricsListDto,
  MetricDetailDto,
  MetricMeasurementDto,
  LoggerLevel,
  LoggerConfigDto,
  LoggersResponseDto,
  LoggerUpdateResponseDto,
  EnvResponseDto,
} from "../dto/ActuatorDto";

// ── Logger level mapping (Spring ↔ z2Lab) ────────────────────────────────────

const SPRING_LEVELS: readonly LoggerLevel[] = [
  "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "OFF",
];

function toSpringLevel(level: LogLevel): LoggerLevel {
  switch (level) {
    case "debug":  return "DEBUG";
    case "info":   return "INFO";
    case "warn":   return "WARN";
    case "error":  return "ERROR";
    case "silent": return "OFF";
  }
}

function toAppLevel(level: LoggerLevel): LogLevel | null {
  switch (level) {
    case "TRACE":
    case "DEBUG": return "debug";
    case "INFO":  return "info";
    case "WARN":  return "warn";
    case "ERROR": return "error";
    case "OFF":   return "silent";
  }
}

function isLoggerLevel(s: unknown): s is LoggerLevel {
  return typeof s === "string" && (SPRING_LEVELS as readonly string[]).includes(s);
}

// ── Controller ────────────────────────────────────────────────────────────────

export class ActuatorController {
  constructor(
    private readonly health: HealthService = defaultHealthService,
    private readonly env:    EnvController = defaultEnvController,
  ) {}

  // ── Discovery ─────────────────────────────────────────────────────────────

  discovery(baseHref = "/actuator"): ActuatorDiscoveryDto {
    const link = (path: string, templated = false) => ({
      href: `${baseHref}${path}`,
      templated,
    });
    return {
      _links: {
        self:                  link(""),
        health:                link("/health"),
        "health-component":    link("/health/{component}", true),
        "health-path":         link("/health/{*path}", true),
        info:                  link("/info"),
        metrics:               link("/metrics"),
        "metrics-requiredMetricName": link("/metrics/{requiredMetricName}", true),
        prometheus:            link("/prometheus"),
        loggers:               link("/loggers"),
        "loggers-name":        link("/loggers/{name}", true),
        env:                   link("/env"),
      },
    };
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async healthCheck(group?: HealthGroup, includeDetails = false): Promise<HealthResponseDto> {
    const aggregate = await this.health.check(group);
    const components: Record<string, HealthComponentDto> = {};
    for (const [name, result] of Object.entries(aggregate.components)) {
      components[name] = {
        status:  result.status,
        ...(includeDetails ? { details: result.details } : {}),
      };
    }
    return {
      status:     aggregate.status,
      components,
      httpStatus: httpStatusForHealth(aggregate.status),
    };
  }

  // ── Info ──────────────────────────────────────────────────────────────────

  info(): InfoResponseDto {
    const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
    return {
      app: {
        name:        "z2lab-orderentry",
        description: "z2Lab OrderEntry — laboratory order entry system",
        version,
        labOrgId:    EnvConfig.labOrgId,
        labName:     EnvConfig.labName,
      },
      build: {
        time:        extractBuildTime(version),
        nodeVersion: process.version,
      },
      runtime: {
        platform:  process.platform,
        arch:      process.arch,
        uptimeSec: Math.round(process.uptime()),
        pid:       process.pid,
      },
    };
  }

  // ── Metrics list ──────────────────────────────────────────────────────────

  async metricsList(): Promise<MetricsListDto> {
    const all = await prometheusService.registry.getMetricsAsJSON();
    const names = all.map((m) => m.name).sort();
    return { names };
  }

  // ── Single metric ─────────────────────────────────────────────────────────

  async metricDetail(name: string): Promise<MetricDetailDto> {
    const all = await prometheusService.registry.getMetricsAsJSON();
    const metric = all.find((m) => m.name === name);
    if (!metric) {
      return {
        name,
        measurements:  [],
        availableTags: [],
        httpStatus:    404,
      };
    }
    return summariseMetric({
      name:   metric.name,
      help:   metric.help,
      type:   normaliseMetricType(metric.type),
      values: (metric.values ?? []).map((v) => {
        const labels = v.labels as Record<string, string> | undefined;
        return labels
          ? { value: Number(v.value ?? 0), labels }
          : { value: Number(v.value ?? 0) };
      }),
    });
  }

  // ── Prometheus alias ──────────────────────────────────────────────────────

  async prometheus(): Promise<{ body: string; contentType: string }> {
    const body = await prometheusService.metrics();
    return { body, contentType: prometheusService.contentType };
  }

  // ── Loggers list ──────────────────────────────────────────────────────────

  loggers(): LoggersResponseDto {
    const level = toSpringLevel(currentLogLevel());
    const root: LoggerConfigDto = {
      configuredLevel: level,
      effectiveLevel:  level,
    };
    return {
      levels:  SPRING_LEVELS,
      loggers: { ROOT: root },
    };
  }

  // ── Single logger ─────────────────────────────────────────────────────────

  loggerByName(name: string): LoggerConfigDto | null {
    if (name !== "ROOT") return null;
    const level = toSpringLevel(currentLogLevel());
    return { configuredLevel: level, effectiveLevel: level };
  }

  // ── Update logger level ───────────────────────────────────────────────────

  async updateLogger(
    name: string,
    body: { configuredLevel?: unknown },
  ): Promise<LoggerUpdateResponseDto> {
    if (name !== "ROOT") {
      return {
        ok:              false,
        configuredLevel: null,
        effectiveLevel:  toSpringLevel(currentLogLevel()),
        httpStatus:      404,
        message:         `Logger "${name}" not found. Only "ROOT" is supported.`,
      };
    }

    const raw = body.configuredLevel;
    if (raw === null) {
      // Reset to default
      await saveOverrides({ LOG_LEVEL: null });
      const next = refreshLogLevel(undefined);
      return {
        ok:              true,
        configuredLevel: null,
        effectiveLevel:  toSpringLevel(next),
      };
    }

    const upper = typeof raw === "string" ? raw.toUpperCase() : "";
    if (!isLoggerLevel(upper)) {
      return {
        ok:              false,
        configuredLevel: null,
        effectiveLevel:  toSpringLevel(currentLogLevel()),
        httpStatus:      400,
        message:         `Invalid level "${String(raw)}". Allowed: ${SPRING_LEVELS.join(", ")}.`,
      };
    }

    const appLevel = toAppLevel(upper);
    if (appLevel === null) {
      // Should never happen since isLoggerLevel covers all branches
      return {
        ok:              false,
        configuredLevel: null,
        effectiveLevel:  toSpringLevel(currentLogLevel()),
        httpStatus:      400,
        message:         `Unsupported level "${upper}".`,
      };
    }

    await saveOverrides({ LOG_LEVEL: appLevel });
    const next = refreshLogLevel(appLevel);
    return {
      ok:              true,
      configuredLevel: upper,
      effectiveLevel:  toSpringLevel(next),
    };
  }

  // ── Env ───────────────────────────────────────────────────────────────────

  async envProperties(): Promise<EnvResponseDto> {
    const { vars } = await this.env.get();
    const properties: Record<string, { value: string }> = {};
    for (const { key, value } of vars) {
      properties[key] = { value };
    }
    return {
      activeProfiles:  [process.env.NODE_ENV ?? "development"],
      propertySources: [
        { name: "process.env (whitelisted)", properties },
      ],
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Pull the build timestamp out of a version string like "v0.1+12-abc@main (2026-04-27T12:00:00.000Z)". */
function extractBuildTime(version: string): string {
  const match = version.match(/\(([^)]+)\)\s*$/);
  return match?.[1] ?? "";
}

interface PromMetric {
  name:    string;
  help:    string;
  type:    string;
  values:  Array<{ value: number; labels?: Record<string, string> }>;
}

/**
 * Normalise prom-client's metric.type to the lowercase string we switch on.
 * At runtime the registry returns "counter"/"gauge"/"histogram"/"summary",
 * but the TypeScript declaration says MetricType (numeric enum). Handle both.
 */
function normaliseMetricType(t: unknown): string {
  if (typeof t === "string") return t.toLowerCase();
  switch (t) {
    case 0: return "counter";
    case 1: return "gauge";
    case 2: return "histogram";
    case 3: return "summary";
    default: return "unknown";
  }
}

function summariseMetric(metric: PromMetric): MetricDetailDto {
  const measurements: MetricMeasurementDto[] = [];
  const tagValues: Record<string, Set<string>> = {};

  if (metric.type === "counter" || metric.type === "gauge") {
    const total = metric.values.reduce((acc, v) => acc + v.value, 0);
    const stat = metric.type === "counter" ? "COUNT" : "VALUE";
    measurements.push({ statistic: stat, value: total });
  } else if (metric.type === "histogram" || metric.type === "summary") {
    let count = 0;
    let sum = 0;
    let max = 0;
    for (const v of metric.values) {
      const labels = v.labels ?? {};
      if (labels["quantile"] !== undefined || labels["le"] !== undefined) continue;
      // sum / count come without quantile/le
      // prom-client exposes them as the same metric name suffixed _sum / _count;
      // here we approximate by scanning all values
      count += v.value;
      sum   += v.value;
      if (v.value > max) max = v.value;
    }
    measurements.push({ statistic: "COUNT",     value: count });
    measurements.push({ statistic: "TOTAL_TIME", value: sum });
    measurements.push({ statistic: "MAX",       value: max });
  }

  for (const v of metric.values) {
    if (!v.labels) continue;
    for (const [tag, val] of Object.entries(v.labels)) {
      if (tag === "quantile" || tag === "le") continue;
      (tagValues[tag] ??= new Set()).add(val);
    }
  }

  const availableTags = Object.entries(tagValues).map(([tag, set]) => ({
    tag,
    values: [...set].sort(),
  }));

  return {
    name:         metric.name,
    description:  metric.help,
    measurements,
    availableTags,
  };
}

// ── Singleton ────────────────────────────────────────────────────────────────

export const actuatorController = new ActuatorController();
