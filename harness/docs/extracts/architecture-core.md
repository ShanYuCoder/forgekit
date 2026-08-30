# Architecture core (arc42 × C4 × Product)

SSOT entry: [`start-now`](../../platform/guide/start-now.md) · [`SYSTEM-DOC-STRUCTURE`](../../platform/guide/SYSTEM-DOC-STRUCTURE.md).
People / tree: [`platform/guide/start-now.md`](../../platform/guide/start-now.md) · [`SYSTEM-DOC-STRUCTURE.md`](../../platform/guide/SYSTEM-DOC-STRUCTURE.md)

## Operating model (business view)

`overview` → `operational areas` (Admin/Workforce/Shop-floor/Plant) → `business surfaces` → `module` → `function` · optional `FLOW-*`.

Personas/actors and interaction channels are mapped to operational areas. Runtime Portal/Client/API/Gateway remain C4 Containers.

## Layer meaning

- `overview`: personas, business purpose, and operational areas.
- `surface`: who does what on which channel; for example Admin Web, Line/HMI, Integration Gateway, or Common.
- `module`: a cohesive business capability inside a surface.
- `function`: screen or API detail and contract.
- `journey`: runtime flow across systems.
- `Common`: shared scope at the **lowest shared folder** (module/cluster `common/`, then surface, then `product/surfaces/common`). See `.cursor/extracts/common-scope.md`.
- `API`: container or contract detail, not a surface.

## Content standards

| Layer | Prose | Diagrams / DB / sequence |
|-------|-------|---------------------------|
| Overview · Operational area · Surface · Common · Module+ | **arc42** spirit | **C4** |
| Function | **C4** | **C4** |

No **dynamics** wording on new trees — use **flow** / `FLOW-*` / `/journey`.

## Technical layers

1. **arc42** — TOC under `architecture/01`…`12` (*why*) — team: prefer §01 + §07 active; rest stub OK
2. **C4 views** — IDs inside chapters (*what*)
3. **Product** — `CMP-*` / `W-*` / `API-*` under `product/` (*detail*)

## ID rules

| Prefix | Path | Notes |
|--------|------|-------|
| `LND-*` `CTX-*` | `architecture/03-context/` | Overview / landscape + context |
| `CTR-*` | `architecture/07-deployment/` | (Deprecated in public contract except for deployment) |
| `FLOW-*` | `architecture/06-runtime/journeys/` | Curated flows (~10–20%) |
| `DEP-*` | `architecture/07-deployment/` | Optional stub |
| `ADR-*` | `architecture/09-decisions/` | Not `product/shared/adr` (redirect) |
| `CMP-*` `W-*` `API-*` | `product/` | **Do not rename for arc42** |

Not product journeys: `_legacy.dynamics*` · `SC-*`/`TC-*` · `/business-process-trace` (brownfield; `/flow-trace` deprecated alias).

## Format

- Architecture chapters + CMP README: **MD + Mermaid only**
- YAML only under `product/**/code/`
- Prefer `sequenceDiagram` (flows) / `flowchart` (CTX/CTR) — **avoid Mermaid `C4Context`**
- Deployment: stub unless placement matters
- Reader UX: `vitepress-mermaid-renderer` (zoom/pan) + `vitepress-plugin-mermaid`
- **No** Mermaid MCP required

## Journey criteria (write when ≥1)

Cross ≥2 systems · hard to understand / regress · slow onboard · core domain.
Not every agile story.

## Forbidden

- API schemas / UI DSL in `architecture/`
- Duplicating Code under `05`
- AI inventing full prod DEP topology
- IcePanel/Lucid as SSOT
