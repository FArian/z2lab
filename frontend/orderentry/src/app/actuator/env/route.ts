/**
 * GET /actuator/env — environment properties (Spring-style).
 * Admin only. Reuses EnvController whitelist + secret masking.
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
  const result = await actuatorController.envProperties();
  return NextResponse.json(result);
}
