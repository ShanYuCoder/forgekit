---
name: api-update
description: EXCLUSIVE /api-update — ONLY for updating/syncing backend contract under product/surfaces/ when Portal spec changes or BE-only requirements update. DO NOT generate Markdown reports.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform shallow checks. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /api-update — Portal Sync & BE-Only Updates

No Laravel code. No `codegen` / `#gen:*` — grill adds those after sync.

Shared extracts: `.cursor/extracts/api-spec-sync.md`, `spec-evolution.md`, `entity-relationship.md`, `derived-data.md`, `agent-discipline.md`

## Target / ID Resolution Rule

- User prompt MAY provide a full path OR just a function/module/screen ID (e.g. `CMP-ADM-000-001`, `W-AD-AUTH-001`, `login`).
- If an ID is provided, Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve the exact target folder under `product/surfaces/...`. Do NOT force the user to prompt the full folder path.

## Modes

| Mode | Prompt | Sửa gì |
|------|--------|--------|
| **portal-sync** (default) | `/api-update <ID or path>` | Diff portal `ir/design.yaml` → patch `01` (+ mock); **regen** `02` via `openapi:gen` |
| **be-only** | `/api-update <ID or path> --be-only` | Chỉ `beOnlyRequirements`, `derivedData`, validation nội bộ — **không** đổi FE contract |

## Input & Folder Location

Same leaf as the FE bundle. Trio lives under `api/<seq>/` — never next to `*.bundle.yaml`.

```text
product/surfaces/<surface>/CMP-*/<NN…>/     # e.g. CMP-ADM-009/01/01/01
  <slug>.bundle.yaml
  ir/
  api/<seq>/
    01-backend-spec.yaml   # tech SSOT — patch here
    02-openapi.yaml        # regenerate: docskit openapi:gen (do not hand-edit as SSOT)
    03-mock-data.yaml
```

Common APIs: `…/common/yaml/<slug>/01-backend-spec.yaml` (one trio per API).

## Workflow (portal-sync)

1. Resolve ID to leaf `…/CMP-*/<NN…>/api/<seq>/01-backend-spec.yaml` (or common/yaml); read 01 + mock
2. Scan portal **`ir/design.yaml`** on the same leaf — **page actions/items** (`apiRefs`, `#reuse-api`, `reuseFrom`) for which APIs the screen calls. Do not treat projected `design.api` as BE SSOT. `#reuse-api` actions → do not invent a new 01.
3. Diff requirements, endpoints, acceptance vs backend `01-backend-spec.yaml`
4. Patch **`01-backend-spec.yaml`** (and `03-mock-data.yaml` if samples change)
5. `docskit api:check --spec …/01-backend-spec.yaml` then `docskit openapi:gen --spec …/01-backend-spec.yaml` (writes sibling 02)
6. Bump `feature.version` on 01
7. `changeLog` entry
8. **No** direct `.md` file writing — user runs `pnpm docs:render`

## Out of scope

- **NO PROSE / NO BQA REPORTS:** Do NOT output Markdown reports, BQA 3-Pillars reports, or framework-specific code snippets.

## Verification Checklist (Evidence Required)
- [ ] **ID Resolved:** Target is `…/api/<seq>/01-backend-spec.yaml` (or `common/yaml/<slug>/`), not a 01 on the FE leaf.
- [ ] **01 patched; 02 regenerated:** Did not treat `02-openapi.yaml` as hand-edited SSOT.
- [ ] **Gates:** `docskit api:check` and `docskit openapi:gen` ran.
- [ ] **No Direct Markdown:** Did NOT write `.md` files directly.
- **DO NOT output fake checklists, i18n tables, or gross combined files.**

## Done

- Portal delta in `01` or, if member Confirmed defer, `pendingTechDebt` with `id: QA-<feature.id>-NNNN` plus `qa/open/` file (not `openQuestions`)
- `source.portalRefs` current
- `changeLog` + version bumped
- Handoff: `/grill-api-spec {slug}` (re-run gates + codegen tags). Closing a listed QA → `/qa-resolve <id>` + solution, not this skill.

## Guardrails

- Do not split slug folder for child functions in same bounded context
- Do not rename API fields for FE convenience
- External integrations → AskQuestion then write into `01`; treo → `qa-inbox.md`, close later **`/qa-resolve`**; grill adds `#call-external`
- Export/import/custom → add endpoint stub + `pendingTechDebt.expectedWhenDone` if not merging this session
