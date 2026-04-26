/**
 * MailController — business logic for the Mail Admin API.
 *
 * Responsibilities:
 *   - Return current mail configuration status (no secrets exposed)
 *   - Verify SMTP connection and optionally send a test email
 *   - Log provider + outcome; NEVER log credentials
 *
 * Constructor-injectable for tests:
 *   const ctrl = new MailController(new MockMailService());
 *
 * Module-level singleton for production use:
 *   import { mailController } from "./MailController"
 */

import type { IMailService } from "@/application/interfaces/IMailService";
import { mailService } from "@/infrastructure/mail/MailServiceFactory";
import { EnvConfig } from "@/infrastructure/config/EnvConfig";
import { createLogger } from "@/infrastructure/logging/Logger";
import type { MailTestRequestDto, MailTestResponseDto, MailStatusResponseDto } from "../dto/MailDto";

const log = createLogger("MailController");

export class MailController {
  constructor(private readonly service: IMailService = mailService) {}

  // ── GET /api/admin/mail/status ───────────────────────────────────────────────

  getStatus(): MailStatusResponseDto {
    const configured = this.service.isConfigured();
    if (!configured) return { configured: false };

    const port = EnvConfig.mailPort ? parseInt(EnvConfig.mailPort, 10) : undefined;

    return {
      configured: true,
      provider:  EnvConfig.mailProvider  || undefined,
      authType:  EnvConfig.mailAuthType  || undefined,
      host:      EnvConfig.mailHost      || undefined,
      port:      !isNaN(port ?? NaN) ? port : undefined,
      from:      EnvConfig.mailFrom      ||
                 (EnvConfig.mailUser ? `OrderEntry <${EnvConfig.mailUser}>` : undefined),
    };
  }

  // ── POST /api/admin/mail/test ────────────────────────────────────────────────

