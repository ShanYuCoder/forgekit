---
name: grill-dev
extractBundle: dev-grill
description: EXCLUSIVE /grill-dev — ONLY for engineering codegen tags and bundle.gen. DO NOT trigger for BQA, BA, or UI design grills.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Pre-flight: re-read this entire `SKILL.md` via a file-read tool (do not rely on memory).
> - Materialize `TODO.md` at root from every Workflow step + optional Accelerators before other durable writes.
> - For `#missing_info` / open gaps: ArtifactGraph re-check → micro-scope → propose → **STOP for member confirm** before overwriting settled SSOT.
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform a shallow check. Verify against the **Verification Checklist** via harness TODO evidence.

# /grill-dev — Dev / codegen grill

Ambiguous codegen/API facts: **AskQuestion** (Recommended + **Other**), then write **`bundle.gen`** and **`api/<seq>/01-backend-spec.yaml`**. Member Other chưa chốt → `qa-inbox.md` (đóng **`/qa-resolve`**). Empty `codegen.profile` / required `entity`/`module` / 01 endpoint `action` still block `grillStatus.dev: done`.

**Hard gate (codegenkit input):** Do **not** set `grillStatus.dev: done` until `bundle.gen` has:

```yaml
gen:
  codegen:
    profile: "auth"   # login/forgot/reset. change-password | public | not-found | error | list | create | admin-crud
    entity: ""
    module: ""
  tags:
    - "#gen:test-schema"
    - "#gen:test-service"
  ui:
    filters: []
    columns: []
    composition: null
    testIds: null
```

Missing `gen.codegen.profile` **or** (for list/create/admin-crud/auth/change-password/public) empty `entity`/`module` **or** sibling `01` endpoints without `action` + path suffix → **STOP**, report to member, keep `grillStatus.dev: pending`. Split **fails** if you mark `done` without those fields. Do **not** author `bundle.spec.api`.

**Profile → layout (do not use `create` for auth):**
| profile | Pages | Next.js output |
|---------|--------|----------------|
| `auth` | login, forgot, reset | `src/app/(auth)/…` — no admin chrome |
| `change-password` | change password (logged-in) | `src/app/(dashboard)/…` |
| `public` | marketing / other public | `src/app/(public)/…` |
| `not-found` | 404 | `src/app/not-found.tsx` |
| `error` | 503 / error | `src/app/error.tsx` |
| `list` / `create` / `admin-crud` | admin CRUD | `src/app/(dashboard)/…` |

Lookup **design.registry** / existing `#ui:` before `#needs-component`. Unknown widget → `#needs-ui:` or ask the member — never invent a shadcn name. Codegenkit dry-run fails unknown `#ui:`; do not patch that from this skill.

After `pnpm spec:split`, **FE and Testkit** read the **entire** `ir/design.yaml` (its `api` is **projected** from 01). **Author and BE** use `…/api/<seq>/01-backend-spec.yaml` only. Do not send consumers `ir/spec.yaml` prose.

Doc hub: `platform/toolchain/PORTAL-CODEGEN.md`

**Extracts:** `extractBundle: dev-grill` → `codegen/readiness.md`, `platform-mark-detect.md`

## Target / ID Resolution Rule

- User prompt MAY specify a screen ID, function ID, or short slug (e.g. `CMP-ADM-000-001`, `W-AD-AUTH-001`, `login`).
- Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve target path under `product/surfaces/...`.
- Do NOT demand full surface/module filesystem paths from the user.

## Load policy

**Read the entire `ir/design.yaml`** (layout, ui, projected api, entities, codegen, tags). For contracts, Read sibling **`api/<seq>/01-backend-spec.yaml`**. Do **not** filter keys from `*.bundle.yaml`.

| Read (whole file) | Write | Do not Read |
|-------------------|-------|-------------|
| **`ir/design.yaml`** | `bundle.gen` on **`*.bundle.yaml`**, then `pnpm spec:split` | `ir/spec.yaml` prose, generated `*.md` |
| **`…/api/<seq>/01-backend-spec.yaml`** | endpoint `action` / path on **01** (not `bundle.spec.api`) | |

If `ir/` is missing, Read the **entire** `*.bundle.yaml` once (still no `spec.api` authoring).

Extracts: `codegen/*`, `legacy/legacy-api-migration.md`, `platform-mark-detect.md`. Not UX copy debates.

## Workflow (Technical & Engineering Only — No BQA Business Questions)

