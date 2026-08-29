---
name: update-spec
extractBundle: update-spec
description: /update-spec — delta update bundle/spec.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Pre-flight: re-read this entire `SKILL.md` via a file-read tool (do not rely on memory).
> - Materialize `TODO.md` at root from Workflow before durable writes; plan before patching the bundle.
> - Path SSOT: `product/surfaces/<surface>/CMP-*/<slug>/` (no `modules/` segment). Gaps → AskQuestion or `qa/open/` (`qa-inbox.md`); do not invent business data.
> - Protocol: `extracts/agent-execution-protocol.md` + host `AGENTS.md` / `agent-compliance`.

# /update-spec — Controlled spec delta

**Extracts:** `extractBundle: update-spec` → `.cursor/extracts/extract-registry.json`

Doc hub: `platform/toolchain/UPDATE-SPEC-FLOW.md` · `platform/toolchain/FEATURE-ARTIFACT-FLOWS.md`

## Load policy

| Read (whole file) | Write | Do not Read |
|-------------------|-------|-------------|
| **`ir/design.yaml`** — current tech/UI | Patch **`*.bundle.yaml`** then split | Generated `*.md`, `ir/*` as write target |
| **`ir/spec.yaml`** — if the delta is requirements/acceptance prose | | Cherry-picked keys from bundle |

Do **not** Read only `design.sections` / `spec.ui` slices from the bundle. Split exists so you load the full design IR.

## Scope

**In:** patch bundle (+ note plans handoff when E2E scope changes); Docskit split/check; emit `#update:*`; bump `specRevision`.

**Out:** full rewrite (`/spec`), close a `qa/open` item (`/qa-resolve`), legacy re-mine (`/update-spec-legacy`), production code, direct `ir/` edits.

## Workflow

1. Identify delta scope (one scenario / block / API field).
2. Patch minimal YAML sections in **bundle** per `spec-update-delta.md` (not `ir/*`).
3. Emit matching `#update:*` tags; bump `specRevision`.
4. If `featureStatus` was `wire` → `need-update`.
5. Record harness notes when present.
6. `docskit_bundle_split` / `docskit split -- <bundle>` (fallback `pnpm docs:split`)
7. `docskit_bundle_check` / `docskit split --check -- <bundle>` (fallback `pnpm docs:check`)
8. User runs `docs_render` / `docskit render` (manual; fallback `pnpm docs:render`)
9. Follow-up per matrix: handoff FE `/prototype` or `/grill-dev` / `/grill-bqa` — do not assume sibling codegen.

## Accelerators (optional)

```text
if ArtifactGraph available: tag/update suggest slice
else: apply spec-update extracts only (deterministic fallback)

Codegenkit / portal:gen is FE-lane only — never required on docs hub
```

Reused subagent ID is empty. Missing optionals never block `/update-spec`. After the existing fallback
completes, emit exactly one `docskit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/docskit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## Path examples

```text
product/surfaces/<surface>/CMP-*/<slug>/{id}.bundle.yaml   # patch here
product/surfaces/<surface>/CMP-*/<slug>/ir/*.yaml          # read-only — from split
# Plans: https://github.com/raintr91/base_test (open tests hub; no sibling path)
```

## Guardrails

- Do not strip legacy evidence or unrelated blocks.
- **Preserve Error Matrices:** When patching delta updates to actions or API endpoints, ensure UI Error Handling (`onSuccess`, `onCommonError`, `onSpecificError`) and API Hashtags (`#err:*`) are preserved and updated accordingly.
- Do not add `codegen` / `gen:` without Dev alignment — hand off `/grill-dev`.
- Tags cleared only at `/wire` — not during this command.

## Done

- Delta documented in bundle + tags; `ir/*` regenerated and split:check pass.
- Next command obvious from patch type.
