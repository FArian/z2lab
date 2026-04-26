/**
 * GET /actuator/metrics/{name} — values + tags for a single metric.
 * Admin only. Returns 404 if the metric is not registered.
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
  const result = await actuatorController.metricDetail(name);
  const { httpStatus, ...body } = result;
  return NextResponse.json(body, { status: httpStatus ?? 200 });
}
