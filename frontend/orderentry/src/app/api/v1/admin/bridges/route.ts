/**
 * GET /api/v1/admin/bridges — List all registered bridges
 * Auth: admin session required.
 */

import { NextResponse, type NextRequest } from "next/server";
import { apiGateway } from "@/infrastructure/api/gateway/ApiGateway";
import { bridgeRegistrationController } from "@/infrastructure/api/controllers/BridgeRegistrationController";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  return apiGateway.handle(
    req,
    { version: "v1", endpoint: "/admin/bridges", auth: "admin" },
    async () => {
      const result = await bridgeRegistrationController.list();
      return NextResponse.json(result);
    },
  );
}
