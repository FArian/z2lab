export interface BridgeRegistrationData {
  id: string;
  name: string;
  orgFhirId: string;
  orgGln: string | null;
  locationId: string | null;
  apiKeyHash: string;
  apiKeyPrefix: string;
  status: string;
  lastSeenAt: Date | null;
  bridgeVersion: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBridgeRegistrationInput {
  name: string;
  orgFhirId: string;
  orgGln?: string;
  locationId?: string;
  apiKeyHash: string;
  apiKeyPrefix: string;
}

export interface IBridgeRegistrationRepository {
  create(input: CreateBridgeRegistrationInput): Promise<BridgeRegistrationData>;
  findAll(): Promise<BridgeRegistrationData[]>;
  findById(id: string): Promise<BridgeRegistrationData | null>;
  findByApiKeyPrefix(prefix: string): Promise<BridgeRegistrationData[]>;
  updateLastSeen(id: string, bridgeVersion?: string): Promise<void>;
  revoke(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