1. Expect `grillStatus.bqaOpen: done` (or `bqaFacts` for requirement-only).
2. **Technical Review Only:** Ensure technical architecture and API contracts align strictly with the `summary.business_goals` and `user_journey` (Do NOT debate BQA business rules, but ensure dev output fulfills the business purpose). Focus strictly on Database tables, data types, API contracts, routing paths, hidden fields, composables, and codegen tags. Đảm bảo các `Edge Cases` và `Validations` ở tầng business được map đầy đủ với mã lỗi HTTP (`#err:*`).
3. Derive from the **entire** `ir/design.yaml` → write **`bundle.gen`** on `*.bundle.yaml`, then `pnpm spec:split`:
   - `codegen`, `tags`, `ui.filters`, `ui.columns`, `ui.composition`, `ui.testIds`
   - **01** `api.endpoints[].action` (then split projects onto `ir/design.yaml`)
   - **Component & HBS Template Check:** Verify if required UI components exist or if Handlebars (`.hbs`) codegen templates are available for rendering. Mark missing ones with `#needs-component` / `#needs-ui`. 
     - **UI registry first:** Before `#needs-component`, match the widget against `design.registry` and existing `#ui:` tags. Primitive → `#ui:`. Unknown → `#needs-ui:` or ask; never fake a shadcn component name.
     - **Proactive UI Splitting:** ≥2 **domain** blocks → `#needs-component: MoBlockName`. Shadcn primitives → `#ui:` only (FE [shadcn skill](https://ui.shadcn.com/docs/skills) + `shadcn add`). Do not `#needs-component: Dialog`.
     - **Deeply Nested Structure (Global Store):** If the screen contains deeply nested UI blocks ($\ge 3$ levels deep, e.g., Page -> Tab -> Card -> Sub-table), you MUST suggest `#use-store` to prevent prop-drilling. Codegenkit will automatically generate a Pinia (Nuxt) or Zustand (Next.js) store for state management.
     - **Absolute Rule for Forms:** Whenever a form is present (Create, Edit, Modal, etc.), it MUST be extracted as an independent SPA component. Ensure the spec properly defines `ui.form` and do NOT merge form layout into the page shell.
   - **Check Common Pattern Tags (`#pattern`):** `#pattern` must map to a bundle found by walking up `common/yaml/` (cluster → module → surface → global). Do not require only surface-level common.
   - **Check API Reuse (`#reuse-api`):** Search `common/yaml/` (LCA) or sibling `…/api/<seq>/`. If the action/item calls an existing 01, tag `#reuse-api` and set `reuseFrom` on that **page action/item** (not a `spec.api` block). `/api-spec` then skips a new trio.
   - **Explicit Action Suffixes:** Ensure endpoints follow explicit naming (`/create`, `/{id}/update`, `/{id}/duplicate`, `/{id}/delete`, `/{id}/detail`). No ambiguous RESTful paths.
   - **Hashtag & Error Matrix Verification:** Verify and apply domain/engineering hashtags: `#call-external`, `#cross-service`, `#cross-entity-service`, `#derived-data`, `#tech-debt:*`, `#err:*` (`#err:validation`, `#err:idor-violation`, `#err:not-found`, `#err:permission-denied`), and code-size compliance tags (`#split-hook:columns`, `#split-hook:filters`, `#split-hook:export`, `#split-hook:form-sections`).
4. Keep `#needs-component`, `#manual-composable`, `#skip-codegen`, `#wire-only`, `#phase-api`.
5. List: `#gen:test-schema`, `#gen:test-service` · Create: `#gen:test-validation`
6. **Common candidates** — scan columns, toolbar, filters, composables:
   - Prefer `artifactgraph_grill_check` / `artifactgraph_analyze` on `ir/design.yaml` when MCP wired
   - Mỗi `render: custom` → `#needs-component: cell-{key}:MoXxx` **hoặc** Mo* trong design registry
   - Widget lạ → `lookupAlias()` → `#ui:` / `#needs-ui:`
   - Logic lặp (export, auth) → hỏi member `#common:` / `#needs-common:` (`platform-mark-detect.md`)
   - In bảng **Common candidates** (Vietnamese) — member chọn A/B/C; `artifactgraph_remember` when available
7. Optional `marks[]` on spec for confirmed B choices
8. Set `grillStatus.dev: done` only if profile + entity/module (list/create/admin-crud) + endpoint actions are set.
9. **Recommendation gate:** if ArtifactGraph is available, call
   `artifactgraph_allowlist_check(commandKey=genDry)` then
   `artifactgraph_recommend_command`. Do **not** execute gen in docs hub.
10. `docskit_bundle_split` if edited bundle; user runs `docs_render`.
11. Handoff the spec ID/path + recommendation to FE Codegenkit. Missing
    Codegenkit means “pending FE dry-run”, not a docs failure.

## Accelerators (optional)

```text
if ArtifactGraph available: analyze/grill/tag hints + recommend genDry
else: model review from scoped bundle/design/legacy evidence (model fallback)

if Docskit available: resolve CMP/CTR IDs
else: repository path conventions (deterministic fallback)
```

Missing optionals never block this docs-side grill. After the existing fallback
completes, emit exactly one `docskit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/docskit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## Out of scope

- **NO PROSE / NO BQA REPORTS:** Do NOT output Markdown reports, BQA 3-Pillars reports, or framework-specific code snippets (FastAPI, Pydantic, Axios, i18n).
- UX prose, acceptance rewrite, implement UI, full E2E.

## Handoff

- FE Codegenkit dry pass → `/prototype`
- BQA↔Dev conflict → `/grill-docs`
- Legacy fact gap → `/update-spec-legacy`
- Member chose promote common → `/platform-mark` same session or before `/prototype`

## Verification Checklist (Evidence Required)
- [ ] **Codegen profile:** `bundle.gen.codegen.profile` quoted. Login/forgot/reset = **`auth`** (never `create`). Change password = **`change-password`**. 404 = **`not-found`**. 503 = **`error`**. Other public = **`public`**.
- [ ] **gen.ui derived:** `filters` / `columns` / `composition` / `testIds` present under `bundle.gen.ui` (empty arrays OK if inventory is empty — then flag `/spec` gap).
- [ ] **Tags:** List profile tags present (`#gen:test-schema` + `#gen:test-service` for list; `#gen:test-validation` for create).
- [ ] **Target Bundle Updated:** Exact path of updated `*.bundle.yaml`.
- [ ] **Status Updated:** `grillStatus.dev: done` **only if** codegen.profile, entity/module (when required), and **01** endpoint actions are set. Did **not** write `bundle.spec.api`.
- [ ] **Split Command:** `docskit split` / `pnpm docs:split` with zero errors.
- **DO NOT output fake checklists or unrelated framework reports.**


