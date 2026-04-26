/**
 * GET /actuator — Spring Boot Actuator discovery endpoint.
 * Public — returns the catalogue of available actuator endpoints with HAL-style _links.
 */
import { NextResponse } from "next/server";
import { actuatorController } from "@/infrastructure/api/controllers/ActuatorController";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(actuatorController.discovery());
}
