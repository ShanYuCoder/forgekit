# ADR-001 — Docs hub uses arc42 TOC over flat C4 folders

| Field | Value |
|-------|-------|
| Status | accepted |
| Date | 2026-07-15 |
| Deciders | docs hub |

## Context

Flat `architecture/{landscape,context,containers,dynamics,deployments}` answered *what* (C4 views) but not *why*. AI-first docs need a stable TOC for narrative chapters (constraints, cross-cutting, quality, risks).

## Decision

- `architecture/01`…`12` follow **arc42** as TOC.
- C4 IDs (`LND`/`CTX`/`CTR`/`FLOW`/`DEP`) live **inside** chapters.
- Product Code (`CMP`/`W`/`API`) stays under `product/`.
- Journeys use `FLOW-*` + `/journey`; `DYN-*`/`/dynamics` are deprecated aliases.

## Consequences

- Migrate pilot content; keep redirect stubs on old paths.
- Skills: Layer-1 chapter router later; Layer-2 `/journey` now.
- Deployment chapter remains optional/stub by default.

## Related

- [Start now](/platform/guide/start-now)
- [Doc structure](/platform/guide/SYSTEM-DOC-STRUCTURE)
- [06 Runtime](/architecture/06-runtime/)
- [FLOW-login](/architecture/06-runtime/journeys/FLOW-login)
