export interface RegisterBridgeRequestDto {
  name: string;
  orgFhirId: string;
  orgGln?: string;
  locationId?: string;
}

export interface RegisterBridgeResponseDto {
  id: string;
  name: string;
  orgFhirId: string;
  orgGln: string | null;
  locationId: string | null;
  apiKey: string;        // plaintext — shown ONCE, never stored
  apiKeyPrefix: string;  // for display in UI
  status: string;
  createdAt: string;
}

export interface BridgeRegistrationResponseDto {
  id: string;
  name: string;
  orgFhirId: string;
  orgGln: string | null;
  locationId: string | null;
  apiKeyPrefix: string;
  status: string;
  lastSeenAt: string | null;
  bridgeVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListBridgesResponseDto {
  bridges: BridgeRegistrationResponseDto[];
  total: number;
}
