/**
 * GET /actuator/loggers — list all configured loggers and supported levels.
 * Admin only. The app exposes a single global "ROOT" logger.
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
  return NextResponse.json(actuatorController.loggers());
}
