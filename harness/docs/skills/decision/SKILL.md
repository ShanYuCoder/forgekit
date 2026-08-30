---
name: decision
description: /decision — arc42 §09 ADRs (ADR-*); product/system decisions.
disable-model-invocation: true
extractBundle: architecture-core
---

# /decision — ADRs (§09)

## Write

- Path: `architecture/09-decisions/` — `ADR-{NNN}-{slug}.md` + index table
- Template: `.cursor/extracts/tpl-adr.md`
- Link Related: `CMP-*` / `CTR-*` / `FLOW-*` as needed

## Do not

- Put ADRs back under `product/shared/adr` (redirect stub only)
- Move `api-catalog` / `data-model` into §09
- Platform process howto → `platform/` handbook

## Pilot

[ADR-001](../../../architecture/09-decisions/ADR-001-arc42-toc.md)

Parent: `/architecture`

## Accelerators (optional)

Prefer `docskit_list_ids` kind `ADR` and `docskit_validate_links` after a new ADR.

```text
if Docskit available: targeted docskit_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Docskit never blocks authoring.
Missing ArtifactGraph never blocks Docskit or architecture skills.
```

When ArtifactGraph is missing, follow `/docskit` fallback evidence: continue
targeted local reads, then emit one deduplicated `docskit.missing-optional`
event per run and optional with actual `fileReads` and `contextBytes` only.

