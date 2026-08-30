---
name: qa-resolve
extractBundle: docskit
description: EXCLUSIVE /qa-resolve — close one qa/open file. Prompt is QA id + solution. Do not use for full-screen grill or first-time /spec.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Pre-flight: re-read this entire `SKILL.md` via a file-read tool (do not rely on memory).
> - Materialize `TODO.md` ở root from every Workflow step below before durable writes.
> - Prompt already has a **solution** → that is Confirm. **Do not** AskQuestion again. Missing solution → AskQuestion (Recommended + Other) then **STOP**.
> - You MUST follow ALL workflow steps; verify via harness TODO evidence.

# /qa-resolve — Close one open QA

**When:** Member has `QA-<page-id>-NNNN` (or `QA-<feature.id>-NNNN`) **and** a decision.

**Not this skill:** Unknown answer → `/grill-bqa` / `/grill-dev` / `/grill-docs` / `/api-spec`. FE delta without a QA file → `/update-spec`. Portal/BE sync without closing a QA → `/api-update`.

**Extract:** `.cursor/extracts/qa-inbox.md`

## Prompt

```text
/qa-resolve QA-cmp-adm-002-02-01-02-0001
Giữ copy legacy cho title.
```

- Line 1 (or first token after the skill): **id** `QA-…`
- Rest of the user message: **solution** (plain language). Apply it; do not invent extra business fields.

## Load policy

| Read (whole file) | Write | Do not |
|-------------------|-------|--------|
| `qa/open/<id>.yaml` | Same SSOT as `target.path` | Generated `*.md` as SSOT |
| Target bundle **or** `01-backend-spec.yaml` (entire file) | Delete the QA file after patch | Author `openQuestions` |
| `ir/design.yaml` only to locate the field if `at` is a design pointer | `docskit split` after bundle/`Q&A` list must refresh | Full-screen rewrite (`/spec`) |

## Resolve the file

1. `qa/open/<id>.yaml`. If missing, glob `qa/open/<id>.yaml` and `qa/open/QA-*-NNNN.yaml` whose `id:` matches. Zero hits → **STOP**, list `qa/open/` ids. Many hits → **STOP**, ask which file.
2. Read `target.path`, `target.at`, `kind`, `skill`, `question`.
3. If the user gave **no** solution: AskQuestion (options from `options[]` if present + Recommended + Other) → **STOP**.
4. If the user gave a solution: treat as Confirm. Do not re-open the wizard.

## Patch (one SSOT)

Use **`target.path`**, not guesswork:

| `target.path` | Patch |
|---------------|--------|
| `*.bundle.yaml` | That bundle only (`target.at`). Not `spec.api`. |
| `…/api/<seq>/01-backend-spec.yaml` or `common/yaml/<slug>/01-backend-spec.yaml` or integrations `01` | That **01**. `pendingTechDebt[]` drop the row whose `id` equals this QA id. Regen `02` via `docskit openapi:gen --spec <01>`. |
| Missing / wrong path | **STOP** — do not invent a leaf. |

Then:

- Write the solution into the field at `target.at` (replace `#missing_info` / empty / placeholder).
- Remove this id from `#missing_info QA-…`, `#tech-debt:QA-…`, and any tag list.
- **Delete** `qa/open/<id>.yaml`.
- Feature bundle on the same leaf (from `target.path` or `QA-<page-id>-*`): `docskit split` / `pnpm docs:split` so `ir/spec.yaml` `"Q&A"` drops the id. Then `docskit split --check` when IR already existed.
- Preserve error matrices (`onSuccess` / `onCommonError` / `onSpecificError`, `#err:*`) unless the solution is about those fields.

## Out of scope

- Other QA ids in the same folder (one prompt = one id).
- Codegen / prototype / Playwright.
- Inventing API endpoints or UI inventory.

## Handoff (after close)

- 01 still missing `codegen.profile` / `#gen:*` / `action` → tell member to run **`/grill-api-spec`**.
- Bundle `gen` still empty while grill-dev was pending on this fact → **`/grill-dev`**.
- Otherwise done.

## Verification Checklist

- [ ] Read `qa/open/<id>.yaml` and patched **only** `target.path`.
- [ ] Solution came from the user prompt (or one AskQuestion turn if prompt had no solution).
- [ ] QA file deleted; tags / `pendingTechDebt` / `#missing_info` for this id gone.
- [ ] Split (and `openapi:gen` if 01) ran; `"Q&A"` on `ir/spec.yaml` no longer lists this id.
- [ ] Did not write `openQuestions` or `bundle.spec.api`.
