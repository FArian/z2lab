/**
 * MailDto — typed request/response contracts for the Mail API.
 *
 * Used by MailController and the corresponding API routes.
 * No secrets (passwords, tokens) are ever present in these DTOs.
 */

// ── Request ───────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/mail/test — optional recipient for send-through test
 * with optional content overrides.
 *
 * Without `to`: SMTP verify only, no email sent.
 * With `to`:    after a successful verify, a test email is sent. The
 *               subject is always prefixed with `[TEST]` so test emails
 *               remain identifiable in logs and inboxes; provider/auth
 *               metadata is always appended to the body.
 */
export interface MailTestRequestDto {
  /** If provided, a real test email is sent to this address after SMTP verify. */
  readonly to?: string;
  /** Optional subject override (a `[TEST]` prefix is always added). */
  readonly subject?: string;
  /** Optional plain-text body override. */
  readonly text?: string;
  /** Optional HTML body override. */
  readonly html?: string;
}

// ── Responses ─────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/mail/test — result of an SMTP verify + optional send.
 * `httpStatus` is internal — stripped by the route before sending.
 */
export interface MailTestResponseDto {
  readonly ok:          boolean;
  readonly message:     string;
  readonly provider?:   string | undefined;
  readonly from?:       string | undefined;
  readonly durationMs?: number | undefined;
  /** Internal HTTP status code — never included in the JSON response body. */
  readonly httpStatus?: number | undefined;
}

/** GET /api/admin/mail/status — current mail configuration (no secrets). */
export interface MailStatusResponseDto {
  readonly configured: boolean;
  readonly provider?:  string | undefined;
  readonly authType?:  string | undefined;
  readonly host?:      string | undefined;
  readonly port?:      number | undefined;
  readonly from?:      string | undefined;
}
