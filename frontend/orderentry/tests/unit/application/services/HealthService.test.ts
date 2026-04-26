import { describe, it, expect } from "vitest";
import { HealthService, aggregate } from "@/application/services/HealthService";
import type { HealthCheckResult } from "@/domain/entities/HealthCheckResult";
import type { HealthStatus } from "@/domain/entities/HealthStatus";
import type { HealthGroup, IHealthIndicator } from "@/application/interfaces/health/IHealthIndicator";

class StubIndicator implements IHealthIndicator {
  constructor(
    readonly name: string,
    readonly status: HealthStatus,
    readonly groups: readonly HealthGroup[] = ["readiness"],
    private readonly details: Record<string, unknown> = {},
  ) {}

  async check(): Promise<HealthCheckResult> {
    return { name: this.name, status: this.status, details: this.details };
  }
}

describe("aggregate()", () => {
  it("returns UP when no results", () => {
    const result = aggregate([]);
    expect(result.status).toBe("UP");
    expect(result.components).toEqual({});
  });

  it("returns UP when all UP", () => {
    const result = aggregate([
      { name: "a", status: "UP", details: {} },
      { name: "b", status: "UP", details: {} },
    ]);
    expect(result.status).toBe("UP");
    expect(Object.keys(result.components)).toHaveLength(2);
  });

  it("returns DOWN when any DOWN — beats UNKNOWN, OUT_OF_SERVICE, UP", () => {
    const result = aggregate([
      { name: "a", status: "UP",             details: {} },
      { name: "b", status: "UNKNOWN",        details: {} },
      { name: "c", status: "OUT_OF_SERVICE", details: {} },
      { name: "d", status: "DOWN",           details: {} },
    ]);
    expect(result.status).toBe("DOWN");
  });

  it("returns OUT_OF_SERVICE over UNKNOWN and UP", () => {
    const result = aggregate([
      { name: "a", status: "UP",             details: {} },
      { name: "b", status: "UNKNOWN",        details: {} },
      { name: "c", status: "OUT_OF_SERVICE", details: {} },
    ]);
    expect(result.status).toBe("OUT_OF_SERVICE");
  });

  it("returns UNKNOWN over UP", () => {
    const result = aggregate([
      { name: "a", status: "UP",      details: {} },
      { name: "b", status: "UNKNOWN", details: {} },
    ]);
    expect(result.status).toBe("UNKNOWN");
  });
});

describe("HealthService", () => {
  it("aggregates all indicators when no group is given", async () => {
    const service = new HealthService([
      new StubIndicator("a", "UP"),
      new StubIndicator("b", "DOWN"),
    ]);
    const result = await service.check();
    expect(result.status).toBe("DOWN");
    expect(Object.keys(result.components).sort()).toEqual(["a", "b"]);
  });

  it("filters indicators by group", async () => {
    const service = new HealthService([
      new StubIndicator("liveness", "UP",   ["liveness"]),
      new StubIndicator("db",       "DOWN", ["readiness"]),
    ]);
    const live  = await service.check("liveness");
    const ready = await service.check("readiness");
    expect(live.status).toBe("UP");
    expect(Object.keys(live.components)).toEqual(["liveness"]);
    expect(ready.status).toBe("DOWN");
    expect(Object.keys(ready.components)).toEqual(["db"]);
  });

  it("runs indicators in parallel (no sequential ordering issue)", async () => {
    const slow: IHealthIndicator = {
      name: "slow", groups: ["readiness"],
      check: async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { name: "slow", status: "UP", details: {} };
      },
    };
    const fast = new StubIndicator("fast", "UP");

    const start = Date.now();
    const result = await new HealthService([slow, fast]).check();
    const took = Date.now() - start;

    expect(result.status).toBe("UP");
    // Parallel: total ~10ms, NOT 20ms (sequential would be ≥ slow + fast)
    expect(took).toBeLessThan(50);
  });

  it("listIndicatorNames returns indicator names in registration order", () => {
    const service = new HealthService([
      new StubIndicator("a", "UP"),
      new StubIndicator("b", "UP"),
    ]);
    expect(service.listIndicatorNames()).toEqual(["a", "b"]);
  });
});
