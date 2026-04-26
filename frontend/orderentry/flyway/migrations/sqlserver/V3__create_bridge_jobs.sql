-- V3: BridgeJob — print and ORU jobs queued for z2Lab Bridge polling

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BridgeJob' AND xtype='U')
BEGIN
  CREATE TABLE BridgeJob (
    id          NVARCHAR(36)  NOT NULL PRIMARY KEY,
    type        NVARCHAR(10)  NOT NULL,
    status      NVARCHAR(10)  NOT NULL DEFAULT 'pending',
    orgId       NVARCHAR(256) NOT NULL,
    locationId  NVARCHAR(256) NULL,
    payload     NVARCHAR(MAX) NOT NULL,
    createdAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    updatedAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    doneAt      DATETIME2     NULL
  );

  CREATE INDEX idx_bridge_job_status_org ON BridgeJob (status, orgId);
  CREATE INDEX idx_bridge_job_status_loc ON BridgeJob (status, orgId, locationId);
END
