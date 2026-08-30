---
name: cross-cutting
description: /cross-cutting — arc42 §08 enterprise concerns (security, obs, config…).
disable-model-invocation: true
extractBundle: architecture-core
---

# /cross-cutting — Cross-cutting (§08)

## Write

- Path: `architecture/08-cross-cutting/` — topic section or `{topic}.md`
- Template: `.cursor/extracts/tpl-cross-cutting.md`
- Require: Intent + Owner (or TBD) + Approach stub — **no AI waffle**

## Topics (seed)

Security · Logging · Observability · Caching · Messaging · Configuration · Exception · Validation · Localization · Authorization

## Do not

- Full OpenAPI / UI DSL / E2E plans
- Duplicate business journeys (those are `/journey`)

## Accelerators (optional)

Prefer `docskit_route` for §08 topics and `docskit_validate_links` after a new section.

```text
if Docskit available: targeted docskit_* tools for IDs / deps / journeys / links
else: Glob/search under architecture/ and product/, then Read scoped Markdown

Missing Docskit never blocks authoring.
Missing ArtifactGraph never blocks Docskit or architecture skills.
```

When ArtifactGraph is missing, follow `/docskit` fallback evidence: continue
targeted local reads, then emit one deduplicated `docskit.missing-optional`
event per run and optional with actual `fileReads` and `contextBytes` only.


Parent: `/architecture`
