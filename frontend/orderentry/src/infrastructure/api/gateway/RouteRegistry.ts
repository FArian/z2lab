/**
 * RouteRegistry — declarative catalogue of all versioned API routes.
 *
 * Purpose:
 *   - Single source of truth for what routes exist under /api/v1
 *   - Used by the gateway for structured logging context
 *   - Used by health/introspection endpoints to list registered routes
 *   - NOT a runtime router — Next.js file-system routing handles dispatch
 *
 * Rule: every new v1 route MUST have an entry here AND in openapi.ts.
 * If the route is not in both places, it does not officially exist.
 */

import type { ApiVersion, GatewayAuth } from "./ApiGateway";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RouteEntry {
  readonly method:   HttpMethod;
  /** Full versioned path, e.g. "/v1/admin/mail/test" */
  readonly path:     string;
  readonly version:  ApiVersion;
  readonly tag:      string;
  readonly auth:     GatewayAuth;
  readonly summary:  string;
}

/**
 * All registered v1 API routes.
 * Append new entries here when adding a new versioned endpoint.
 */
export const V1_ROUTES: readonly RouteEntry[] = [

  // ── Auth ────────────────────────────────────────────────────────────────────
  { method: "POST",   path: "/v1/auth/login",                    version: "v1", tag: "Auth",   auth: "public", summary: "Login" },
  { method: "POST",   path: "/v1/auth/logout",                   version: "v1", tag: "Auth",   auth: "public", summary: "Logout" },
  { method: "GET",    path: "/v1/auth/me",                       version: "v1", tag: "Auth",   auth: "public", summary: "Current session" },
  { method: "POST",   path: "/v1/auth/signup",                   version: "v1", tag: "Auth",   auth: "public", summary: "Register user" },
  { method: "POST",   path: "/v1/auth/token",                    version: "v1", tag: "Auth",   auth: "public", summary: "Obtain JWT access token" },
  { method: "POST",   path: "/v1/auth/reset-password/request",   version: "v1", tag: "Auth",   auth: "public", summary: "Request password reset email" },
  { method: "POST",   path: "/v1/auth/reset-password/confirm",   version: "v1", tag: "Auth",   auth: "public", summary: "Confirm password reset" },

  // ── Users ───────────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/users",                         version: "v1", tag: "Users",  auth: "admin", summary: "List users" },
  { method: "POST",   path: "/v1/users",                         version: "v1", tag: "Users",  auth: "admin", summary: "Create user" },
  { method: "GET",    path: "/v1/users/:id",                     version: "v1", tag: "Users",  auth: "admin", summary: "Get user" },
  { method: "PUT",    path: "/v1/users/:id",                     version: "v1", tag: "Users",  auth: "admin", summary: "Update user" },
  { method: "DELETE", path: "/v1/users/:id",                     version: "v1", tag: "Users",  auth: "admin", summary: "Delete user" },
  { method: "POST",   path: "/v1/users/:id/sync",                version: "v1", tag: "Users",  auth: "admin", summary: "Sync user to FHIR Practitioner" },
  { method: "POST",   path: "/v1/users/:id/token",               version: "v1", tag: "Users",  auth: "admin", summary: "Generate personal access token" },

  // ── Config / Env ────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/config",                        version: "v1", tag: "Config", auth: "admin", summary: "Get runtime config" },
  { method: "POST",   path: "/v1/config",                        version: "v1", tag: "Config", auth: "admin", summary: "Update runtime config" },
  { method: "GET",    path: "/v1/env",                           version: "v1", tag: "Config", auth: "admin", summary: "Get environment variables" },
  { method: "POST",   path: "/v1/env",                           version: "v1", tag: "Config", auth: "admin", summary: "Write environment variables" },
  { method: "GET",    path: "/v1/env/schema",                    version: "v1", tag: "Config", auth: "admin", summary: "Get ENV variable schema" },

  // ── Mail ────────────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/admin/mail/status",             version: "v1", tag: "Mail",   auth: "admin", summary: "Mail configuration status" },
  { method: "POST",   path: "/v1/admin/mail/test",               version: "v1", tag: "Mail",   auth: "admin", summary: "Test mail connection / send test email" },

  // ── Health ──────────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/health",                        version: "v1", tag: "Health", auth: "public", summary: "Application health check" },
  { method: "GET",    path: "/v1/health/db",                     version: "v1", tag: "Health", auth: "public", summary: "Database health check" },

  // ── FHIR proxy ──────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/proxy/fhir/patients",                              version: "v1", tag: "FHIR", auth: "public", summary: "Search patients" },
  { method: "GET",    path: "/v1/proxy/fhir/patients/:id",                          version: "v1", tag: "FHIR", auth: "public", summary: "Get patient" },
  { method: "GET",    path: "/v1/proxy/fhir/patients/:id/service-requests",         version: "v1", tag: "FHIR", auth: "public", summary: "Patient orders" },
  { method: "GET",    path: "/v1/proxy/fhir/patients/:id/diagnostic-reports",       version: "v1", tag: "FHIR", auth: "public", summary: "Patient results" },
  { method: "GET",    path: "/v1/proxy/fhir/service-requests",                      version: "v1", tag: "FHIR", auth: "public", summary: "List service requests" },
  { method: "GET",    path: "/v1/proxy/fhir/service-requests/:id",                  version: "v1", tag: "FHIR", auth: "public", summary: "Get service request" },
  { method: "GET",    path: "/v1/proxy/fhir/diagnostic-reports",                    version: "v1", tag: "FHIR", auth: "public", summary: "List diagnostic reports" },

  // ── Bridge ──────────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/bridge/status",                             version: "v1", tag: "Bridge", auth: "public", summary: "Bridge connectivity check" },
  { method: "POST",   path: "/v1/bridge/token",                              version: "v1", tag: "Bridge", auth: "public", summary: "Obtain bridge access token" },
  { method: "GET",    path: "/v1/bridge/jobs",                               version: "v1", tag: "Bridge", auth: "public", summary: "Poll pending jobs (print + ORU)" },
  { method: "POST",   path: "/v1/bridge/jobs",                               version: "v1", tag: "Bridge", auth: "public", summary: "Create print job after order submission" },
  { method: "POST",   path: "/v1/bridge/jobs/:id/done",                      version: "v1", tag: "Bridge", auth: "public", summary: "Mark job as completed" },

  // ── FHIR proxy ──────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/proxy/fhir/document-references/:id",        version: "v1", tag: "FHIR", auth: "public", summary: "Get DocumentReference (PDF for Bridge)" },

  // ── HL7 proxy ───────────────────────────────────────────────────────────────
  { method: "POST",   path: "/v1/proxy/hl7/inbound",             version: "v1", tag: "HL7",   auth: "public", summary: "HL7 inbound message" },
  { method: "POST",   path: "/v1/proxy/hl7/outbound",            version: "v1", tag: "HL7",   auth: "public", summary: "HL7 outbound message" },

  // ── Metrics ─────────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/metrics",                       version: "v1", tag: "Observability", auth: "public", summary: "Prometheus metrics" },

  // ── Order Numbers ────────────────────────────────────────────────────────────
  { method: "POST",   path: "/v1/orders/number",                         version: "v1", tag: "Orders",    auth: "public", summary: "Generate order number (Orchestra → Pool fallback)" },

  // ── External — GLN ──────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/gln-lookup",                            version: "v1", tag: "External — GLN", auth: "public", summary: "Look up a GLN in the RefData partner registry (v1 — flat)" },
  { method: "GET",    path: "/v2/gln-lookup",                            version: "v1", tag: "External — GLN", auth: "public", summary: "Look up a GLN in the RefData partner registry (v2 — nested)" },

  // ── Patients — extended ──────────────────────────────────────────────────────
  { method: "POST",   path: "/v1/patients/:id/activate",                 version: "v1", tag: "Patients",      auth: "public", summary: "Activate a patient" },
  { method: "GET",    path: "/v1/patients/:id/document-references",      version: "v1", tag: "Patients",      auth: "public", summary: "List DocumentReferences for a patient" },
  { method: "POST",   path: "/v1/patients/:id/merge",                    version: "v1", tag: "Patients",      auth: "public", summary: "Merge source patient into target patient" },

  // ── Practitioners ────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/practitioners",                         version: "v1", tag: "Practitioners", auth: "public", summary: "Search practitioners (org-scoped)" },

  // ── Roles ────────────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/roles",                                 version: "v1", tag: "Roles",         auth: "public", summary: "List all PractitionerRole catalog entries" },
  { method: "POST",   path: "/v1/roles",                                 version: "v1", tag: "Roles",         auth: "admin",  summary: "Create a PractitionerRole catalog entry" },
  { method: "GET",    path: "/v1/roles/:id",                             version: "v1", tag: "Roles",         auth: "public", summary: "Get a PractitionerRole catalog entry" },
  { method: "PUT",    path: "/v1/roles/:id",                             version: "v1", tag: "Roles",         auth: "admin",  summary: "Update a PractitionerRole catalog entry" },
  { method: "DELETE", path: "/v1/roles/:id",                             version: "v1", tag: "Roles",         auth: "admin",  summary: "Delete a PractitionerRole catalog entry" },

  // ── Orders ───────────────────────────────────────────────────────────────────
  { method: "POST",   path: "/v1/orders/submit",                         version: "v1", tag: "Orders",        auth: "public", summary: "Submit a new order (ServiceRequest)" },

  // ── Deep Link ────────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/deeplink/order-entry",                  version: "v1", tag: "DeepLink",      auth: "public", summary: "KIS/PIS deep-link into order entry" },

  // ── Insurance ────────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/insurance-lookup",                      version: "v1", tag: "Insurance",     auth: "public", summary: "Look up VeKa insurance card (SASIS)" },

  // ── User profile & permissions ───────────────────────────────────────────────
  { method: "GET",    path: "/v1/me/profile",                            version: "v1", tag: "Auth",          auth: "public", summary: "Get current user profile" },
  { method: "PUT",    path: "/v1/me/profile",                            version: "v1", tag: "Auth",          auth: "public", summary: "Update current user profile" },
  { method: "GET",    path: "/v1/me/permissions",                        version: "v1", tag: "Auth",          auth: "public", summary: "Get permissions for the current user" },

  // ── Logs ────────────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/logs",                                  version: "v1", tag: "Observability", auth: "admin",  summary: "Tail structured log file (admin)" },

  // ── Idle timeout ────────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/idle-timeout",                          version: "v1", tag: "Auth",          auth: "public", summary: "Get session idle timeout configuration" },

  // ── FHIR locations ───────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/fhir/locations",                        version: "v1", tag: "FHIR",          auth: "public", summary: "List FHIR Location resources" },

  // ── Config — Service Types ───────────────────────────────────────────────────
  { method: "GET",    path: "/v1/config/service-types",                  version: "v1", tag: "Admin — Config", auth: "admin",  summary: "Get active order service types" },

  // ── Org Rules (admin) ────────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/admin/org-rules",                       version: "v1", tag: "OrgRules",  auth: "admin",  summary: "List org rules" },
  { method: "POST",   path: "/v1/admin/org-rules",                       version: "v1", tag: "OrgRules",  auth: "admin",  summary: "Create org rule" },
  { method: "GET",    path: "/v1/admin/org-rules/:id",                   version: "v1", tag: "OrgRules",  auth: "admin",  summary: "Get org rule" },
  { method: "PUT",    path: "/v1/admin/org-rules/:id",                   version: "v1", tag: "OrgRules",  auth: "admin",  summary: "Update org rule" },
  { method: "DELETE", path: "/v1/admin/org-rules/:id",                   version: "v1", tag: "OrgRules",  auth: "admin",  summary: "Delete org rule" },

  // ── Number Pool (admin) ──────────────────────────────────────────────────────
  { method: "GET",    path: "/v1/admin/number-pool",                     version: "v1", tag: "NumberPool", auth: "admin",  summary: "List pool numbers + stats" },
  { method: "POST",   path: "/v1/admin/number-pool",                     version: "v1", tag: "NumberPool", auth: "admin",  summary: "Add numbers to pool" },
  { method: "DELETE", path: "/v1/admin/number-pool/:id",                 version: "v1", tag: "NumberPool", auth: "admin",  summary: "Delete pool number" },
  { method: "GET",    path: "/v1/admin/number-pool/thresholds",          version: "v1", tag: "NumberPool", auth: "admin",  summary: "Get pool alert thresholds" },
  { method: "PUT",    path: "/v1/admin/number-pool/thresholds",          version: "v1", tag: "NumberPool", auth: "admin",  summary: "Update pool alert thresholds" },

] as const;

