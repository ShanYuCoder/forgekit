---
name: api-spec
description: EXCLUSIVE /api-spec — ONLY for authoring backend API contract YAML trio per function slug under product/surfaces/. DO NOT merge multiple modules into single markdown files.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /api-spec — Backend API Contract

> [!CRITICAL] TEMPLATE REQUIREMENT
> You MUST read the template `.docskit/templates/api/backend-api.bundle.yaml` BEFORE generating any API spec.
> If this file is missing, you MUST STOP immediately and report an error to the user: "Template missing. Please run `docskit init` to generate templates." DO NOT attempt to guess the format or generate the YAML without it.

**SSOT contract:** `…/api/<seq>/01-backend-spec.yaml` only. Do **not** write `bundle.spec.api`.

**Screen inventory (which APIs this page calls):** entire **`ir/design.yaml`** — `design.actions` and nested `sections`/`zones` items with `apiRefs` or `#reuse-api`. After a **new** 01 exists, `docskit split` projects slim `api.endpoints` onto `ir/design.yaml` for FE/testkit. Reused APIs stay as `#reuse-api` + `reuseFrom` on the action/item (they do **not** appear in projected `api`).

No Laravel/Python code in this step.

Shared extracts: `.cursor/extracts/spec-evolution.md`, `api-spec-sync.md`, `entity-relationship.md`, `derived-data.md`, `agent-discipline.md`, `verify-gate.md`

Hashtags (read extract when tag present):
- `#call-external` → `.cursor/extracts/call-external.md`
- `#cross-entity-service` → `.cursor/extracts/cross-entity-service.md`
- `#reuse-api` → Gắn trên **action/item** của page (bundle → `ir/design.yaml`), kèm `reuseFrom` tới `01-backend-spec.yaml` đã có. **KHÔNG** gen trio mới.

## Input

Portal leaf. **Read the entire `ir/design.yaml` first** (actions + nested items that call APIs). If `ir/` is missing, Read `*.bundle.yaml` `design.actions` / sections the same way. Do **not** invent endpoints from memory or from old `bundle.spec.api`.

```text
product/surfaces/<surface>/CMP-*/<số>/<số>/…/   # leaf màn (NN = chuỗi số dưới CMP)
  ir/design.yaml     # inventory: actions[].apiRefs | tags #reuse-api + reuseFrom
  *.bundle.yaml      # authoring if not split yet
```

**Không có Portal FE** (webhook, partner API, public API) → dùng `/api-integration`, không dùng command này.

## STRICT OUTPUT & FOLDER STRUCTURE (PRODUCT/SURFACES ONLY)

> [!CAUTION] NO GROSS FILES / NO MARKDOWN CREATION
> - **NEVER** combine multiple modules or multiple screens into a single gross file (e.g. `04-api-spec-cmp-adm-000-and-009.md`).
> - **NEVER** write `.md` files directly. Markdown is generated ONLY by `pnpm docs:render`.
> - **EVERY** API contract MUST be scoped under its corresponding `product/surfaces/...` directory.

```text
# Function API — cùng leaf với FE bundle; trio KHÔNG sát leaf
product/surfaces/<surface>/CMP-*/01/01/01/     # ví dụ CMP-ADM-009/01/01/01
  <slug>.bundle.yaml
  ir/design.yaml
  ir/spec.yaml
  api/01/                      # <seq> = một API / một primary entity
    01-backend-spec.yaml       ← MUST BE VALID YAML (double-quote colons)
    02-openapi.yaml
    03-mock-data.yaml
  api/02/                      # API thứ hai của cùng màn (nếu có)

# Common API (LCA common/yaml/ — xem common-scope.md)
product/surfaces/<surface>/CMP-*/common/yaml/<component-slug>/
# or …/CMP-*/<NN>/common/yaml/ or product/surfaces/<surface>/common/yaml/ or product/surfaces/common/yaml/
├── 01-backend-spec.yaml
├── 02-openapi.yaml
└── 03-mock-data.yaml
```

One `01-backend-spec.yaml` = one module + one primary entity. Never dump every screen API into one file.

`docskit api:check --spec …/api/01/01-backend-spec.yaml` before handoff. `docskit openapi:gen --spec …/01-backend-spec.yaml` writes sibling `02-openapi.yaml`.

Member review: `pnpm docs:render` then `pnpm docs:dev`.

## STRICT API REUSE & EXPLICIT URI NAMING RULES

> [!IMPORTANT] COMMON MIDDLEWARE & API RESOLUTION (MANDATORY)
> Before authoring a new API spec, the Agent MUST:
> 1. Scan `product/surfaces/<surface>/common/yaml/` and `product/surfaces/common/yaml/` for defined common middlewares or APIs.
> 2. If the endpoint requires common cross-cutting logic (e.g. auth, rate-limit), inject `#middleware: <id>` instead of rewriting the logic.
> 3. Verify `#reuse-api` before creating a new endpoint (see below).

