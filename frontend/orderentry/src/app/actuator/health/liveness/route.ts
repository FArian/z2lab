/**
 * GET /actuator/health/liveness — Kubernetes-style liveness probe.
 * Public. Reports only the LivenessIndicator (process-alive check).
 * Used by Docker healthcheck.
 */
import { NextResponse } from "next/server";
import { actuatorController } from "@/infrastructure/api/controllers/ActuatorController";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const result = await actuatorController.healthCheck("liveness", false);
  const { httpStatus, ...body } = result;
  return NextResponse.json(body, { status: httpStatus ?? 200 });
}
