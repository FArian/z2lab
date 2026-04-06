z2Lab / frontend/orderentry/src/
¦
+-- domain/                          ? Pure business rules, no dependencies
¦   +-- entities/
¦   ¦   +-- AdminTask.ts
¦   ¦   +-- AgentJob.ts
¦   ¦   +-- GlnLookupResult.ts
¦   ¦   +-- MailMessage.ts
¦   ¦   +-- Order.ts / Result.ts / Patient.ts
¦   ¦   +-- OrgRule.ts / ReservedOrderNumber.ts
¦   ¦   +-- User.ts
¦   +-- factories/
¦   ¦   +-- OrderFactory.ts
¦   ¦   +-- ResultFactory.ts
¦   +-- policies/
¦   ¦   +-- IPolicy.ts
¦   ¦   +-- RolePermissionMap.ts
¦   +-- strategies/
¦   ¦   +-- IOrderNumberStrategy.ts
¦   ¦   +-- MibiStrategy.ts / RoutineStrategy.ts / PocStrategy.ts
¦   ¦   +-- OrderNumberStrategyRegistry.ts
¦   +-- valueObjects/
¦       +-- Identifier.ts / OrderNumber.ts
¦       +-- Permission.ts / PoolThreshold.ts
¦       +-- OrganizationRef.ts
¦
+-- application/                     ? Use cases + interfaces, no I/O
¦   +-- interfaces/
¦   ¦   +-- IMailService.ts
¦   ¦   +-- IDeepLinkAuthStrategy.ts
¦   ¦   +-- repositories/
¦   ¦       +-- IUserRepository.ts / IOrderRepository.ts / IResultRepository.ts
¦   ¦       +-- IOrgRuleRepository.ts / IReservedNumberRepository.ts
¦   ¦       +-- IAdminTaskRepository.ts / IAgentJobRepository.ts
¦   ¦       +-- IAgentRegistrationRepository.ts
¦   +-- useCases/
¦   ¦   +-- CheckPermission.ts
¦   ¦   +-- CreateOrder.ts / GetOrders.ts / GetResults.ts / SearchResults.ts
¦   ¦   +-- GenerateOrderNumberUseCase.ts
¦   ¦   +-- ReserveOrderNumberUseCase.ts
¦   +-- services/
¦   ¦   +-- FhirAccessResolver.ts
¦   ¦   +-- OrderService.ts / ResultService.ts
¦   ¦   +-- OrganizationResolver.ts
¦   +-- adapters/
¦   ¦   +-- IGlnAdapter.ts
¦   ¦   +-- GlnAdapterV1.ts / GlnAdapterV2.ts
¦   ¦   +-- dto/GlnDto.ts
¦   +-- strategies/
¦       +-- PatientSearchStrategy.ts
¦
+-- infrastructure/                  ? Implementations, I/O, frameworks
¦   +-- ServiceFactory.ts
¦   +-- api/
¦   ¦   +-- controllers/ (23 controllers)
¦   ¦   ¦   +-- PatientsController.ts / OrdersController.ts / ResultsController.ts
¦   ¦   ¦   +-- UsersController.ts / EnvController.ts / MailController.ts
¦   ¦   ¦   +-- NumberPoolController.ts / OrgRulesController.ts
¦   ¦   ¦   +-- AdminTasksController.ts / AdminMergeController.ts
¦   ¦   ¦   +-- GlnLookupController.ts / Hl7ProxyController.ts
¦   ¦   ¦   +-- AgentJobController.ts / AgentRegistrationController.ts / …
¦   ¦   +-- dto/ (18 DTOs)
¦   ¦   +-- gateway/
¦   ¦   ¦   +-- ApiGateway.ts            ? all v1 admin routes go through here
¦   ¦   ¦   +-- RouteRegistry.ts
¦   ¦   +-- middleware/
¦   ¦   ¦   +-- AccessGuard.ts
¦   ¦   ¦   +-- RequirePermission.ts
¦   ¦   +-- openapi.ts
¦   +-- auth/
¦   ¦   +-- ApiTokenService.ts / BearerAuthGuard.ts / UserJwtService.ts
¦   +-- authorization/
¦   ¦   +-- AuthorizationService.ts / fhirAuthConfig.ts
¦   ¦   +-- strategies/ (7 files)
¦   +-- config/
¦   ¦   +-- EnvConfig.ts               ? server-side env vars
¦   ¦   +-- RuntimeConfig.ts
¦   +-- db/
¦   ¦   +-- prismaClient.ts / DatabaseConfig.ts
¦   ¦   +-- SqliteMigrationRunner.ts / runMigrations.ts
¦   ¦   +-- prismaError.ts
¦   +-- fhir/
¦   ¦   +-- FhirClient.ts / FhirTypes.ts
¦   ¦   +-- DiagnosticReportMapper.ts / ObservationMapper.ts / PractitionerMapper.ts
¦   +-- repositories/ (9 Prisma + 2 FHIR)
¦   ¦   +-- PrismaUserRepository.ts / PrismaOrgRuleRepository.ts
¦   ¦   +-- PrismaAdminTaskRepository.ts / PrismaAgentJobRepository.ts
¦   ¦   +-- PrismaReservedNumberRepository.ts / PrismaTokenRepository.ts
¦   ¦   +-- PrismaAgentRegistrationRepository.ts
¦   ¦   +-- FhirOrderRepository.ts / FhirResultRepository.ts
¦   +-- mail/ gln/ logging/ metrics/ deeplink/ services/
¦
+-- app/api/                         ? Next.js routes — should be thin
    +-- patients/
    ¦   +-- route.ts                 ? ? PatientsController
    ¦   +-- [id]/
    ¦       +-- route.ts             ? FHIR proxy (documented), auth added
    ¦       +-- diagnostic-reports/route.ts   ? FHIR proxy, auth added
    ¦       +-- service-requests/route.ts     ? FHIR proxy, auth added
    ¦       +-- document-references/route.ts  ? FHIR proxy, auth added
    ¦       +-- activate/route.ts    ? DIRECT_FHIR + business logic (legacy)
    +-- service-requests/
    ¦   +-- route.ts                 ? ? OrdersController
    ¦   +-- [id]/route.ts            ? FHIR proxy (GET/PUT), ? controller (DELETE)
    +-- diagnostic-reports/route.ts  ? ? ResultsController
    +-- login/route.ts               ? BUSINESS_LOGIC (legacy, off-limits)
    +-- signup/route.ts              ? BUSINESS_LOGIC (legacy, off-limits)
    +-- auth/reset-password/         ? BUSINESS_LOGIC (legacy, off-limits)
    +-- insurance-lookup/route.ts    ? EnvConfig fixed (no more process.env)
    +-- v1/
    ¦   +-- admin/
    ¦   ¦   +-- mail/*/route.ts      ? ? apiGateway.handle()
    ¦   ¦   +-- org-rules/*/route.ts ? ? apiGateway.handle()
    ¦   ¦   +-- number-pool/*/route.ts ? ? apiGateway.handle()
    ¦   +-- orders/number/route.ts   ? ? NumberPoolController
    ¦   +-- config/service-types/route.ts ?
    +-- … (47 more thin/re-export routes)

packages/
+-- domain/src/        ? canonical mirror (Turbopack workaround: local copy in src/)
+-- application/src/   ? canonical mirror
+-- infrastructure/src/ ? canonical mirror
