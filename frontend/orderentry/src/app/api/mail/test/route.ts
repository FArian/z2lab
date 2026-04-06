/**
 * POST /api/mail/test
 *
 * Legacy path — delegates to the canonical POST /api/admin/mail/test handler.
 * Kept for backward compatibility with any existing callers.
 * New code should call /api/admin/mail/test directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/auth";
import { mailController } from "@/infrastructure/api/controllers/MailController";
import type { MailTestRequestDto } from "@/infrastructure/api/dto/MailDto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await checkAdminAccess(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: auth.httpStatus },
    );
  }

  let body: MailTestRequestDto = {};
  try {
    body = (await req.json()) as MailTestRequestDto;
  } catch {
    // empty body — verify-only
  }

  const result = await mailController.test(body);
  const { httpStatus = 200, ...responseBody } = result;
  return NextResponse.json(responseBody, { status: httpStatus });
}
