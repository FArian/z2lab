import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger, refreshLogLevel, currentLogLevel } from "@/infrastructure/logging/Logger";

describe("Logger trace level", () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let logSpy:   ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let originalLevel: ReturnType<typeof currentLogLevel>;

  beforeEach(() => {
    originalLevel = currentLogLevel();
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    logSpy   = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    debugSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    refreshLogLevel(originalLevel);
  });

  it("is more verbose than debug — emits trace messages when level=trace", () => {
    refreshLogLevel("trace");
    const log = createLogger("test");

    log.trace("trace-msg");
    log.debug("debug-msg");
    log.info("info-msg");

    expect(debugSpy).toHaveBeenCalledTimes(2); // trace + debug both go to console.debug
    expect(logSpy).toHaveBeenCalledTimes(1);   // info → console.log
  });

  it("trace messages are suppressed when level=debug (rank: trace < debug)", () => {
    refreshLogLevel("debug");
    const log = createLogger("test");

    log.trace("hidden");
    log.debug("shown");

    expect(debugSpy).toHaveBeenCalledTimes(1);
    const arg = String(debugSpy.mock.calls[0]?.[0] ?? "");
    expect(arg).toContain('"msg":"shown"');
    expect(arg).not.toContain("hidden");
  });

  it("trace messages carry level=trace in the JSON line", () => {
    refreshLogLevel("trace");
    const log = createLogger("ctx");
    log.trace("hello", { k: "v" });

    expect(debugSpy).toHaveBeenCalledTimes(1);
    const line = String(debugSpy.mock.calls[0]?.[0] ?? "");
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed["level"]).toBe("trace");
    expect(parsed["ctx"]).toBe("ctx");
    expect(parsed["msg"]).toBe("hello");
    expect(parsed["k"]).toBe("v");
  });

  it("silent suppresses everything including trace", () => {
    refreshLogLevel("silent");
    const log = createLogger("test");

    log.trace("a");
    log.debug("b");
    log.info("c");
    log.warn("d");
    log.error("e");

    expect(debugSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
