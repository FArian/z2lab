[← Infrastructure](../README.md) | [↑ src](../../README.md)

---

# 🗄️ Repositories

Concrete implementations of application repository interfaces.

## 📄 Files

### FHIR-backed (read-through proxy to HAPI)

- 📄 [FhirResultRepository.ts](./FhirResultRepository.ts) — `IResultRepository` via `/api/v1/proxy/fhir/diagnostic-reports`
- 📄 [FhirOrderRepository.ts](./FhirOrderRepository.ts) — `IOrderRepository` via `/api/v1/proxy/fhir/service-requests`

### Prisma-backed (local DB)

- 📄 [PrismaUserRepository.ts](./PrismaUserRepository.ts) — `IUserRepository` (User accounts)
- 📄 [PrismaTokenRepository.ts](./PrismaTokenRepository.ts) — Password-reset tokens
- 📄 [PrismaOrgRuleRepository.ts](./PrismaOrgRuleRepository.ts) — Org-specific HL7 + order-number config
- 📄 [PrismaReservedNumberRepository.ts](./PrismaReservedNumberRepository.ts) — Pre-reserved order number pool + thresholds
- 📄 [PrismaAdminTaskRepository.ts](./PrismaAdminTaskRepository.ts) — Admin alert tasks (e.g. pool threshold crossed)
- 📄 [PrismaBridgeJobRepository.ts](./PrismaBridgeJobRepository.ts) — z2Lab Bridge job queue (print + ORU)
- 📄 [PrismaBridgeRegistrationRepository.ts](./PrismaBridgeRegistrationRepository.ts) — z2Lab Bridge registrations + API keys

## ⚙️ Rules

- Implement only the interface — no extra public methods
- FHIR repos use the typed `HttpClient`; Prisma repos use `prisma` from `../db/prismaClient`
- Wired by `ServiceFactory` (FHIR) or instantiated as module-level singleton (`bridgeJobRepository`, `bridgeRegistrationRepository`); never instantiated directly in hooks or pages
- Convert Prisma rows to domain entities via mapper functions (`toBridgeJob`, etc.) — never leak `@prisma/client` types past the repository boundary

---

[⬆ Back to top](#)
