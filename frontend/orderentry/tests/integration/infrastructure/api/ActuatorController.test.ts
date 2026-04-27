import { describe, it, expect } from "vitest";
import { ActuatorController } from "@/infrastructure/api/controllers/ActuatorController";
import { HealthService } from "@/application/services/HealthService";
import type { HealthCheckResult } from "@/domain/entities/HealthCheckResult";
import type { HealthStatus } from "@/domain/entities/HealthStatus";
import type { HealthGroup, IHealthIndicator } from "@/application/interfaces/health/IHealthIndicator";
import type { EnvController } from "@/infrastructure/api/controllers/EnvController";

class StubIndicator implements IHealthIndicator {
  constructor(
    readonly name: string,
    readonly status: HealthStatus,
    readonly groups: readonly HealthGroup[] = ["readiness"],
    private readonly details: Record<string, unknown> = { hint: "stub" },
  ) {}
  async check(): Promise<HealthCheckResult> {
    return { name: this.name, status: this.status, details: this.details };
  }
}

function makeEnv(vars: Record<string, string>): EnvController {
  return {
    get: async () => ({
      vars: Object.entries(vars).map(([key, value]) => ({ key, value })),
    }),
  } as unknown as EnvController;
}

describe("ActuatorController.discovery", () => {
  it("returns a HAL-style _links map with all expected endpoints", () => {
    const ctrl = new ActuatorController();
    const links = ctrl.discovery()._links;

    expect(links["self"]?.href).toBe("/actuator");
    expect(links["health"]?.href).toBe("/actuator/health");
    expect(links["health-component"]).toEqual({ href: "/actuator/health/{component}", templated: true });
    expect(links["info"]?.href).toBe("/actuator/info");
    expect(links["metrics"]?.href).toBe("/actuator/metrics");
    expect(links["prometheus"]?.href).toBe("/actuator/prometheus");
    expect(links["loggers"]?.href).toBe("/actuator/loggers");
    expect(links["env"]?.href).toBe("/actuator/env");
  });

  it("respects a custom base href", () => {
    const ctrl = new ActuatorController();
    const links = ctrl.discovery("/api/actuator")._links;
    expect(links["health"]?.href).toBe("/api/actuator/health");
  });
});

describe("ActuatorController.healthCheck", () => {
  const mkController = (...indicators: IHealthIndicator[]) =>
    new ActuatorController(new HealthService(indicators));

  it("returns UP with httpStatus 200 when all indicators are UP", async () => {
    const ctrl = mkController(new StubIndicator("a", "UP"), new StubIndicator("b", "UP"));
    const result = await ctrl.healthCheck();
    expect(result.status).toBe("UP");
    expect(result.httpStatus).toBe(200);
  });

  it("returns DOWN with httpStatus 503 when any indicator is DOWN", async () => {
    const ctrl = mkController(new StubIndicator("a", "UP"), new StubIndicator("b", "DOWN"));
    const result = await ctrl.healthCheck();
    expect(result.status).toBe("DOWN");
    expect(result.httpStatus).toBe(503);
  });

  it("strips component details when includeDetails=false", async () => {
    const ctrl = mkController(new StubIndicator("a", "UP", ["readiness"], { secret: "no leak" }));
    const result = await ctrl.healthCheck(undefined, false);
    expect(result.components?.["a"]?.details).toBeUndefined();
    expect(result.components?.["a"]?.status).toBe("UP");
  });

  it("includes component details when includeDetails=true (admin)", async () => {
    const ctrl = mkController(new StubIndicator("a", "UP", ["readiness"], { latencyMs: 5 }));
    const result = await ctrl.healthCheck(undefined, true);
    expect(result.components?.["a"]?.details).toEqual({ latencyMs: 5 });
  });

  it("filters by group", async () => {
    const ctrl = mkController(
      new StubIndicator("liveness", "UP",   ["liveness"]),
      new StubIndicator("db",       "DOWN", ["readiness"]),
    );
    const live  = await ctrl.healthCheck("liveness");
    const ready = await ctrl.healthCheck("readiness");
    expect(live.status).toBe("UP");
    expect(live.httpStatus).toBe(200);
    expect(ready.status).toBe("DOWN");
    expect(ready.httpStatus).toBe(503);
  });
});

