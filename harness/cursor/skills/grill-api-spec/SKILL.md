---
name: grill-api-spec
description: EXCLUSIVE /grill-api-spec — ONLY for auditing backend API contract YAML in product/surfaces/ after /api-spec. DO NOT generate Markdown reports.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /grill-api-spec — Backend Contract Audit (Pure Backend Technical)

After `/api-spec`, before BE `/api` (Codegenkit). **Pure Backend Technical Audit** (Database schemas, API endpoints, data types, securitySchemes, `#reuse-api` checks).

Shared extracts: `.cursor/extracts/spec-evolution.md`, `api-spec-sync.md`, `entity-relationship.md`, `call-external.md`, `cross-entity-service.md`, `derived-data.md`, `agent-discipline.md`, `api-codegen-readiness.md`, `api-codegen-tags.md`, `verify-gate.md`

- **Which APIs this screen needs:** read entire **`ir/design.yaml`** (`actions` / nested items: `apiRefs`, `#reuse-api`, `reuseFrom`). That is **not** the BE contract.
- **Contract write/audit:** `01-backend-spec.yaml` only. `02-openapi.yaml` is generated (`docskit openapi:gen`). Do **not** author payloads from projected `design.api`.
- OpenAPI and mock data align with `01-backend-spec.yaml`
- Verify API reuse (`#reuse-api` on page actions) — skip duplicate trios. If every API-calling action is `#reuse-api`, there must be **no** new `api/<seq>/` here; `reuseFrom` must resolve to an existing 01.
- Spec is **codegen-ready** for Codegenkit `api-gen:dry --spec …/01-backend-spec.yaml`
- Hashtags, Error Matrix (`#err:*`), and edge cases documented for implementation

## Workflow

1. Resolve this leaf’s **`ir/design.yaml`** first (or bundle `design` if not split). `#reuse-api` actions/items → confirm `reuseFrom` `01-backend-spec.yaml` exists. Only then open **new** trios for remaining `apiRefs`. Never a 01 on the FE leaf.
2. Cross-check requirements vs endpoints, entities, permissions, validation, errors
3. Audit Engineering & Error Hashtags:
   - Verify `#call-external`, `#cross-service`, `#cross-entity-service`, `#derived-data`. `#tech-debt:*` must be `#tech-debt:QA-<feature.id>-NNNN` with a file in `qa/open/` (`qa-inbox.md`).
   - **Verify Endpoint Error Storming Matrix (`#err:*`):** Ensure 404 (Not Found) & 403 (IDOR) exist for routes with `{id}`, 422 (Validation) exists for Form Submits, and 403 (Permission) exists for authed endpoints.
   - Check if backend service/DTO HBS codegen templates match endpoints.
4. Enrich spec: `codegen.profile|entity|module`, `api.endpoints[].action`, `#gen:*` tags, `approval` (see `api-codegen-readiness.md`). One 01 = one entity.
5. Fix clear gaps in YAML/OpenAPI/mock **in scope**
6. Run gates (docs hub):
   `docskit api:check --spec product/surfaces/<surface>/CMP-*/<NN…>/api/<seq>/01-backend-spec.yaml`
   `docskit openapi:gen --spec …/01-backend-spec.yaml`
   `docskit openapi:render`
7. Ask user only for product decisions; use codebase/Portal evidence otherwise
8. Record handoff in `.harness/progress.md` when present — NOT in generated files
9. Remind member: `pnpm docs:render` for review docs

## Out of scope

- **NO PROSE / NO BQA REPORTS:** Do NOT output Markdown reports, BQA 3-Pillars reports, or framework-specific code snippets.
- Do not scaffold code classes directly. Do not Write `ir/*`.

## Verification Checklist (Evidence Required)
- [ ] **Reuse:** `#reuse-api` **actions/items** have no extra trio on this leaf; `reuseFrom` points to an existing 01.
- [ ] **Target Location (new APIs only):** Audited `01-backend-spec.yaml` under `…/api/<seq>/` or `…/common/yaml/<slug>/`. Skip if the screen is 100% reuse.
- [ ] **Error Matrix Audited:** For **new** trios: `{id}` → 404 & 403 IDOR; POST/PUT → 422; global errors via OpenAPI `$ref`.
- [ ] **Codegen Tags Added:** On **new** 01 files: `#gen:*` and `action` populated.
- [ ] **Gates Executed:** `docskit api:check` + `openapi:gen` / `openapi:render` for **new** trios only (not for `#reuse-api`).
- [ ] **Approval Updated:** `approval.status` on **new** 01 YAML when present.
- **DO NOT output fake checklists, i18n tables, or framework prose.**
