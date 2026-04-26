/**
 * GET /actuator/metrics — list of all available metric names.
 * Admin only.
 */
import { NextResponse } from "next/server";
import { actuatorController } from "@/infrastructure/api/controllers/ActuatorController";
import { checkAdminAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const access = await checkAdminAccess(req);
  if (!access.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: access.httpStatus });
  }
  const result = await actuatorController.metricsList();
  return NextResponse.json(result);
}
