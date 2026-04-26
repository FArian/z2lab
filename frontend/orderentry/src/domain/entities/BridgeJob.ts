export type BridgeJobType   = "print" | "oru";
export type BridgeJobStatus = "pending" | "done" | "failed";

/** Payload stored as JSON inside BridgeJob.payload. */
export interface BridgeJobPayload {
  /** FHIR DocumentReference ID — bridge fetches PDF via /api/v1/proxy/fhir/document-references/{id} */
  documentReferenceId: string;
  serviceRequestId:    string;
  patientId:           string;
  orderNumber:         string;
  /** Pre-generated ZPL string for all specimen labels concatenated. */
  zpl:                 string;
}

export interface BridgeJob {
  id:         string;
  type:       BridgeJobType;
  status:     BridgeJobStatus;
  /** FHIR Organization ID — mandatory routing key. */
  orgId:      string;
  /** FHIR Location ID — targeted routing. Null = broadcast to all bridges of the org. */
  locationId: string | null;
  payload:    BridgeJobPayload;
  createdAt:  string;
  updatedAt:  string;
  doneAt:     string | null;
}
