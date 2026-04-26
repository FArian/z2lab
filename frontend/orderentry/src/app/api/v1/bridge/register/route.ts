/**
 * POST /api/v1/bridge/register
 *
 * Registers a new z2Lab Bridge for a clinic/practice.
 * Returns the plaintext API key — shown ONCE, never stored.
 * Auth: admin session required.
 */

import { NextResponse, type NextRequest } from "next/server";
import { apiGateway } from "@/infrastructure/api/gateway/ApiGateway";
import { bridgeRegistrationController } from "@/infrastructure/api/controllers/BridgeRegistrationController";
import type { RegisterBridgeRequestDto } from "@/infrastructure/api/dto/BridgeRegistrationDto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  return apiGateway.handle(
    req,
    { version: "v1", endpoint: "/bridge/register", auth: "admin" },
    async () => {
      const body = await req.json() as RegisterBridgeRequestDto;
      const result = await bridgeRegistrationController.register(body);
      return NextResponse.json(result, { status: 201 });
    },
  );
}
