/**
 * GET /actuator/info — application metadata.
 * Public. Reveals app name, version, build time, runtime info.
 * No secrets, no PII.
 */
import { NextResponse } from "next/server";
import { actuatorController } from "@/infrastructure/api/controllers/ActuatorController";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(actuatorController.info());
}
