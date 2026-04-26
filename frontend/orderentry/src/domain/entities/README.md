[← Domain](../README.md) | [↑ src](../../README.md)

---

# 🧱 Entities

Domain entity interfaces with status union types. Pure TypeScript, no framework dependencies.

## 📄 Files

- 📄 [Order.ts](./Order.ts) — `Order` interface + `OrderStatus` union type
- 📄 [Result.ts](./Result.ts) — `Result` interface + `ResultStatus` union type
- 📄 [Patient.ts](./Patient.ts) — `Patient` interface
- 📄 [Analysis.ts](./Analysis.ts) — `Analysis` (FHIR Observation projection)
- 📄 [BridgeJob.ts](./BridgeJob.ts) — Print/ORU job for the z2Lab Bridge (`BridgeJob`, `BridgeJobType`, `BridgeJobStatus`, `BridgeJobPayload`)
- 📄 [User.ts](./User.ts) — `User` profile entity
- 📄 [ManagedUser.ts](./ManagedUser.ts) — Admin-managed user with FHIR sync metadata
- 📄 [OrgRule.ts](./OrgRule.ts) — Organisation-specific HL7 + order-number rules
- 📄 [ReservedOrderNumber.ts](./ReservedOrderNumber.ts) — Pre-reserved order number pool entry
- 📄 [AdminTask.ts](./AdminTask.ts) — Admin alert task (e.g. pool threshold)
- 📄 [DeepLinkContext.ts](./DeepLinkContext.ts) — Inbound deep-link payload
- 📄 [GlnLookupResult.ts](./GlnLookupResult.ts) — RefData GLN lookup result
- 📄 [MailMessage.ts](./MailMessage.ts) — Outbound mail payload

## ⚙️ Rules

- Entities are plain interfaces — no classes
- Status values come from union types only; never compare raw strings outside domain
- No `Partial<>` in production code
- No I/O, no React, no `process.env` — pure TypeScript

---

[⬆ Back to top](#)
