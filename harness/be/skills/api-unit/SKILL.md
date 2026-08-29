---
name: api-unit
description: /unit — backend API unit test generation via Codegenkit BE adapters.
disable-model-invocation: true
---

# /unit — Backend API Unit Tests

**Owner:** Codegenkit (`--type=be`)
**Adapters:** `fastapi` · `laravel` · `nestjs`

> `dotnet-integration` emits test source during its primary API pass; it has no
> separate unit-generation engine.

## Generate

```bash
npm run codegen:api:unit:dry -- --spec /path/to/api/01/01-backend-spec.yaml
npm run codegen:api:unit -- --spec /path/to/api/01/01-backend-spec.yaml

# Fallback direct CLI if wrappers missing:
codegenkit api-unit-gen:dry --adapter=fastapi -- --spec /path/to/api/01/01-backend-spec.yaml
codegenkit api-unit-gen --adapter=fastapi -- --spec /path/to/api/01/01-backend-spec.yaml

codegenkit api-unit-gen:dry --adapter=laravel -- --spec /path/to/api/01/01-backend-spec.yaml
codegenkit api-unit-gen --adapter=laravel -- --spec /path/to/api/01/01-backend-spec.yaml
codegenkit api-unit-registry --adapter=laravel

codegenkit api-unit-gen:dry --adapter=nestjs -- --spec /path/to/api/01/01-backend-spec.yaml
codegenkit api-unit-gen --adapter=nestjs -- --spec /path/to/api/01/01-backend-spec.yaml
codegenkit api-unit-registry --adapter=nestjs
```

You MUST run the codegen script (`npm run codegen:api:unit` or
`codegenkit api-unit-gen`) FIRST to generate the test skeleton from the backend
spec, before attempting to fill in gaps or add missing tests manually.

Requires a prior `01-backend-spec.yaml` under the docskit API folder.

## Docs Root Resolution

1. If `CODEGENKIT_DOCS_ROOT` is set (non-empty), use it as the canonical
   registry/IR pointer for locating `01-backend-spec.yaml`.
2. If `CODEGENKIT_DOCS_ROOT` is **not** set, fall back to Platform DNA
   configuration (`platform-dna`) to resolve the docs hub path.
   Platform DNA discovery is slower and more error-prone, so always prefer
   an explicit `CODEGENKIT_DOCS_ROOT` when available.

## Route

Architecture/C4 → Docskit (`DOCSKIT_ROOT`); spec via explicit `--spec` /
`CODEGENKIT_DOCS_ROOT` when configured — never ArtifactGraph as the docs
bridge. This-repo conventions → local CodeGraph if present; other repo X →
only Platform DNA-wired `codegraph-<key>`. ArtifactGraph = local allowlist
hints only.

## Review requirements

- Verify generated tests cover all endpoints in `01-backend-spec.yaml`.
- Replace generated auth/mock placeholders with project-specific fixtures.
- Run backend test suite to confirm generated tests pass.

## Accelerators (optional)

```text
if ArtifactGraph available: allowlist/recommend API unit generation
else: execute Codegenkit adapter directly

if CodeGraph available for this checkout (`codegraph-<key>`): inspect existing test conventions
else: targeted repository search — never a workspace-parent graph
```

Missing accelerators never block unit generation. Complete each documented
direct or targeted-local fallback first, then follow
`.cursor/rules/codegenkit-optional-integrations.mdc` for deduplicated
once-per-run-and-optional telemetry with observed metrics only.