describe("ActuatorController.info", () => {
  it("includes app, build and runtime sections with version + node info", () => {
    const ctrl = new ActuatorController();
    const info = ctrl.info();

    expect(info.app.name).toBe("z2lab-orderentry");
    expect(info.app.version).toBeTruthy();
    expect(info.build.nodeVersion).toBe(process.version);
    expect(info.runtime.platform).toBe(process.platform);
    expect(info.runtime.arch).toBe(process.arch);
    expect(typeof info.runtime.pid).toBe("number");
    expect(typeof info.runtime.uptimeSec).toBe("number");
  });
});

describe("ActuatorController.metricsList / metricDetail", () => {
  it("metricsList returns sorted unique metric names", async () => {
    const ctrl = new ActuatorController();
    const list = await ctrl.metricsList();
    // Always-present default metrics
    expect(Array.isArray(list.names)).toBe(true);
    expect(list.names.length).toBeGreaterThan(0);
    // Sorted
    const sorted = [...list.names].sort();
    expect(list.names).toEqual(sorted);
  });

  it("metricDetail returns 404 for unknown metric name", async () => {
    const ctrl = new ActuatorController();
    const detail = await ctrl.metricDetail("definitely_not_a_metric_xyz");
    expect(detail.httpStatus).toBe(404);
    expect(detail.measurements).toEqual([]);
  });
});

describe("ActuatorController.loggers / loggerByName / updateLogger", () => {
  it("loggers() returns ROOT with current level", () => {
    const ctrl = new ActuatorController();
    const loggers = ctrl.loggers();
    expect(loggers.levels).toContain("INFO");
    expect(loggers.loggers["ROOT"]).toBeDefined();
    expect(loggers.loggers["ROOT"]?.configuredLevel).toBe(loggers.loggers["ROOT"]?.effectiveLevel);
  });

  it("loggerByName returns null for unknown name", () => {
    const ctrl = new ActuatorController();
    expect(ctrl.loggerByName("com.acme.Foo")).toBeNull();
  });

  it("updateLogger rejects non-ROOT name with 404", async () => {
    const ctrl = new ActuatorController();
    const result = await ctrl.updateLogger("com.acme.Foo", { configuredLevel: "DEBUG" });
    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(404);
  });

  it("updateLogger rejects invalid level with 400", async () => {
    const ctrl = new ActuatorController();
    const result = await ctrl.updateLogger("ROOT", { configuredLevel: "FATAL" });
    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(400);
    expect(result.message).toMatch(/Invalid level/);
  });

  it("updateLogger accepts case-insensitive valid levels", async () => {
    const ctrl = new ActuatorController();
    const result = await ctrl.updateLogger("ROOT", { configuredLevel: "warn" });
    expect(result.ok).toBe(true);
    expect(result.configuredLevel).toBe("WARN");
    // Reset for other tests
    await ctrl.updateLogger("ROOT", { configuredLevel: null });
  });

  it("TRACE round-trips losslessly (set TRACE → GET shows TRACE, not DEBUG)", async () => {
    const ctrl = new ActuatorController();
    const set = await ctrl.updateLogger("ROOT", { configuredLevel: "TRACE" });
    expect(set.ok).toBe(true);
    expect(set.configuredLevel).toBe("TRACE");
    expect(set.effectiveLevel).toBe("TRACE");

    const get = ctrl.loggerByName("ROOT");
    expect(get?.configuredLevel).toBe("TRACE");
    expect(get?.effectiveLevel).toBe("TRACE");

    // Reset for other tests
    await ctrl.updateLogger("ROOT", { configuredLevel: null });
  });

  it("loggers() exposes all 6 Spring levels including TRACE and OFF", () => {
    const ctrl = new ActuatorController();
    const loggers = ctrl.loggers();
    expect(loggers.levels).toEqual(["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "OFF"]);
  });
});

describe("ActuatorController.envProperties", () => {
  it("returns Spring-shape env with whitelisted properties only", async () => {
    const ctrl = new ActuatorController(undefined, makeEnv({
      ORDERENTRY_FHIR__BASE_URL: "http://hapi:8080/fhir",
      ORDERENTRY_LOG__LEVEL:     "info",
    }));
    const env = await ctrl.envProperties();
    expect(env.activeProfiles.length).toBeGreaterThan(0);
    expect(env.propertySources).toHaveLength(1);
    const props = env.propertySources[0]?.properties;
    expect(props?.["ORDERENTRY_FHIR__BASE_URL"]?.value).toBe("http://hapi:8080/fhir");
    expect(props?.["ORDERENTRY_LOG__LEVEL"]?.value).toBe("info");
  });
});
