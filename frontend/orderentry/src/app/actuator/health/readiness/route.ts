/**
 * GET /actuator/health/readiness — Kubernetes-style readiness probe.
 * Public. Aggregates readiness-tagged indicators (DB + FHIR).
 * Used to gate traffic — e.g. K8s readinessProbe.
 */
import { NextResponse } from "next/server";
import { actuatorController } from "@/infrastructure/api/controllers/ActuatorController";
import { checkAdminAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const access = await checkAdminAccess(req);
  const result = await actuatorController.healthCheck("readiness", access.authorized);
  const { httpStatus, ...body } = result;
  return NextResponse.json(body, { status: httpStatus ?? 200 });
}
