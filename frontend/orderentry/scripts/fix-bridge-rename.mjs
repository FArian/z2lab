import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('[fix] Inspecting current DB state...');
  const tables = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  const names = tables.map(t => t.name);
  console.log('  Tables:', names.join(', '));

  const hasAgentJob          = names.includes('AgentJob');
  const hasAgentRegistration = names.includes('AgentRegistration');
  const hasBridgeJob         = names.includes('BridgeJob');
  const hasBridgeRegistration= names.includes('BridgeRegistration');

  // ── Step 1: rename AgentJob → BridgeJob ───────────────────────────────────
  if (hasAgentJob && !hasBridgeJob) {
    console.log('[fix] Renaming AgentJob → BridgeJob');
    await prisma.$executeRawUnsafe('ALTER TABLE "AgentJob" RENAME TO "BridgeJob"');
  } else if (hasBridgeJob) {
    console.log('[fix] BridgeJob already exists — skipping');
  } else {
    console.log('[fix] No AgentJob to rename — creating BridgeJob fresh');
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "BridgeJob" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "orgId" TEXT NOT NULL,
      "locationId" TEXT,
      "payload" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "doneAt" DATETIME
    )`);
  }

  // ── Step 2: rename AgentRegistration → BridgeRegistration ─────────────────
  if (hasAgentRegistration && !hasBridgeRegistration) {
    console.log('[fix] Renaming AgentRegistration → BridgeRegistration');
    await prisma.$executeRawUnsafe('ALTER TABLE "AgentRegistration" RENAME TO "BridgeRegistration"');

    // Rename column agentVersion → bridgeVersion
    console.log('[fix] Renaming column agentVersion → bridgeVersion');
    await prisma.$executeRawUnsafe('ALTER TABLE "BridgeRegistration" RENAME COLUMN "agentVersion" TO "bridgeVersion"');
  } else if (hasBridgeRegistration) {
    console.log('[fix] BridgeRegistration already exists — checking column...');
    const cols = await prisma.$queryRawUnsafe(`PRAGMA table_info("BridgeRegistration")`);
    const colNames = cols.map(c => c.name);
    if (colNames.includes('agentVersion') && !colNames.includes('bridgeVersion')) {
      console.log('[fix] Renaming agentVersion → bridgeVersion');
      await prisma.$executeRawUnsafe('ALTER TABLE "BridgeRegistration" RENAME COLUMN "agentVersion" TO "bridgeVersion"');
    }
  } else {
    console.log('[fix] No AgentRegistration to rename — creating BridgeRegistration fresh');
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "BridgeRegistration" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "orgFhirId" TEXT NOT NULL,
      "orgGln" TEXT,
      "locationId" TEXT,
      "apiKeyHash" TEXT NOT NULL,
      "apiKeyPrefix" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'active',
      "lastSeenAt" DATETIME,
      "bridgeVersion" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  }

  // ── Step 3: rename indexes ────────────────────────────────────────────────
  const indexes = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%agent%'"
  );
  for (const idx of indexes) {
    const newName = idx.name
      .replace(/agent_job/gi, 'bridge_job')
      .replace(/AgentRegistration/g, 'BridgeRegistration')
      .replace(/AgentJob/g, 'BridgeJob');
    if (newName !== idx.name) {
      console.log(`[fix] Renaming index ${idx.name} → ${newName}`);
      try {
        await prisma.$executeRawUnsafe(`ALTER INDEX "${idx.name}" RENAME TO "${newName}"`);
      } catch {
        // SQLite < 3.25 doesn't support ALTER INDEX RENAME; recreate
        const indexInfo = await prisma.$queryRawUnsafe(
          `SELECT sql FROM sqlite_master WHERE type='index' AND name='${idx.name}'`
        );
        if (indexInfo[0]?.sql) {
          await prisma.$executeRawUnsafe(`DROP INDEX "${idx.name}"`);
          const newSql = indexInfo[0].sql
            .replace(idx.name, newName)
            .replace(/AgentJob/g, 'BridgeJob')
            .replace(/AgentRegistration/g, 'BridgeRegistration');
          await prisma.$executeRawUnsafe(newSql);
          console.log(`[fix]   recreated as ${newName}`);
        }
      }
    }
  }

  // ── Step 4: update flyway_schema_history ─────────────────────────────────
  if (names.includes('flyway_schema_history')) {
    console.log('[fix] Updating flyway_schema_history');
    await prisma.$executeRawUnsafe(`
      UPDATE flyway_schema_history
      SET    description = 'create bridge jobs',
             script      = 'V3__create_bridge_jobs.sql'
      WHERE  script = 'V3__create_agent_jobs.sql'
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE flyway_schema_history
      SET    description = 'create bridge registrations',
             script      = 'V8__create_bridge_registrations.sql'
      WHERE  script = 'V8__create_agent_registrations.sql'
    `);
  }

  // ── Final state ───────────────────────────────────────────────────────────
  const finalTables = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log('[fix] Final tables:', finalTables.map(t => t.name).join(', '));

  await prisma.$disconnect();
  console.log('[fix] Done.');
}

run().catch(err => { console.error('[fix] FAILED:', err); process.exit(1); });
