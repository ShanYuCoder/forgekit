---
name: grill-integration-spec
description: EXCLUSIVE /grill-integration-spec — ONLY for auditing backend integration contracts under product/surfaces/integrations/. DO NOT generate Markdown reports.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /grill-integration-spec — Integration Contract Audit

After `/api-integration`, before Codegenkit BE `/api`. No code implementation on the docs hub.

Shared extracts: `.cursor/extracts/api-integration-spec.md`, `api-codegen-readiness.md`, `api-codegen-tags.md`, `call-external.md`, `entity-relationship.md`, `agent-discipline.md`, `verify-gate.md`

## Goal

- Contract đủ cho implement webhook/partner API
- OpenAPI `securitySchemes` + mock khớp `01-backend-spec.yaml`
- Codegen-ready: `docskit api:check` + `docskit openapi:gen` / `openapi:render`
- Do **not** use `ir/design.yaml` as BE input (integrations usually have no FE IR)

## Workflow

1. Resolve `product/surfaces/integrations/<provider>/<slug>/api/<seq>/01-backend-spec.yaml`; never a 01 on the slug leaf
2. Audit auth, securitySchemes, idempotency, retry, and non-CRUD actions
3. Enrich **01** with codegen tags (`#gen:*`, `#manual-service`, `#call-external`), `codegen.profile|entity|module`, `endpoints[].action`
4. Run gates (docs hub):
   `docskit api:check --spec product/surfaces/integrations/<provider>/<slug>/api/<seq>/01-backend-spec.yaml`
   `docskit openapi:gen --spec …/01-backend-spec.yaml`
   `docskit openapi:render`
5. Set `approval.status: reviewed` (or `approved`) in YAML

## Out of scope

- **NO PROSE / NO BQA REPORTS:** Do NOT output Markdown reports, BQA 3-Pillars reports, or framework-specific code snippets.
- Do not scaffold code classes. Do not Write `ir/*`.

## Verification Checklist (Evidence Required)
- [ ] **Target Location:** Audited `01-backend-spec.yaml` under `…/integrations/…/api/<seq>/`.
- [ ] **Auth & Idempotency Verified:** OpenAPI `securitySchemes` and dedup keys populated.
- [ ] **Gates Executed:** `docskit api:check` and `openapi:gen` / `openapi:render` exit 0.
- [ ] **Approval Updated:** `approval.status` set to `reviewed` (or `approved`) in YAML.
- **DO NOT output fake checklists, i18n tables, or framework prose.**

## Guardrails

- Do not require Portal testcase or FE model alignment
- No "ready for code" without gate evidence

## Done

- `approval.status`: `reviewed` (or `approved` if signed off)
- Handoff Codegenkit `--type=be` `/api` with `--spec …/01-backend-spec.yaml` after `approved`
