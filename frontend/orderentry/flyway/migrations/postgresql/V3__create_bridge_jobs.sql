-- V3: BridgeJob — print and ORU jobs queued for z2Lab Bridge polling

CREATE TABLE IF NOT EXISTS "BridgeJob" (
  id           TEXT        NOT NULL PRIMARY KEY,
  type         TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending',
  "orgId"      TEXT        NOT NULL,
  "locationId" TEXT,
  payload      TEXT        NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "doneAt"     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bridge_job_status_org ON "BridgeJob" (status, "orgId");
CREATE INDEX IF NOT EXISTS idx_bridge_job_status_loc ON "BridgeJob" (status, "orgId", "locationId");
