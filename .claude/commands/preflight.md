---
description: Walk through the 12-step feature checklist before writing code (CLAUDE.md mandatory)
---

A new feature is being requested. Per CLAUDE.md "Feature Development Standard", before writing ANY code, walk through the mandatory checklist.

For each item, ask the user explicitly. Do NOT proceed to the next step until the previous one is answered. Do NOT write code in this turn.

## Step 1 — Problem Definition
What problem is being solved? Why now? Who benefits?

## Step 2 — Impact Analysis
- Affected APIs (list paths and methods)
- Affected UI components
- Affected integrations (FHIR, HL7, Mail, Orchestra, Bridge)
- Backward compatibility assessment

## Step 3 — Version Rule
Is this a non-breaking change (extend `/api/v1/`) or breaking (create `/api/v2/`)?

## Step 4 — Risk Analysis
For each risk category — name prevention, detection, fallback:
- Technical (data loss, race condition, migration failure)
- Security (auth bypass, secret exposure, injection)
- Operational (downtime, config drift, deployment failure)
- Medical/business (incorrect lab result, audit gap, nDSG violation)

## Step 5 — Architecture Decision
Which patterns apply? (Factory, Strategy, Adapter, Gateway, Repository)
Which Clean Architecture layers are touched? (domain / application / infrastructure / presentation)

## Step 6 — Release Plan
- Version: `v1.x.x` or `v2.x.x`
- Change type: feature / fix / breaking
- Deployment target: Docker / Vercel / both
- Rollback strategy
- Migration steps (DB, ENV, data)
- Release notes draft

## Step 7 — STOP

Present the complete plan back to the user as a summary.
**Do NOT write code.** Wait for explicit confirmation ("ja, umsetzen" / "go" / similar) before proceeding.
