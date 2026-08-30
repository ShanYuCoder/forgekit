---
name: grill
description: /grill — Discovery router for architectural and product layers. Use with /overview, /surfaces, /business-process, /db-erd, /cross-service, /module, /journey, or /spec before authoring.
disable-model-invocation: true
extractBundle: architecture-core
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Physical interlocks: `AGENTS.md` + `SSOT_AGENT_PROTOCOL.md` (Đạo luật 1–7).
> - ĐẠO LUẬT 1: First action **BẮT BUỘC** `{{DOC_SKIT_READ_TOOL}}` this `SKILL.md`. **TUYỆT ĐỐI KHÔNG** dựa trí nhớ.
> - ĐẠO LUẬT 2: **BẮT BUỘC** `TODO.md` ở root từ **Workflow + Accelerators** — **TUYỆT ĐỐI KHÔNG** checklist tĩnh.
> - ĐẠO LUẬT 4+6: Hiển thị question/proposal trực tiếp trên Chat Thread; Hard Confirmation Gate — **TUYỆT ĐỐI KHÔNG** ghi đè product SSOT trước khi Member Confirm.
> - ĐẠO LUẬT 5: **TUYỆT ĐỐI KHÔNG** bịa business để đóng gap — giữ `#missing_info` hoặc hỏi.

# /grill

**Purpose:** discovery and validation router before writing or patching a target layer.

Use `/grill` when the initial brief is incomplete, when the next layer may be wrong without questioning, or when you want to prevent downstream detail from drifting away from the original requirement.

## Workflow

0. Create/update `TODO.md` ở root (steps below + optional Accelerators).
1. Identify the target layer from the trailing argument or from conversation context.
2. Ask a small, focused set of questions for that layer.
3. Summarize confirmed facts, deferred items (`qa/open/QA-…` + `#missing_info QA-…` when carrying into authoring), and explicit out-of-scope items — write the summary to `TODO.md` ở root (or update progress) so the next step has a durable input.
4. Hand off to the corresponding authoring skill only after the scope is clear.

## Resolving `#missing_info` (hard confirmation gate)

When filling gaps (including from a prior `/spec` pass):

1. **Re-check ArtifactGraph** if available — another member may have updated the registry.
2. **Micro-scope** — reason only about the missing block/field; do not rewrite settled sections.
3. **Propose** one or more options; mark Recommended. Trình bày trực tiếp trên **Chat Thread**.
4. **STOP** — ask the member. Write product SSOT and update **Artifact Registry** only after explicit confirmation.

For BA/UI or codegen grill on an existing bundle, prefer `/grill-bqa`, `/grill-dev`, or `/grill-docs` after this router clarifies the layer.

## Layer playbooks

- `/overview`: personas, business purpose, operational areas, business surfaces, common/shared boundaries.
- `/surfaces`: actor, channel, action, outcome, common vs surface-specific, API is not a surface.
- `/business-process`: actor, surface, trigger, decision, exception, outcome.
- `/db-erd`: entity, owner, lifecycle, shared vs owned data, cardinality, source of truth.
- `/cross-service`: caller/callee, sync/async, contract, retries, idempotency, events/messages, failure handling.
- `/module`: module boundary, surfaces/functions inside, common scope, dependencies.
- `/journey`: runtime flow across systems, handoffs, state transitions, recovery.
- `/spec`: business value, user journey, actors, fields, validations, state machine, UI permissions, API contract, edge cases, acceptance.

## Question order

Prefer this order unless the target layer needs something stricter:

1. Scope and goal
2. Actors and channels
3. Boundaries and ownership
4. Happy path
5. Exceptions and edge cases
6. Shared/common scope
7. Output format and handoff

## Accelerators (optional)

```text
if ArtifactGraph available: registry / parity hints for gaps
else: scoped reads of existing product docs (local fallback)

if Docskit available: ID → path for CMP/FLOW/W/API
else: repository search (local fallback)
```

Missing optionals never block `/grill`.

## Output

Return a short grill summary (also durable under `TODO.md`):
- confirmed scope
- missing info (`#missing_info` tags when carrying into authoring)
- risks / assumptions
- the next skill to run

Do not author the final layer content unless the user explicitly asks you to do so.
Do not invent business data to close gaps — leave `#missing_info` or ask.

## Verification Checklist

- [ ] Pre-flight read of this `SKILL.md` and harness TODO materialized.
- [ ] Target layer identified; questions stayed in playbook scope.
- [ ] Durable summary under `TODO.md` (confirmed / missing / risks / next skill).
- [ ] No product SSOT overwrite for unconfirmed proposals; `#missing_info` resolution used the hard gate, updated Artifact Registry after confirm.
- [ ] Handoff skill named explicitly.
