# z2Lab — Source Tree (`frontend/orderentry/src/`)

> Snapshot of the Clean Architecture layout. Generated 2026-04-26.

```
src/
├── domain/                          ← Pure business rules — no framework deps
│   ├── entities/
│   │   ├── AdminTask.ts
│   │   ├── Analysis.ts
│   │   ├── BridgeJob.ts             ← z2Lab Bridge print/ORU job
│   │   ├── DeepLinkContext.ts
│   │   ├── GlnLookupResult.ts
│   │   ├── MailMessage.ts
│   │   ├── ManagedUser.ts
│   │   ├── Order.ts
│   │   ├── OrgRule.ts
│   │   ├── Patient.ts
│   │   ├── ReservedOrderNumber.ts
│   │   ├── Result.ts
│   │   └── User.ts
│   ├── factories/
│   │   ├── OrderFactory.ts
│   │   └── ResultFactory.ts
│   ├── policies/
│   │   ├── IPolicy.ts
│   │   └── RolePermissionMap.ts
│   ├── strategies/
│   │   ├── IOrderNumberStrategy.ts
│   │   ├── MibiStrategy.ts
│   │   ├── OrderNumberStrategyRegistry.ts
│   │   ├── PassthroughStrategy.ts
│   │   ├── PocStrategy.ts
│   │   └── RoutineStrategy.ts
│   ├── useCases/                    ← Pure use cases (no I/O)
│   ├── valueObjects/
│   │   ├── AccessLevel.ts
│   │   ├── Identifier.ts
│   │   ├── OrderNumber.ts
│   │   ├── OrganizationRef.ts
│   │   ├── Permission.ts
│   │   └── PoolThreshold.ts
│   └── index.ts                     ← Public API barrel
│
├── application/                     ← Use cases + repository interfaces
│   ├── adapters/                    ← API-version adapters (e.g. GLN v1/v2)
│   ├── interfaces/
│   │   ├── repositories/
│   │   │   ├── IAdminTaskRepository.ts
│   │   │   ├── IBridgeJobRepository.ts
│   │   │   ├── IBridgeRegistrationRepository.ts
│   │   │   ├── IOrderRepository.ts
│   │   │   ├── IOrgRuleRepository.ts
│   │   │   ├── IReservedNumberRepository.ts
│   │   │   ├── IResultRepository.ts
│   │   │   └── IUserRepository.ts
│   │   ├── services/
│   │   ├── IDeepLinkAuthStrategy.ts
│   │   └── IMailService.ts
│   ├── services/
│   ├── strategies/                  ← e.g. PatientSearchStrategy
│   ├── useCases/                    ← e.g. CheckPermission, GenerateOrderNumber
│   └── index.ts
│
├── infrastructure/                  ← Concrete adapters + I/O
│   ├── api/
│   │   ├── controllers/             ← BridgeJobController, BridgeRegistrationController, …
│   │   ├── dto/                     ← BridgeJobDto, BridgeRegistrationDto, …
│   │   ├── gateway/                 ← ApiGateway + RouteRegistry
│   │   ├── middleware/              ← JwtGuard, RequirePermission
│   │   ├── HttpClient.ts
│   │   └── openapi.ts               ← Single source of truth for OpenAPI
│   ├── auth/                        ← BearerAuthGuard, session helpers
│   ├── authorization/               ← Strategies (NoAuth, OAuth2)
│   ├── config/                      ← EnvConfig, RuntimeConfig
│   ├── db/                          ← Prisma client + migration runner
│   ├── deeplink/                    ← DeepLinkService + AuditLogger
│   ├── fhir/                        ← FhirClient + mappers (DiagnosticReport, …)
│   ├── logging/                     ← Logger (slog-style)
│   ├── mail/                        ← Nodemailer + provider matrix
│   ├── metrics/                     ← PrometheusService
│   ├── repositories/
│   │   ├── PrismaBridgeJobRepository.ts
│   │   ├── PrismaBridgeRegistrationRepository.ts
│   │   ├── PrismaOrgRuleRepository.ts
│   │   ├── PrismaReservedNumberRepository.ts
│   │   └── PrismaUserRepository.ts
│   ├── services/
│   └── ServiceFactory.ts            ← DI root
│
├── presentation/                    ← React + design system
│   ├── components/                  ← Reusable feature-level components
│   ├── hooks/                       ← useResults, useOrders, useOrderForm, …
│   ├── pages/                       ← Page-level components (BridgesPage, OrderCreatePage, …)
│   └── ui/                          ← Design system (Button, Card, Badge, …)
│
├── shared/                          ← Framework-agnostic utilities + client config
│   ├── config/
│   │   └── AppConfig.ts             ← NEXT_PUBLIC_* values
│   └── utils/
│       ├── base64.ts
│       └── formatDate.ts
│
├── app/                             ← Next.js App Router
│   ├── account/
│   ├── admin/
│   │   ├── api/
│   │   ├── bridges/                 ← Bridge management UI
│   │   ├── env/
│   │   ├── merge/
│   │   ├── number-pool/
│   │   ├── org-rules/
│   │   ├── organizations/
│   │   ├── tasks/
│   │   └── users/
│   ├── api/                         ← API routes (Next.js handlers)
│   │   ├── v1/                      ← Versioned, current
│   │   │   ├── admin/
│   │   │   │   └── bridges/         ← /api/v1/admin/bridges/[id]
│   │   │   ├── auth/
│   │   │   ├── bridge/              ← /api/v1/bridge/{status,token,jobs,register}
│   │   │   ├── config/
│   │   │   ├── orders/
│   │   │   ├── proxy/
│   │   │   │   ├── fhir/            ← FHIR proxy routes
│   │   │   │   └── hl7/             ← HL7 proxy (inbound/outbound)
│   │   │   ├── users/
│   │   │   └── …
│   │   └── (legacy unversioned routes — login, me, launch — undocumented)
│   ├── login/
│   ├── order/
│   ├── orders/
│   ├── patient/
│   ├── results/
│   └── settings/
│
├── components/                      ← Legacy global components (AppHeader, AppSidebar, Table)
├── lib/                             ← Legacy helpers (auth, fhir, userStore)
├── messages/                        ← i18n (de, de-CH, en, fr, it)
├── instrumentation.ts               ← Next.js OTel hook (edge-safe)
├── instrumentation.node.ts          ← Node-only OTel + DB migration startup
└── config.ts                        ← Legacy config bridge
```

---

## Other top-level folders

```
z2Lab/
├── Documentation/
│   ├── Bridge/                      ← z2Lab Bridge architecture spec
│   ├── Deployment/                  ← EnvironmentVariables.md, Vercel.md
│   └── Installation/                ← Multi-phase setup guide
├── backend/
│   └── orchestra/                   ← OIE Juno config + FHIR seed resources
├── devops/
│   └── docker/                      ← Production docker-compose stack
├── docs/                            ← Auth, FHIR, GLN, audit notes
├── flyway/                          ← (under frontend/orderentry/) DB migrations
└── _tmp/                            ← Backups from earlier cleanups (legacy, experiments)
```
