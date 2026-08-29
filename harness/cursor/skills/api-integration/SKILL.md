---
name: api-integration
description: EXCLUSIVE /api-integration — ONLY for backend integration contracts (partner APIs, webhooks). DO NOT merge multiple integrations into single markdown files.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /api-integration — Integration Contract (no Portal FE)

**Không** đọc Portal `*.spec.yaml` / `testcases/*.yaml`. **Không** code trực tiếp.

Shared extracts: `.cursor/extracts/api-integration-spec.md`, `entity-relationship.md`, `call-external.md`, `agent-discipline.md`, `verify-gate.md`

## When (use this instead of `/api-spec`)

- Webhook inbound / outbound
- REST API xuất cho partner / bên thứ 3
- Public API có versioning riêng
- Reverse-engineer từ legacy handler hoặc provider OpenAPI

If Portal FE spec exists for the same UX → use `/api-spec`, not this command.

## Input

```text
User: provider name, event list, partner PDF/OpenAPI URL, legacy path
docs/templates/backend-api-integration.yaml
docs/operational/BACKEND_API_SPEC_GUIDE.md  # § Integration
Optional: ../legacy/... controller routes
Optional: docs/integrations/{provider}/*.md (repo-local notes)
```

## STRICT OUTPUT & FOLDER STRUCTURE (PRODUCT/SURFACES ONLY)

> [!CAUTION] NO GROSS FILES / NO MARKDOWN CREATION
> - **NEVER** combine multiple integration endpoints into a single gross file.
> - **NEVER** write `.md` files directly. Markdown is generated ONLY by `pnpm docs:render`.
> - **EVERY** contract MUST be scoped under `product/surfaces/integrations/<provider>/<slug>/`.

```text
product/surfaces/integrations/<provider>/<slug>/api/<seq>/
├── 01-backend-spec.yaml    # feature.source.kind + integrationRefs (tech SSOT)
├── 02-openapi.yaml         # docskit openapi:gen from 01
└── 03-mock-data.yaml
```

One 01 = one primary entity. Never dump every provider action into one file.

Slug ví dụ: `product/surfaces/integrations/stripe/charge/api/01/`.


## STRICT API REUSE & EXPLICIT URI NAMING RULES

> [!IMPORTANT] API REUSE BEFORE DEFINING NEW ENDPOINTS
> - **Search First:** Agent MUST search existing integration endpoints under `product/surfaces/integrations/` using `docskit_route` or glob.
> - **Reuse Existing:** If an integration API endpoint already exists, reuse it instead of re-defining duplicate routes.

> [!IMPORTANT] EXPLICIT ACTION SUFFIX URI NAMING (NO AMBIGUOUS RESTFUL PATHS)
> - Do **NOT** rely on implicit RESTful HTTP methods alone to guess intent.
> - Always append explicit action suffixes to URI paths for clarity and non-ambiguity:
>   - Webhook inbound: `POST /api/v1/integrations/<provider>/webhook`
>   - Inbound event action: `POST /api/v1/integrations/<provider>/{id}/sync` (or `/receive`)
>   - Outbound partner API: `POST /api/v1/integrations/<provider>/create`, `PUT /api/v1/integrations/<provider>/{id}/update`

> [!IMPORTANT] INTEGRATION ERROR HANDLING & EXPLICIT ERROR MATRIX
> - **Partner / Webhook Errors:** Document explicit error responses for integrations (`#err:unauthorized`, `#err:signature-invalid`, `#err:rate-limit`, `#err:validation`, `#err:system`).
> - **Global Error Delegation:** Delegate standard 500/503/401 to global OpenAPI `$ref` schemas.
> - **Explicit Partner Codes:** Provide partner-facing error code mappings in `01-backend-spec.yaml` and `02-openapi.yaml`.

## Workflow

1. Set `feature.source.kind`, `base: none`, `integrationRefs[]` — **empty** `portalRefs`
2. **Check API Reuse & Explicit URIs:** Check `product/surfaces/integrations/` for existing endpoints and apply explicit action suffixes.
3. `contexts.portalLayout: none`; document `contexts.auth` (API key, HMAC, OAuth)
4. Inventory events/endpoints từ provider doc hoặc legacy code — mark `inferredFromCode` in `notes`
5. Entities, idempotency keys, dedup, raw payload policy → `decisions` / `beOnlyRequirements`
6. `api.endpoints` — dùng explicit action URIs
7. **Integration Error Storming:** Document partner-facing error codes, validation failures, HMAC/Auth errors using `#err:*` tags.
8. `docskit openapi:gen --spec …/api/<seq>/01-backend-spec.yaml` — `securitySchemes`, webhook request body, partner-facing errors. Do not hand-author 02 as SSOT.
9. Mock: representative webhook JSON + ack response
10. Domain tags only: `#webhook-inbound`, `#webhook-outbound`, `#partner-api`, `#public-api`, `#call-external`, `#err:*`
11. **No** `codegen`, **no** `#gen:*`, **no** `approval` beyond `draft` — grill adds
12. `integrationBacklog[]` cho event/endpoint defer (thay `pendingTechDebt` portal)
13. Signature, retry, retention: AskQuestion + ghi `01` / `decisions`. Treo → `qa/open/QA-<feature.id>-NNNN.yaml`. Không `openQuestions`.
14. Update `.harness/progress.md` when present

## Verification Checklist (Evidence Required)
- [ ] **Folder Structure:** Trio under `product/surfaces/integrations/<provider>/<slug>/api/<seq>/` (no gross combined files; no 01 on the slug leaf).
- [ ] **YAML Trio Generated:** Created `01-backend-spec.yaml`, `02-openapi.yaml`, and `03-mock-data.yaml` per folder.
- [ ] **Error Matrix Documented:** Explicitly specified partner-facing error codes and `#err:*` tags in `01-backend-spec.yaml` and `02-openapi.yaml`.
- [ ] **No Direct Markdown:** Did NOT write `.md` files directly.
- [ ] **Strict YAML Syntax:** All strings with colons (`:`) in YAML files are double-quoted (`"..."`).
- **DO NOT output fake checklists, i18n tables, or framework prose.**

