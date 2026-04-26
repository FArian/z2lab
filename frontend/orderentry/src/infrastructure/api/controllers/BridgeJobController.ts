/**
 * BridgeJobController — handles print job queue for z2Lab Bridge polling.
 *
 * Responsibilities:
 *   - createPrintJob: create a pending job after order submission
 *   - listJobs:       return pending jobs for a given org/location (Bridge polling)
 *   - markDone:       Bridge confirms job completed
 *
 * ZPL generation:
 *   One label per specimen, format: "{orderNumber} {materialCode}" as CODE128 barcode.
 *   Labels are concatenated into a single ZPL string stored in the job payload.
 *
 * Routing:
 *   orgId + locationId → targeted (bridge of that department)
 *   orgId only         → broadcast (all bridges of the organization)
 */

import type { IBridgeJobRepository } from "@/application/interfaces/repositories/IBridgeJobRepository";
import { bridgeJobRepository } from "@/infrastructure/repositories/PrismaBridgeJobRepository";
import { createLogger } from "@/infrastructure/logging/Logger";
import type {
  CreatePrintJobRequestDto,
  CreatePrintJobResponseDto,
  ListBridgeJobsResponseDto,
  JobDoneResponseDto,
  BridgeJobResponseDto,
} from "../dto/BridgeJobDto";

const log = createLogger("BridgeJobController");

function buildZpl(orderNumber: string, specimens: Array<{ materialCode: string; materialName: string }>): string {
  return specimens
    .map(({ materialCode, materialName }) => {
      const barcode = `${orderNumber} ${materialCode}`;
      return [
        "^XA",
        "^PW400",
        "^LL200",
        `^FO20,20^BY2^BCN,80,Y,N,N^FD${barcode}^FS`,
        `^FO20,120^A0N,20,20^FD${materialName}^FS`,
        "^XZ",
      ].join("\n");
    })
    .join("\n");
}

export class BridgeJobController {
  constructor(private readonly repo: IBridgeJobRepository = bridgeJobRepository) {}

  // ── POST /api/v1/bridge/jobs/print ─────────────────────────────────────────

  async createPrintJob(body: CreatePrintJobRequestDto): Promise<CreatePrintJobResponseDto> {
    if (!body.orgId || !body.documentReferenceId || !body.orderNumber) {
      throw Object.assign(new Error("orgId, documentReferenceId and orderNumber are required"), { status: 400 });
    }

    const zpl = buildZpl(body.orderNumber, body.specimens ?? []);

    const job = await this.repo.create({
      type:                "print",
      orgId:               body.orgId,
      ...(body.locationId ? { locationId: body.locationId } : {}),
      documentReferenceId: body.documentReferenceId,
      serviceRequestId:    body.serviceRequestId,
      patientId:           body.patientId,
      orderNumber:         body.orderNumber,
      zpl,
    });

    log.info(`Print job created: id=${job.id} orgId=${job.orgId} locationId=${job.locationId ?? "broadcast"}`);

    return { id: job.id, status: job.status, createdAt: job.createdAt };
  }

  // ── GET /api/v1/bridge/jobs ────────────────────────────────────────────────

  async listJobs(orgId: string, locationId?: string): Promise<ListBridgeJobsResponseDto> {
    if (!orgId) {
      throw Object.assign(new Error("orgId query parameter is required"), { status: 400 });
    }

    const jobs = await this.repo.listPending(orgId, locationId);

    const result: BridgeJobResponseDto[] = jobs.map((j) => ({
      id:                  j.id,
      type:                j.type,
      orgId:               j.orgId,
      locationId:          j.locationId,
      documentReferenceId: j.payload.documentReferenceId,
      serviceRequestId:    j.payload.serviceRequestId,
      patientId:           j.payload.patientId,
      orderNumber:         j.payload.orderNumber,
      zpl:                 j.payload.zpl,
      createdAt:           j.createdAt,
    }));

    return { jobs: result };
  }

  // ── POST /api/v1/bridge/jobs/[id]/done ─────────────────────────────────────

  async markDone(id: string): Promise<JobDoneResponseDto> {
    if (!id) {
      throw Object.assign(new Error("Job id is required"), { status: 400 });
    }

    await this.repo.markDone(id);
    log.info(`Print job marked done: id=${id}`);

    return { id, status: "done" };
  }
}

export const bridgeJobController = new BridgeJobController();
