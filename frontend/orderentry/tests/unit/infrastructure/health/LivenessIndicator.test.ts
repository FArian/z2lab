import { describe, it, expect } from "vitest";
import { LivenessIndicator } from "@/infrastructure/health/LivenessIndicator";

describe("LivenessIndicator", () => {
  it("always returns UP and reports uptimeSec", async () => {
    const indicator = new LivenessIndicator();
    const result = await indicator.check();

    expect(result.name).toBe("liveness");
    expect(result.status).toBe("UP");
    expect(typeof result.details["uptimeSec"]).toBe("number");
    expect(result.details["uptimeSec"]).toBeGreaterThanOrEqual(0);
  });

  it("belongs only to liveness group (NOT readiness)", () => {
    const indicator = new LivenessIndicator();
    expect(indicator.groups).toEqual(["liveness"]);
  });
});
