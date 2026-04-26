/**
 * GET /actuator/health — full aggregated health report.
 * Public. Component details are included only when the caller is admin.
 *
 * HTTP status follows Spring conventions:
 *   200 → UP / UNKNOWN
 *   503 → DOWN / OUT_OF_SERVICE
 */
import { NextResponse } from "next/server";
import { actuatorController } from "@/infrastructure/api/controllers/ActuatorController";
import { checkAdminAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const access = await checkAdminAccess(req);
  const includeDetails = access.authorized;
  const result = await actuatorController.healthCheck(undefined, includeDetails);
  const { httpStatus, ...body } = result;
  return NextResponse.json(body, { status: httpStatus ?? 200 });
}
