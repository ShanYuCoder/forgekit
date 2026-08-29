---
name: unit
description: /unit — unit test generation from codegen manifests via Codegenkit.
disable-model-invocation: true
---

# /unit

**Owner:** Codegenkit (`--type=fe`)

```bash
npm run codegen:unit:dry -- --id W-AD-AUTH-001
npm run codegen:unit -- --id W-AD-AUTH-001

# Fallback direct CLI if wrappers missing:
codegenkit unit-gen:dry --adapter=nuxt4 --docs-root=/path/to/docskit -- --id W-AD-AUTH-001
codegenkit unit-gen --adapter=nuxt4 --docs-root=/path/to/docskit -- --id W-AD-AUTH-001
codegenkit unit-registry --adapter=nuxt4
```

You MUST run the codegen script (`npm run codegen:unit` or `codegenkit unit-gen`) FIRST to generate the skeleton and basic implementation from IR, before attempting to fill in any gaps, implement logic, or add missing tests manually.

Requires a prior codegen manifest under the docskit Code `generated/` folder.
`--docs-root` / `CODEGENKIT_DOCS_ROOT` is the canonical registry/IR pointer;
local ArtifactGraph never replaces it.

## Docs Root Resolution

1. If `CODEGENKIT_DOCS_ROOT` is set (non-empty), use it as the canonical
   registry/IR pointer for locating codegen manifests.
2. If `CODEGENKIT_DOCS_ROOT` is **not** set, fall back to Platform DNA
   configuration (`platform-dna`) to resolve the docs hub path.
   Platform DNA discovery is slower and more error-prone, so always prefer
   an explicit `CODEGENKIT_DOCS_ROOT` when available.

## Route

Architecture/C4 → Docskit (`DOCSKIT_ROOT`); IR/registry/gen →
`CODEGENKIT_DOCS_ROOT`; symbols/call-graph for repo X → Platform DNA-wired
`codegraph-<repo-key>`. Never workspace-parent graphs or member-edited MCP.
Local ArtifactGraph is allowlist/tag hints for this repo only.

`dotnet-line` is not supported by these separate unit commands: its primary
`gen` pass already bundles generated test source.

## Accelerators (optional)

```text
if local ArtifactGraph available: recommend/check the FE repo's unit-gen allowlist
else: run codegenkit unit-gen directly
```

Missing ArtifactGraph never blocks unit generation. Complete the direct,
deterministic Codegenkit fallback first, then follow
`.cursor/rules/codegenkit-optional-integrations.mdc` for once-per-run telemetry.
