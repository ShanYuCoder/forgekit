---
name: grill-api-unit
description: /grill-unit — BE grill gate before /unit API test generation.
disable-model-invocation: true
---

# /grill-unit

**Owner:** Codegenkit · audit gate before BE unit test generation.

Run after `npm run codegen:api:unit:dry` / `codegenkit api-unit-gen:dry` and
before committing generated test code.

## Target / ID Resolution Rule

- User prompt MAY specify a function ID, API slug, or short name (e.g. `API-AUTH-001`, `login`, `CMP-ADM-009`).
- Agent MUST resolve **`…/api/<seq>/01-backend-spec.yaml`** via `CODEGENKIT_DOCS_ROOT` or `docskit_route`.
- **Read the entire `01-backend-spec.yaml`**. Do **not** use `ir/design.yaml` or `ir/spec.yaml` as BE contract.
- Compare generated unit tests against that 01 file. Missing 01 → STOP, hand off to docs `/grill-api-spec`.
- Do NOT demand full filesystem paths from the user if an ID is given.

## Docs Root Resolution

1. If `CODEGENKIT_DOCS_ROOT` is set (non-empty), use it as the canonical
   pointer for locating `01-backend-spec.yaml`.
2. If `CODEGENKIT_DOCS_ROOT` is **not** set, fall back to Platform DNA
   configuration (`platform-dna`) to resolve the docs hub path.
   Platform DNA discovery is slower and more error-prone, so always prefer
   an explicit `CODEGENKIT_DOCS_ROOT` when available.

## Check

```text
if local ArtifactGraph available: check the BE repo's allowlist for apiUnitGenDry
else: npm run codegen:api:unit:dry -- --spec …
```

- Generated test files match endpoints in `01-backend-spec.yaml`.
- Auth/tenant fixtures use trusted project context, not generated stubs.
- Mock dependencies are properly scoped and isolated.
- Edge cases (null/empty/error) have distinct assertions.
- Async/retry tests are idempotent.

## Accelerators (optional)

```text
if ArtifactGraph available: local contract/tag/parity hints only
else: scoped spec-to-test comparison

if codegraph-<repo-key> for this checkout: callers/routes/existing test patterns
else: targeted repository search

architecture IDs / C4 → Docskit (DOCSKIT_ROOT), never CodeGraph
```

Missing accelerators never block the grill. Complete each scoped model or
targeted-local fallback first, then follow the remainder of this skill.
