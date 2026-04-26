import { randomBytes, createHash } from "crypto";
import { bridgeRegistrationRepository } from "@/infrastructure/repositories/PrismaBridgeRegistrationRepository";
import type {
  RegisterBridgeRequestDto,
  RegisterBridgeResponseDto,
  BridgeRegistrationResponseDto,
  ListBridgesResponseDto,
} from "@/infrastructure/api/dto/BridgeRegistrationDto";
import type { BridgeRegistrationData } from "@/application/interfaces/repositories/IBridgeRegistrationRepository";

function generateApiKey(): { plaintext: string; prefix: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  const plaintext = `zetlab_${raw}`;
  const prefix = plaintext.slice(0, 15);
  const hash = createHash("sha256").update(plaintext).digest("hex");
  return { plaintext, prefix, hash };
}

function toResponseDto(r: BridgeRegistrationData): BridgeRegistrationResponseDto {
  return {
    id:            r.id,
    name:          r.name,
    orgFhirId:     r.orgFhirId,
    orgGln:        r.orgGln,
    locationId:    r.locationId,
    apiKeyPrefix:  r.apiKeyPrefix,
    status:        r.status,
    lastSeenAt:    r.lastSeenAt?.toISOString() ?? null,
    bridgeVersion: r.bridgeVersion,
    createdAt:     r.createdAt.toISOString(),
    updatedAt:     r.updatedAt.toISOString(),
  };
}

export class BridgeRegistrationController {
  async register(body: RegisterBridgeRequestDto): Promise<RegisterBridgeResponseDto> {
    if (!body.name?.trim())      throw Object.assign(new Error("name ist erforderlich."), { status: 400 });
    if (!body.orgFhirId?.trim()) throw Object.assign(new Error("orgFhirId ist erforderlich."), { status: 400 });

    const { plaintext, prefix, hash } = generateApiKey();

    const created = await bridgeRegistrationRepository.create({
      name:      body.name.trim(),
      orgFhirId: body.orgFhirId.trim(),
      ...(body.orgGln     !== undefined && { orgGln:     body.orgGln }),
      ...(body.locationId !== undefined && { locationId: body.locationId }),
      apiKeyHash:   hash,
      apiKeyPrefix: prefix,
    });

    return {
      id:           created.id,
      name:         created.name,
      orgFhirId:    created.orgFhirId,
      orgGln:       created.orgGln,
      locationId:   created.locationId,
      apiKey:       plaintext,
      apiKeyPrefix: created.apiKeyPrefix,
      status:       created.status,
      createdAt:    created.createdAt.toISOString(),
    };
  }

  async list(): Promise<ListBridgesResponseDto> {
    const all = await bridgeRegistrationRepository.findAll();
    return {
      bridges: all.map(toResponseDto),
      total:   all.length,
    };
  }

  async revoke(id: string): Promise<{ ok: boolean }> {
    const bridge = await bridgeRegistrationRepository.findById(id);
    if (!bridge) throw Object.assign(new Error("Bridge nicht gefunden."), { status: 404 });
    await bridgeRegistrationRepository.revoke(id);
    return { ok: true };
  }

  async remove(id: string): Promise<{ ok: boolean }> {
    const bridge = await bridgeRegistrationRepository.findById(id);
    if (!bridge) throw Object.assign(new Error("Bridge nicht gefunden."), { status: 404 });
    await bridgeRegistrationRepository.delete(id);
    return { ok: true };
  }
}

export const bridgeRegistrationController = new BridgeRegistrationController();