/**
 * Actuator endpoints — Spring Boot Actuator standard, deliberately NOT under /v1.
 *
 * Path convention: `/actuator/*` is a recognised observability standard. Monitoring
 * tools (Spring Boot Admin, Prometheus operators, Grafana dashboards) expect this
 * exact prefix. They are infrastructure endpoints, not business APIs, so the
 * `/api/v1/` rule from CLAUDE.md does not apply here.
 *
 * Implementations live in src/app/actuator/.
 */
export const ACTUATOR_ROUTES: readonly RouteEntry[] = [
  { method: "GET",  path: "/actuator",                          version: "v1", tag: "Actuator", auth: "public", summary: "Discovery: list available actuator endpoints" },
  { method: "GET",  path: "/actuator/health",                   version: "v1", tag: "Actuator", auth: "public", summary: "Aggregated health (UP/DOWN/UNKNOWN/OUT_OF_SERVICE)" },
  { method: "GET",  path: "/actuator/health/liveness",          version: "v1", tag: "Actuator", auth: "public", summary: "Liveness probe — process alive" },
  { method: "GET",  path: "/actuator/health/readiness",         version: "v1", tag: "Actuator", auth: "public", summary: "Readiness probe — DB + FHIR reachable" },
  { method: "GET",  path: "/actuator/info",                     version: "v1", tag: "Actuator", auth: "public", summary: "App, build, and runtime metadata" },
  { method: "GET",  path: "/actuator/metrics",                  version: "v1", tag: "Actuator", auth: "admin",  summary: "List all available metric names" },
  { method: "GET",  path: "/actuator/metrics/:name",            version: "v1", tag: "Actuator", auth: "admin",  summary: "Values + tags for one metric" },
  { method: "GET",  path: "/actuator/prometheus",               version: "v1", tag: "Actuator", auth: "public", summary: "Prometheus text-exposition (METRICS_TOKEN or admin)" },
  { method: "GET",  path: "/actuator/loggers",                  version: "v1", tag: "Actuator", auth: "admin",  summary: "List loggers + supported levels" },
  { method: "GET",  path: "/actuator/loggers/:name",            version: "v1", tag: "Actuator", auth: "admin",  summary: "Get logger configuration" },
  { method: "POST", path: "/actuator/loggers/:name",            version: "v1", tag: "Actuator", auth: "admin",  summary: "Set logger level at runtime (no restart)" },
  { method: "GET",  path: "/actuator/env",                      version: "v1", tag: "Actuator", auth: "admin",  summary: "Environment properties (whitelisted)" },
] as const;

/** All registered routes, including actuator. */
export const ALL_ROUTES: readonly RouteEntry[] = [...V1_ROUTES, ...ACTUATOR_ROUTES] as const;

/** Look up a route by method + path for gateway logging. */
export function findRoute(method: string, path: string): RouteEntry | undefined {
  return ALL_ROUTES.find((r) => r.method === method && r.path === path);
}
