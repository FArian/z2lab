-- V8__create_bridge_registrations.sql
-- z2Lab Bridge registration table.
-- Each registered clinic/practice gets a hashed API key for Bearer authentication.

CREATE TABLE IF NOT EXISTS "BridgeRegistration" (
  "id"            TEXT     NOT NULL PRIMARY KEY,
  "name"          TEXT     NOT NULL,
  "orgFhirId"     TEXT     NOT NULL,
  "orgGln"        TEXT,
  "locationId"    TEXT,
  "apiKeyHash"    TEXT     NOT NULL,
  "apiKeyPrefix"  TEXT     NOT NULL,
  "status"        TEXT     NOT NULL DEFAULT 'active',
  "lastSeenAt"    DATETIME,
  "bridgeVersion" TEXT,
  "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "BridgeRegistration_orgFhirId_idx" ON "BridgeRegistration"("orgFhirId");
CREATE INDEX IF NOT EXISTS "BridgeRegistration_status_idx"    ON "BridgeRegistration"("status");
