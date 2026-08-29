---
name: grill-bqa
extractBundle: bqa-grill
description: EXCLUSIVE /grill-bqa — ONLY for BA/BQA UI acceptance criteria. Gaps use AskQuestion in-session; do not persist openQuestions in YAML. DO NOT trigger for dev codegen tags.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Pre-flight: re-read this entire `SKILL.md` via a file-read tool (do not rely on memory).
> - Materialize `TODO.md` ở root from every Workflow step + optional Accelerators before other durable writes.
> - For `#missing_info` / open gaps: ArtifactGraph re-check → micro-scope → propose (Recommended) on **Chat Thread** → **STOP for member confirm** before patching settled SSOT and updating **Artifact Registry**.
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform a shallow check. Verify against the **Verification Checklist** via harness TODO evidence.

# /grill-bqa — Spec Validation (BQA / UI)

**Re-check only:** Do **not** author `design.zones[].items[]` or `spec.ui.list|form` from scratch. `/spec` already filled inventory when info existed. This skill re-checks copy/layout/`purpose` vs common, fills `#missing_info` after Confirm, and fixes mistakes.

**Mindset:** Spec Validation + Decision Resolution — **not** domain archaeology.

**Extracts:** `extractBundle: bqa-grill` → `.cursor/extracts/grill/validation.md`

## Target / ID Resolution Rule

- User prompt MAY specify a screen ID, function ID, or slug (e.g. `CMP-ADM-000-001`, `W-AD-AUTH-001`, `login`).
- Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve target path under `product/surfaces/...`.
- Do NOT demand full surface/module filesystem paths from the user.

## Load policy

Split is the token cut: **Read the entire IR file**. Do **not** cherry-pick keys (`design.sections`, `spec.ui`, …) out of a long `*.bundle.yaml`.

| Read (whole file) | Write | Do not Read |
|-------------------|-------|-------------|
| **`ir/design.yaml`** — UI inventory, copy, visual, actions | After Confirm: patch **`*.bundle.yaml`** then `pnpm spec:split` | Generated `*.md` |
| **`ir/spec.yaml`** — only when checking requirements / acceptance prose | | `bundle.gen` |

If `ir/` is missing, Read the **entire** `*.bundle.yaml` once (first `/spec` not split yet).

> [!IMPORTANT] MANDATORY UI ERROR HANDLING BEHAVIOR SPECIFICATION
> Agent MUST explicitly document 3 UI execution outcomes for EVERY user action / API call in `design.yaml`:
> 1. **On Success (`200/201`):** Action feedback, state transition, toast/modal feedback, navigation.
> 2. **On Common Global Error (`401/500/503`):** Default inheritance from `#ui-common:error-handler` (Global toast/redirect). Explicitly document `override: true` if UI requires custom behavior (e.g. Inline alert instead of global toast).
> 3. **On Specific Error (`422/404/403/409`):**
>    - **`422 Validation`:** Exact placement of inline field error messages (`errors: {field: [msg]}`).
>    - **`404 Not Found`:** Empty state UI / 404 Component rendering.
>    - **`403 IDOR` (`TENANT_IDOR_VIOLATION`):** Access blocked UI / Safety redirect.
>    - **`409 Conflict`:** Specific modal/dialog copywriting for duplicate data or invalid state.

## Workflow

**Step A — fact-lock** (`grillStatus.bqaFacts`)

0. Create/update `TODO.md` ở root + plan. Deferred gaps: `.cursor/extracts/qa-inbox.md` (`qa/open/QA-<page-id>-NNNN.yaml`, `#tech-debt:QA-…`).
1. Compare `design.zones/behavior/actions` vs `legacy.ui` vs common UI. **UI Metrics SSOT:** Ensure basic CSS properties (font-size, colors) are NOT redundantly specified in feature specs unless they are explicit overrides of the Design System (`common/yaml/design-system.bundle.yaml`).
2. **Audit Business & Stakeholder Focus:** Đảm bảo `summary` kể được câu chuyện nghiệp vụ theo chuẩn Arc42 (mục tiêu nghiệp vụ, kịch bản người dùng) bằng ngôn ngữ 100% Non-tech. Kiểm tra xem `spec.requirements` đã định nghĩa đủ: (1) Field Validations, (2) State Machine, (3) UI Permissions, (4) Edge Cases chưa. Nếu thiếu, reject & yêu cầu bổ sung.
3. **Cross-check Common Patterns:** Walk up from the function: nearest `common/patterns/` then module, surface, `product/surfaces/common/patterns/` (`.cursor/extracts/common-scope.md`).
4. **Audit UI Error Handling Flows:** Ensure every user action/API call in `design.yaml` has detailed specifications for Success, Common Global Error, and Specific Errors.
4. Patch **bundle** (`design`, `review`, `spec` requirements) → `docskit_bundle_split` / `docskit split` (fallback `pnpm docs:split`).
5. Set `grillStatus.bqaFacts: done`.
6. **Rule:** chưa `bqaFacts: done` → không chạy Step B wizard.

**Step B — member wizard** (`grillStatus.bqaOpen`) — **chat/AskQuestion only; complete spec**

7. Gaps: Cursor **AskQuestion** (2–5 options, Recommended, **Other**). Batches ≤5. **STOP**.
8. After **member** picks a named option or Other **with** a decision: apply into `design` / `review`. Other **chưa chốt** → `qa-inbox.md`. Close later with **`/qa-resolve`**. Never invent.
9. `grillStatus.bqaOpen: done` when this pass’s answers **or** QA pointers are on disk. Leftover `#missing_info` **with** a `QA-…` id is allowed (does not block).
10. User: `docs_render` / `docskit render` (fallback `pnpm docs:render`).

## Accelerators (optional)

```text
if ArtifactGraph available: grill/parity hints
else: model review from design+legacy slices (model fallback)

if Docskit available: ID → doc path for referenced CMP/FLOW
else: search docs tree (local fallback)
```

Missing optionals never block `/grill-bqa`. After the existing fallback
completes, emit exactly one `docskit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/docskit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## specOrigin branches

- **legacy:** design vs legacyEvidence vs common UI
- **requirement:** complete zones + common — không legacy

## Out of scope

`codegen`, `gen`, `ui.filters/columns`, `portal:gen`, implement UI.

## Handoff

→ `/grill-dev`

## Verification Checklist
- [ ] Harness TODO under `TODO.md` ở root kept in sync with evidence.
- [ ] Strict compliance with Load Policy (did not load out-of-scope files like codegen or legacy source code).
- [ ] **UI Error Flow Detailed:** Every API call/user action in `design.yaml` has explicit On Success, On Common Error, and On Specific Error handling specified.
- [ ] `#missing_info` / proposals used the hard confirmation gate (no silent overwrite of settled SSOT), updated Artifact Registry after confirm.
- [ ] Step A completed with `grillStatus.bqaFacts: done` before Step B wizard.
- [ ] Gaps used **AskQuestion** + member confirm, **or** a `qa/open/QA-<page-id>-NNNN.yaml` pointer. Bundle has **no** `openQuestions`.
- [ ] `grillStatus.bqaOpen: done` after this pass (defer via QA files is OK).
- [ ] Executed bundle split and rendered docs.

