/**
 * @z2lab/infrastructure — Public API of the portable infrastructure layer.
 *
 * Exports server-side infrastructure: config, logging, metrics, FHIR client,
 * mappers, mail, GLN, authorization, deep-link, database, and repositories.
 *
 * ⚠️ Zone B (Next.js BFF layer) is intentionally NOT exported from this package:
 *   - API controllers, gateway, middleware stay in frontend/orderentry/src/infrastructure/
 *   - HttpClient (browser-only) stays in frontend
 *   - FhirOrderRepository / FhirResultRepository (browser-only) stay in frontend
 *   - ServiceFactory stays in frontend
 */

// ── Config ────────────────────────────────────────────────────────────────────

export { EnvConfig }                                      from "./config/EnvConfig";
export { SUPPORTED_KEYS, DEFAULTS,
         readOverrides, resolveKey,
         getAll, saveOverrides }                          from "./config/RuntimeConfig";
export type { SupportedKey, ConfigOverrides }             from "./config/RuntimeConfig";

// ── Logging ───────────────────────────────────────────────────────────────────

export { createLogger }                                   from "./logging/Logger";
export type { Logger }                                    from "./logging/Logger";

// ── Metrics ───────────────────────────────────────────────────────────────────

export { prometheusService }                              from "./metrics/PrometheusService";

// ── FHIR ──────────────────────────────────────────────────────────────────────

export { fhirGet, fhirTransaction, FHIR_BASE }            from "./fhir/FhirClient";
export { DiagnosticReportMapper }                         from "./fhir/DiagnosticReportMapper";
export { ObservationMapper }                              from "./fhir/ObservationMapper";
export { PractitionerMapper }                             from "./fhir/PractitionerMapper";
export { buildOperationOutcome,
         buildPaginationLinks,
         extractPaginationFromBundle }                    from "./fhir/FhirTypes";
export type { FhirBundle,
              FhirOperationOutcome }                      from "./fhir/FhirTypes";

// ── GLN ───────────────────────────────────────────────────────────────────────

export { RefDataSoapClient }                              from "./gln/RefDataSoapClient";
export { mapToGlnLookupResult }                           from "./gln/RefDataToDomainMapper";
export { parseRefDataXml }                                from "./gln/RefDataXmlParser";
export type { RefDataItem }                               from "./gln/RefDataXmlParser";

// ── Mail ──────────────────────────────────────────────────────────────────────

export { mailService }                                    from "./mail/MailServiceFactory";
export { NodemailerMailService,
         NullMailService }                                from "./mail/NodemailerMailService";
export { buildMailConfig }                                from "./mail/mailEnvConfig";
export type { MailConfig,
              MailProvider }                              from "./mail/types/MailConfig";

// ── Authorization (FHIR outbound auth) ───────────────────────────────────────

export { AuthorizationService, applyAuth }                from "./authorization/AuthorizationService";
export { fhirAuthService }                                from "./authorization/fhirAuthConfig";
export type { IAuthStrategy }                             from "./authorization/strategies/IAuthStrategy";
export { AUTH_TYPES }                                     from "./authorization/types/AuthConfig";
export type { AuthConfig, AuthType }                      from "./authorization/types/AuthConfig";

// ── Deep-Link ─────────────────────────────────────────────────────────────────

export { processDeepLink }                                from "./deeplink/DeepLinkService";
export type { DeepLinkResult }                            from "./deeplink/DeepLinkService";
export { auditDeepLink }                                  from "./deeplink/DeepLinkAuditLogger";
export type { DeepLinkAuditEvent }                        from "./deeplink/DeepLinkAuditLogger";
export { deepLinkAuthStrategy,
         createDeepLinkAuthStrategy }                     from "./deeplink/DeepLinkAuthStrategyFactory";
export { NonceCache }                                     from "./deeplink/NonceCache";

// ── Database ──────────────────────────────────────────────────────────────────

export { prisma }                                         from "./db/prismaClient";
export { runMigrations }                                  from "./db/runMigrations";
export { resolveDbConfig, maskDbUrl }                     from "./db/DatabaseConfig";
export type { DbProvider, ResolvedDbConfig }              from "./db/DatabaseConfig";

// ── Repositories ──────────────────────────────────────────────────────────────

export { PrismaUserRepository,
         userRepository }                                 from "./repositories/PrismaUserRepository";
export { PrismaAdminTaskRepository }                      from "./repositories/PrismaAdminTaskRepository";
export { PrismaAgentJobRepository }                       from "./repositories/PrismaAgentJobRepository";
export { PrismaAgentRegistrationRepository }              from "./repositories/PrismaAgentRegistrationRepository";
export { PrismaOrgRuleRepository }                        from "./repositories/PrismaOrgRuleRepository";
export { PrismaReservedNumberRepository }                 from "./repositories/PrismaReservedNumberRepository";
export { createResetToken,
         consumeResetToken }                              from "./repositories/PrismaTokenRepository";

// ── Services ──────────────────────────────────────────────────────────────────

export { OrchestraOrderService }                          from "./services/OrchestraOrderService";
export { PoolNotificationService }                        from "./services/PoolNotificationService";
