/**
 * DELETE /api/v1/admin/bridges/[id] — Remove bridge registration
 * PATCH  /api/v1/admin/bridges/[id] — Revoke bridge (status → revoked)
 * Auth: admin session required.
 */

import { NextResponse, type NextRequest } from "next/server";
import { apiGateway } from "@/infrastructure/api/gateway/ApiGateway";
import { bridgeRegistrationController } from "@/infrastructure/api/controllers/BridgeRegistrationController";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return apiGateway.handle(
    req,
    { version: "v1", endpoint: "/admin/bridges/[id]", auth: "admin" },
    async () => {
      const { id } = await params;
      const result = await bridgeRegistrationController.revoke(id);
      return NextResponse.json(result);
    },
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return apiGateway.handle(
    req,
    { version: "v1", endpoint: "/admin/bridges/[id]", auth: "admin" },
    async () => {
      const { id } = await params;
      const result = await bridgeRegistrationController.remove(id);
      return NextResponse.json(result);
    },
  );
}
