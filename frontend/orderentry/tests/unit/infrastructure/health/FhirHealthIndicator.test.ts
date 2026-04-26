import { describe, it, expect, vi } from "vitest";
import { FhirHealthIndicator } from "@/infrastructure/health/FhirHealthIndicator";

const BASE_URL = "http://fhir-test/fhir";

function makeFetch(status: number, ok = status < 400): typeof fetch {
  return vi.fn().mockResolvedValue({ ok, status }) as unknown as typeof fetch;
}

describe("FhirHealthIndicator", () => {
  it("returns UP when /metadata responds 200", async () => {
    const fetchFn = makeFetch(200);
    const indicator = new FhirHealthIndicator(BASE_URL, fetchFn);
    const result = await indicator.check();

    expect(result.name).toBe("fhir");
    expect(result.status).toBe("UP");
    expect(result.details["baseUrl"]).toBe(BASE_URL);
    expect(result.details["httpStatus"]).toBe(200);
    expect(fetchFn).toHaveBeenCalledWith(
      "http://fhir-test/fhir/metadata",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns DOWN when /metadata responds 503", async () => {
    const fetchFn = makeFetch(503, false);
    const indicator = new FhirHealthIndicator(BASE_URL, fetchFn);
    const result = await indicator.check();

    expect(result.status).toBe("DOWN");
    expect(result.details["error"]).toBe("FHIR 503");
  });

  it("returns DOWN when fetch throws", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    const indicator = new FhirHealthIndicator(BASE_URL, fetchFn);
    const result = await indicator.check();

    expect(result.status).toBe("DOWN");
    expect(result.details["error"]).toBe("ECONNREFUSED");
  });

  it("strips trailing slash from base URL", async () => {
    const fetchFn = makeFetch(200);
    const indicator = new FhirHealthIndicator("http://fhir-test/fhir/", fetchFn);
    await indicator.check();

    expect(fetchFn).toHaveBeenCalledWith(
      "http://fhir-test/fhir/metadata",
      expect.anything(),
    );
  });

  it("caches the result for 5 seconds", async () => {
    const fetchFn = makeFetch(200);
    const indicator = new FhirHealthIndicator(BASE_URL, fetchFn);
    await indicator.check();
    await indicator.check();
    await indicator.check();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("belongs only to readiness group (NOT liveness)", () => {
    const indicator = new FhirHealthIndicator(BASE_URL, makeFetch(200));
    expect(indicator.groups).toEqual(["readiness"]);
  });
});
