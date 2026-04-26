/**
 * DatabaseHealthIndicator — pings the application database via `SELECT 1`.
 *
 * Belongs to the "readiness" group: if the DB is unreachable the app cannot
 * serve real traffic, so K8s should stop routing requests to this pod.
 *
 * The probe wraps Prisma in a timeout so a hung connection never blocks
 * /actuator/health beyond `timeoutMs` (default 2000).
 *
 * Result cache: 2 seconds. Within that window subsequent calls return the
 * cached result without touching Prisma — this protects against scrape storms
 * (Prometheus + Docker healthcheck + manual debugging hitting at once).
 */
import type { HealthCheckResult } from "@/domain/entities/HealthCheckResult";
import type { HealthGroup, IHealthIndicator } from "@/application/interfaces/health/IHealthIndicator";
import type { HealthStatus } from "@/domain/entities/HealthStatus";

import { prisma } from "@/infrastructure/db/prismaClient";
import { resolveDbConfig } from "@/infrastructure/db/DatabaseConfig";

const CACHE_TTL_MS = 2000;

export class DatabaseHealthIndicator implements IHealthIndicator {
  readonly name   = "db";
  readonly groups: readonly HealthGroup[] = ["readiness"];

  private cached:    HealthCheckResult | null = null;
  private cachedAt:  number = 0;

  async check(timeoutMs = 2000): Promise<HealthCheckResult> {
    const now = Date.now();
    if (this.cached && now - this.cachedAt < CACHE_TTL_MS) {
      return this.cached;
    }

    const start  = Date.now();
    const status = await runProbe(timeoutMs);
    const took   = Date.now() - start;

    const result: HealthCheckResult = {
      name:   this.name,
      status: status.status,
      details: {
        provider:  resolveDbConfig().provider,
        latencyMs: took,
        ...(status.error ? { error: status.error } : {}),
      },
    };
    this.cached   = result;
    this.cachedAt = now;
    return result;
  }
}

interface ProbeOutcome {
  status: HealthStatus;
  error?: string;
}

async function runProbe(timeoutMs: number): Promise<ProbeOutcome> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, timeoutMs);
    return { status: "UP" };
  } catch (err) {
    return {
      status: "DOWN",
      error:  err instanceof Error ? err.message : String(err),
    };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`probe timed out after ${ms}ms`)), ms);
    promise
      .then((v) => { clearTimeout(timer); resolve(v); })
      .catch((e: unknown) => { clearTimeout(timer); reject(e instanceof Error ? e : new Error(String(e))); });
  });
}

export const databaseHealthIndicator = new DatabaseHealthIndicator();
