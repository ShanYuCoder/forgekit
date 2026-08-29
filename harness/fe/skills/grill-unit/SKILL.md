---
name: grill-unit
description: /grill-unit — FE grill gate before /unit generation.
disable-model-invocation: true
---

# /grill-unit

**Owner:** Codegenkit · optional local ArtifactGraph allowlist check before unit dry-gen.

```text
if local ArtifactGraph available: check the FE repo's allowlist for unitGenDry
else: npm run codegen:unit:dry -- --id …
```

## Docs Root Resolution

1. If `CODEGENKIT_DOCS_ROOT` is set (non-empty), use it as the canonical
   pointer for locating codegen manifests.
2. If `CODEGENKIT_DOCS_ROOT` is **not** set, fall back to Platform DNA
   configuration (`platform-dna`) to resolve the docs hub path.
   Platform DNA discovery is slower and more error-prone, so always prefer
   an explicit `CODEGENKIT_DOCS_ROOT` when available.

Canonical IR/registries come from `CODEGENKIT_DOCS_ROOT`; ArtifactGraph does
not follow that pointer. Architecture IDs → Docskit (`DOCSKIT_ROOT`); symbols
in other repos → `codegraph-<key>` only.

Missing ArtifactGraph never blocks the grill. Complete the deterministic dry
generation fallback first, then follow
`.cursor/rules/codegenkit-optional-integrations.mdc` for once-per-run telemetry.
