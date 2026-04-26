/**
 * PrismaBridgeJobRepository — IBridgeJobRepository backed by Prisma.
 *
 * Works with SQLite (default), PostgreSQL, and MSSQL.
 * payload is stored as a JSON string (same approach as User.profile).
 */

import type { IBridgeJobRepository, CreateBridgeJobInput } from "@/application/interfaces/repositories/IBridgeJobRepository";
import type { BridgeJob, BridgeJobPayload } from "@/domain/entities/BridgeJob";
import { prisma } from "../db/prismaClient";
import crypto from "node:crypto";
import type { BridgeJob as PrismaBridgeJob } from "@prisma/client";

function toBridgeJob(row: PrismaBridgeJob): BridgeJob {
  return {
    id:         row.id,
    type:       row.type as BridgeJob["type"],
    status:     row.status as BridgeJob["status"],
    orgId:      row.orgId,
    locationId: row.locationId ?? null,
    payload:    JSON.parse(row.payload) as BridgeJobPayload,
    createdAt:  row.createdAt.toISOString(),
    updatedAt:  row.updatedAt.toISOString(),
    doneAt:     row.doneAt ? row.doneAt.toISOString() : null,
  };
}

export class PrismaBridgeJobRepository implements IBridgeJobRepository {
  async create(input: CreateBridgeJobInput): Promise<BridgeJob> {
    const payload: BridgeJobPayload = {
      documentReferenceId: input.documentReferenceId,
      serviceRequestId:    input.serviceRequestId,
      patientId:           input.patientId,
      orderNumber:         input.orderNumber,
      zpl:                 input.zpl,
    };

    const row = await prisma.bridgeJob.create({
      data: {
        id:         crypto.randomUUID(),
        type:       input.type,
        status:     "pending",
        orgId:      input.orgId,
        locationId: input.locationId ?? null,
        payload:    JSON.stringify(payload),
      },
    });

    return toBridgeJob(row);
  }

  async listPending(orgId: string, locationId?: string): Promise<BridgeJob[]> {
    const rows = await prisma.bridgeJob.findMany({
      where: {
        status: "pending",
        orgId,
        ...(locationId
          ? { OR: [{ locationId }, { locationId: null }] }
          : { locationId: null }
        ),
      },
      orderBy: { createdAt: "asc" },
    });

    return rows.map(toBridgeJob);
  }

  async markDone(id: string): Promise<void> {
    await prisma.bridgeJob.update({
      where: { id },
      data:  { status: "done", doneAt: new Date() },
    });
  }

  async markFailed(id: string): Promise<void> {
    await prisma.bridgeJob.update({
      where: { id },
      data:  { status: "failed" },
    });
  }
}

export const bridgeJobRepository = new PrismaBridgeJobRepository();
