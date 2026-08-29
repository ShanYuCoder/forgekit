# QA inbox — deferred questions (docs hub)

There is **no** `openQuestions` on YAML. Gaps use **AskQuestion** in the skill session.

## Wizard (always)

AskQuestion: 2–5 options, mark **Recommended**, always include **Other**. **STOP**.

- Member picks A/B/C → write that fact into the real spec field (`design`, `01`, …).
- Member picks **Other** and types a **decision** → write that text into the spec field.
- Member picks **Other** and has **not decided** (empty / “chưa chốt” / “để sau”) → create a QA file (below). Do not invent the answer.

## When to create a file

1. Read `page-id` on the feature bundle / `ir/spec.yaml` (or `feature.id` on a backend `01`). Legacy bundles may still have `id`.
2. Glob `qa/open/QA-<id>-*.yaml`. Next seq = max `NNNN` + 1, pad 4 digits. First file → `0001`.
3. Write `qa/open/QA-<id>-NNNN.yaml` from `.docskit/templates/qa-item.yaml`.
4. Point the spec field at the **same** id: `#missing_info QA-<id>-NNNN` and/or `#tech-debt:QA-<id>-NNNN` and/or `pendingTechDebt[].id`.
5. `docskit split` — `ir/spec.yaml` gets `"Q&A": QA-…-0001, QA-…-0002`.

## Close (`/qa-resolve`)

Prompt: `/qa-resolve QA-<page-id>-NNNN` plus the **solution** on the following lines.

That is Confirm — do **not** AskQuestion again. Skill patches `target.path`, deletes this file, gỡ tag / `pendingTechDebt`, `docskit split` (and `openapi:gen` if 01).

Unknown answer → grill / `/api-spec`, not this extract.

## Do not block grill

`grillStatus` may be `done` while `qa/open/` still has files. Short `summary` prose is member review, not a QA file unless **keys** are missing.

## Not this folder

- ADR → `architecture/09-decisions`
- Lasting product risk → `architecture/11-risks`
- Session TODOs → `TODO.md`
