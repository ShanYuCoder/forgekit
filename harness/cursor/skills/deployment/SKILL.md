---
name: deployment
description: /deployment — optional DEP-* stub; do not invent prod topology.
disable-model-invocation: true
extractBundle: architecture-core
---

# /deployment — Deploy — stub-first

**Business layer:** Deploy (outside module tree; architecture thin layer)  
**Standards:** short prose OK; diagrams → **C4** `DEP-*` only when placement matters. Team-facing architecture: prefer **Deployment** active; other chapters stub.

## Default

If the user did **not** confirm placement matters → write/keep a **short stub** only (`tpl-deployment.md`). **Refuse** to invent staging/prod diagrams.

## Write (when justified)

- Path: `Architecture/Deployment/`
- ID: `DEP-*`
- MD + Mermaid optional; no secrets
- Do **not** write local IDE/WSL machine tips into the docs hub

## Do not

- Full multi-region topology from imagination
- Confuse with journey sequences (`/journey`)

## Pilot

[`Architecture/Deployment/`](../../../Architecture/Deployment/) · `DEP-local` (minimal)

## Accelerators (optional)

Prefer `docskit_list_ids` kind `DEP`; refuse inventing nodes not already in MD.

```text
if Docskit available: targeted docskit_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Docskit never blocks authoring.
Missing ArtifactGraph never blocks Docskit or architecture skills.
```

When ArtifactGraph is missing, follow `/docskit` fallback evidence: continue
targeted local reads, then emit one deduplicated `docskit.missing-optional`
event per run and optional with actual `fileReads` and `contextBytes` only.


Parent: `/architecture` · [Start now](../../../platform/guide/start-now.md)