  async test(body: MailTestRequestDto): Promise<MailTestResponseDto> {
    const provider = EnvConfig.mailProvider || "unknown";

    log.debug("Mail test: invoked", {
      provider,
      authType:        EnvConfig.mailAuthType,
      host:            EnvConfig.mailHost,
      port:            EnvConfig.mailPort,
      secure:          EnvConfig.mailSecure,
      hasUser:         !!EnvConfig.mailUser,
      hasPassword:     !!EnvConfig.mailPassword,
      hasOAuthClient:  !!EnvConfig.mailOauthClientId,
      hasOAuthSecret:  !!EnvConfig.mailOauthClientSecret,
      hasRefreshToken: !!EnvConfig.mailOauthRefreshToken,
      bodyHasTo:       !!body.to,
      bodyHasSubject:  !!body.subject,
      bodyHasText:     !!body.text,
      bodyHasHtml:     !!body.html,
    });

    if (!this.service.isConfigured()) {
      log.warn("Mail test requested but no provider configured", { provider });
      return {
        ok:         false,
        message:    "Mail server not configured — set MAIL_PROVIDER in environment variables",
        httpStatus: 503,
      };
    }

    log.info(`Mail test: verifying SMTP connection (provider=${provider})`);
    log.debug("Mail test: calling service.verify()", { provider, host: EnvConfig.mailHost, port: EnvConfig.mailPort });
    const start = Date.now();

    const verify = await this.service.verify();
    log.debug("Mail test: verify() returned", { ok: verify.ok, message: verify.message, durationMs: Date.now() - start });
    if (!verify.ok) {
      log.warn(`Mail verify failed (provider=${provider}): ${verify.message}`, {
        provider, host: EnvConfig.mailHost, port: EnvConfig.mailPort, authType: EnvConfig.mailAuthType,
      });
      return {
        ok:         false,
        message:    verify.message,
        provider,
        durationMs: Date.now() - start,
        httpStatus: 502,
      };
    }

    if (body.to) {
      // Subject: optional override + always-prefixed [TEST] marker
      const baseSubject =
        body.subject?.trim() || "z2Lab OrderEntry — Test-E-Mail";
      const subject = baseSubject.startsWith("[TEST]")
        ? baseSubject
        : `[TEST] ${baseSubject}`;

      // Body: optional override + always-appended provider footer
      const text = body.text?.trim()
        ? `${body.text}\n\n${footerText(provider)}`
        : buildTestText(provider);
      const html = body.html?.trim()
        ? `${body.html}\n${footerHtml(provider)}`
        : buildTestHtml(provider);

      log.debug("Mail test: sending message", {
        to:         body.to,
        subject,
        textLength: text.length,
        htmlLength: html.length,
        from:       EnvConfig.mailFrom || EnvConfig.mailUser,
      });

      try {
        await this.service.send({ to: body.to, subject, text, html });
        log.info(`Mail test: test email sent to ${body.to} via ${provider}`, {
          provider, durationMs: Date.now() - start, subject,
        });
        return {
          ok:         true,
          message:    `Verbindung erfolgreich und Test-E-Mail an ${body.to} gesendet`,
          provider,
          from:       EnvConfig.mailFrom || EnvConfig.mailUser || undefined,
          durationMs: Date.now() - start,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Send failed";
        log.warn(`Mail send failed (provider=${provider}): ${message}`, {
          provider, to: body.to, durationMs: Date.now() - start,
        });
        log.debug("Mail send error details", {
          name:  err instanceof Error ? err.name  : undefined,
          stack: err instanceof Error ? err.stack : undefined,
        });
        return {
          ok:         false,
          message,
          provider,
          durationMs: Date.now() - start,
          httpStatus: 502,
        };
      }
    }

    log.info(`Mail test: SMTP verify OK (provider=${provider})`, { durationMs: Date.now() - start });
    return {
      ok:         true,
      message:    "Mail-Server erreichbar und Authentifizierung erfolgreich",
      provider,
      from:       EnvConfig.mailFrom || EnvConfig.mailUser || undefined,
      durationMs: Date.now() - start,
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTestText(provider: string): string {
  return (
    "Diese E-Mail wurde vom z2Lab OrderEntry Mail-System gesendet.\n\n" +
    `Provider: ${provider}\n` +
    `Auth:     ${EnvConfig.mailAuthType}\n\n` +
    "Falls Sie diese E-Mail erhalten haben, ist die Mail-Konfiguration korrekt."
  );
}

function buildTestHtml(provider: string): string {
  return (
    "<p>Diese E-Mail wurde vom <strong>z2Lab OrderEntry</strong> Mail-System gesendet.</p>" +
    "<table style=\"border-collapse:collapse;font-size:13px\">" +
    `<tr><td style="padding:2px 12px 2px 0;color:#666">Provider</td><td><code>${provider}</code></td></tr>` +
    `<tr><td style="padding:2px 12px 2px 0;color:#666">Auth</td><td><code>${EnvConfig.mailAuthType}</code></td></tr>` +
    "</table>" +
    "<p style=\"color:#28a745\">✓ Mail-Konfiguration ist korrekt.</p>"
  );
}

/** Footer always appended when the caller supplies their own text body. */
function footerText(provider: string): string {
  return (
    "---\n" +
    "[TEST] z2Lab OrderEntry — Mail-Test-Endpoint\n" +
    `Provider: ${provider} · Auth: ${EnvConfig.mailAuthType}`
  );
}

/** Footer always appended when the caller supplies their own HTML body. */
function footerHtml(provider: string): string {
  return (
    "<hr style=\"margin-top:16px;border:0;border-top:1px solid #ddd\">" +
    "<p style=\"color:#888;font-size:11px;margin-top:8px\">" +
    "[TEST] z2Lab OrderEntry — Mail-Test-Endpoint · " +
    `Provider: <code>${provider}</code> · Auth: <code>${EnvConfig.mailAuthType}</code>` +
    "</p>"
  );
}

// ── Module-level singleton ────────────────────────────────────────────────────

export const mailController = new MailController();