> [!IMPORTANT] API REUSE BEFORE DEFINING NEW ENDPOINTS
> - **Search First:** Before any trio, scan existing `01-backend-spec.yaml` under:
>   1. Sibling screens on this CMP: `product/surfaces/<surface>/CMP-*/<NN…>/api/<seq>/`
>   2. LCA `common/yaml/` (cluster → module → surface → global)
>   3. Other modules on the same surface
>   Use `docskit_route` / glob, or ArtifactGraph when available. Walk **this screen’s** `ir/design.yaml` actions/items for `#reuse-api` / `reuseFrom` (grill-dev / `/spec` tags reuse on the **page action**, not on a removed `spec.api` block).
> - **Tag `#reuse-api`:** If the action/item uses an API that already has a trio, set `tags: ["#reuse-api"]` and `reuseFrom:` to the **existing** `…/01-backend-spec.yaml` (or `common/yaml/…`). Write that on the **bundle** `design.actions` / item, then split. Do **not** copy the contract.
> - **SKIP YAML Generation:** Do **NOT** create `api/<seq>/` for `#reuse-api` actions. Do **not** run `openapi:gen` for them.
> - **Whole screen reuse:** If **every** API-calling action/item is `#reuse-api`, create **zero** `api/` folders. Handoff is the `reuseFrom` list only.
> - Only generate a new trio for **NEW unique** `apiRefs` (no existing 01 for that action/path).

> [!IMPORTANT] EXPLICIT ACTION SUFFIX URI NAMING (NO AMBIGUOUS RESTFUL PATHS)
> - Do **NOT** rely on implicit RESTful HTTP methods alone to guess intent (e.g. `GET /users/{id}` vs `PUT /users/{id}`).
> - Always append explicit action suffixes to URI paths for clarity and non-ambiguity:
>   - **Create:** `POST /api/v1/.../create`
>   - **Update:** `PUT /api/v1/.../{id}/update`
>   - **Duplicate:** `POST /api/v1/.../{id}/duplicate` (or `PUT`)
>   - **Permissions:** `PUT /api/v1/.../{id}/permissions`
>   - **Delete:** `DELETE /api/v1/.../{id}/delete`
>   - **Detail:** `GET /api/v1/.../{id}/detail`
>   - **List:** `GET /api/v1/.../list` (or `search`)

> [!IMPORTANT] ENDPOINT ERROR STORMING & EXPLICIT ERROR MATRIX
> - **Global Error Delegation:** `401 Unauthorized` (`#err:unauthorized`), `503 Maintenance` (`#err:maintenance`), `500 System` (`#err:system`) handled globally via OpenAPI `$ref: '#/components/responses/...'`. Do NOT duplicate in endpoint specs.
> - **Endpoint Nature Storming (Explicit Documenting):**
>   - **Detail / Update / Delete with `{id}` parameter:** MUST document `#err:not-found` (`404`) and `#err:idor-violation` (`403 TENANT_IDOR_VIOLATION`).
>   - **Form Submit (POST / PUT):** MUST document `#err:validation` (`422`) with explicit field validation rules.
>   - **Permission Checked Routes:** MUST document `#err:permission-denied` (`403 PERMISSION_DENIED`).
>   - **Conflict / Duplicate Actions:** MUST document `#err:conflict` (`409 RESOURCE_DUPLICATE` / `STATE_INVALID`).
>   - **Public / Master Data Routes:** Explicitly set `auth: false` and omit irrelevant auth/IDOR errors.

## Workflow (summary)

1. Feature group, module prefix, Platform/Tenant, aggregates, pivot M-N, relationships
2. **Inventory from design:** List every action/item with `apiRefs` or `#reuse-api`. Scan sibling `…/api/<seq>/` and `common/yaml/`. Reuse → `reuseFrom` only, **no** new trio. Unique `apiRefs` → author `api/<seq>/01`.
3. **Explicit URIs:** Apply explicit action suffixes (`/create`, `/{id}/update`, `/{id}/duplicate`, `/{id}/delete`, `/{id}/detail`).
4. Split endpoints by lifecycle, permission, pagination, payload weight into individual function slugs
5. Reuse detail API for detail + edit initial data; `select-items` for dropdowns
6. **Endpoint Error Storming:** Classify errors per endpoint nature using `#err:*` tags. Include `errorStorming` in `01-backend-spec.yaml` and corresponding `$ref` responses in `02-openapi.yaml`.
7. Request/response, validation, filters, errors; then `docskit openapi:gen --spec …/api/<seq>/01-backend-spec.yaml` for `02-openapi.yaml` (OpenAPI 3.0.3). Refine `01` and re-gen rather than a second stack-specific generator.
8. Không đoán: **AskQuestion** rồi ghi `01`. Không `openQuestions`. Member treo → `qa-inbox.md` (`QA-<feature.id>-NNNN`). `pendingTechDebt[].id` = cùng id đó khi Confirm defer.
9. Domain tags only (`#call-external`, `#cross-entity-service`, `#err:*`) — **no** `#gen:*` or `codegen` block (grill adds those)
10. Update `.harness/progress.md` when present

## Verification Checklist (Evidence Required)
- [ ] **Reuse vs new:** Every API-calling **action/item** on `ir/design.yaml` is either `#reuse-api` + `reuseFrom` (no new trio), or a **new** unique API with its own `…/api/<seq>/` trio.
- [ ] **No duplicate trio:** Did not generate `01/02/03` for `#reuse-api` or for an API that already lives on another màn / common.
- [ ] **Folder Location (new APIs only):**
  - **Common APIs:** LCA `common/yaml/<slug>/`.
  - **Function APIs:** `product/surfaces/<surface>/CMP-*/<NN…>/api/<seq>/` (never 01 on the FE leaf).
- [ ] **YAML Trio Generated:** Only for **new** unique APIs (skip this item when the screen is 100% `#reuse-api`).
- [ ] **Error Matrix Documented:** For **new** trios only — `#err:*` on 01 and `$ref` on generated 02.
- [ ] **No Direct Markdown:** Did NOT write `.md` files directly (Markdown is generated by `pnpm docs:render`).
- [ ] **Strict YAML Syntax:** All strings with colons (`:`) in YAML files are double-quoted (`"..."`).
- **DO NOT output fake checklists, i18n tables, or gross combined files.**



