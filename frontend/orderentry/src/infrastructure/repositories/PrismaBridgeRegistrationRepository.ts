import type {
  IBridgeRegistrationRepository,
  BridgeRegistrationData,
  CreateBridgeRegistrationInput,
} from "@/application/interfaces/repositories/IBridgeRegistrationRepository";
import { prisma } from "../db/prismaClient";

export class PrismaBridgeRegistrationRepository implements IBridgeRegistrationRepository {
  async create(input: CreateBridgeRegistrationInput): Promise<BridgeRegistrationData> {
    return prisma.bridgeRegistration.create({
      data: {
        name:         input.name,
        orgFhirId:    input.orgFhirId,
        ...(input.orgGln      !== undefined && { orgGln:     input.orgGln }),
        ...(input.locationId  !== undefined && { locationId: input.locationId }),
        apiKeyHash:   input.apiKeyHash,
        apiKeyPrefix: input.apiKeyPrefix,
      },
    });
  }

  async findAll(): Promise<BridgeRegistrationData[]> {
    return prisma.bridgeRegistration.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<BridgeRegistrationData | null> {
    return prisma.bridgeRegistration.findUnique({ where: { id } });
  }

  async findByApiKeyPrefix(prefix: string): Promise<BridgeRegistrationData[]> {
    return prisma.bridgeRegistration.findMany({
      where: { apiKeyPrefix: prefix, status: "active" },
    });
  }

  async updateLastSeen(id: string, bridgeVersion?: string): Promise<void> {
    await prisma.bridgeRegistration.update({
      where: { id },
      data: {
        lastSeenAt: new Date(),
        ...(bridgeVersion !== undefined && { bridgeVersion }),
      },
    });
  }

  async revoke(id: string): Promise<void> {
    await prisma.bridgeRegistration.update({
      where: { id },
      data: { status: "revoked" },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.bridgeRegistration.delete({ where: { id } });
  }
}

export const bridgeRegistrationRepository = new PrismaBridgeRegistrationRepository();
