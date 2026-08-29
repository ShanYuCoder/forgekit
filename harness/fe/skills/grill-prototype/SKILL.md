---
name: grill-prototype
description: /grill-prototype — FE grill gate before /prototype generation.
disable-model-invocation: true
---

# /grill-prototype

**Owner:** Codegenkit · optional local ArtifactGraph allowlist check before dry-gen.

## Target / ID Resolution Rule

- User prompt MAY specify a screen ID, function ID, or slug (e.g. `W-AD-AUTH-001`, `login`).
- **Read the entire `ir/design.yaml`** on the screen leaf (`…/CMP-*/<NN…>/ir/design.yaml`) before dry-gen. Do not skim keys from a feature bundle. Do **not** use `01-backend-spec.yaml` as FE input.
- Docs hub is **read-only**. Dry-gen failure (missing design / `codegen.profile`) → STOP; do not patch docs.
- After dry-gen, HANDOFF `#needs-component` is filled in `/prototype` using the FE shadcn skill when `components.json` exists (primitives via `shadcn add`, `Mo*` composed — see `/prototype`). Surface/module commons must already exist via `/gen-common`.
- Do NOT demand full surface/module filesystem paths from the user if an ID is given.

```text
if local ArtifactGraph available: check the FE repo's allowlist for genDry
else: npm run codegen:dry -- --id …
```

## Docs Root Resolution

1. If `CODEGENKIT_DOCS_ROOT` is set (non-empty), use it as the canonical
   pointer for locating `ir/design.yaml`.
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

Do not execute docskit scripts from the FE repo.
