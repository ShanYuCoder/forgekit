---
name: architecture
description: /architecture — route overview, surfaces, modules, functions, flows, and deployment.
disable-model-invocation: true
extractBundle: architecture-core
---

# /architecture — router (business layers → skills)

Ask which **business layer** (or infer). Then load the child skill.

People map: [`platform/guide/start-now.md`](../../../platform/guide/start-now.md)  
Tree + standards: [`platform/guide/SYSTEM-DOC-STRUCTURE.md`](../../../platform/guide/SYSTEM-DOC-STRUCTURE.md)

## Route map (business → skill)

| Ask / topic | Business layer | Next skill |
|-------------|----------------|------------|
| Operational area / persona / business purpose | Overview | **`/overview`** |
| Common scope / Cross-service / Database / Business processes | Surfaces / Modules | **`/business-process`**, **`/db-erd`**, **`/cross-service`** |
| Business surfaces (who does what on which channel) | Surfaces | **`/surfaces`** |
| Common UX/UI rules and patterns (Markdown) | Common | **`/common`** |
| Common technical bundles for codegen (YAML) | Common | **`/common-spec`**, **`/grill-common-spec`** |
| Module / CMP box | Module | **`/module`** |
| Screen / API detail / CRUD | Function | **`/spec`** (grill with **`/spec-grill`** as needed) |
| Where it runs / Physical infrastructure | Deploy | **`/deployment`** |
| Architectural decisions | ADR | **`/decision`** |
| Architecture discussion / grilling | High-level Design | **`/grill`**, **`/architecture-grill`** |

## Rules

- Format: MD + Mermaid (`flowchart` / `sequenceDiagram`)
  - **MANDATORY ERROR FLOWS:** Any Mermaid diagram (node flowchart or sequence diagram) MUST explicitly model error paths and exception handling loops (e.g., Redirect on 401/403 IDOR, validation fail states).
- Treat `Surfaces` as business surfaces, not projects or repos.
- Product Code (`W-*`/`API-*`) stays in `product/surfaces/<surface>/CMP-*/<slug>/code/`
- API endpoint/contract belongs to Function detail.
- One concern per edit.

## Target / ID Resolution Rule

- User prompt MAY specify an ID, Operational Area, Surface, or CMP ID (e.g. `CMP-ADM-000`, `Admin Portal`).
- Agent MUST use `docskit_route`, `docskit_list_ids`, or `docskit_get_element` (or glob search) to resolve target paths under `product/surfaces/...` or `product/overview/`.

## After route

Load the child skill + extract bundle `architecture-core`.

## Accelerators (optional)

Prefer `docskit_route` then `docskit_list_ids` / `docskit_validate_links` / `docskit_business_processes` before large edits.

```text
if Docskit available: targeted docskit_* tools for IDs / deps / processes / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

When ArtifactGraph is missing, follow `/docskit` fallback evidence: continue
with plain read tools and ID greps.
```

## Verification Checklist (Evidence Required)
- [ ] **ID Resolved:** Used `docskit_route` or `docskit_get_element` to locate target architectural elements.
- [ ] **Child Skill Routed:** Directed to correct child skill (`/overview`, `/surfaces`, `/module`, `/spec`).
- **DO NOT output fake checklists, i18n tables, or framework prose.**

