/**
 * GET  /actuator/loggers/{name} — current configured + effective level.
 * POST /actuator/loggers/{name} — change the level at runtime (no restart).
 *
 * Admin only. Only the ROOT logger is supported (the app uses one global level).
 *
 * POST body (Spring-compatible):
 *   { "configuredLevel": "DEBUG" }     ← set
 *   { "configuredLevel": null }        ← reset to default
 */
import { NextResponse } from "next/server";
import { actuatorController } from "@/infrastructure/api/controllers/ActuatorController";
import { checkAdminAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ name: string }> },
): Promise<NextResponse> {
  const access = await checkAdminAccess(req);
  if (!access.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: access.httpStatus });
  }
  const { name } = await ctx.params;
  const result = actuatorController.loggerByName(name);
  if (!result) {
    return NextResponse.json(
      { error: `Logger "${name}" not found. Only "ROOT" is supported.` },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ name: string }> },
): Promise<NextResponse> {
  const access = await checkAdminAccess(req);
  if (!access.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: access.httpStatus });
  }
  const { name } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { configuredLevel?: unknown };
  const result = await actuatorController.updateLogger(name, body);
  const { httpStatus, ...rest } = result;
  return NextResponse.json(rest, { status: httpStatus ?? 200 });
}
