# Agent execution protocol (Docskit)

> Canonical **physical interlocks** (full Vietnamese CRITICAL wording):
> `SSOT_AGENT_PROTOCOL.md` and host `AGENTS.md`.
>
> This extract is a short pointer for skills. **Do not** treat the bullets below
> as a static Verification Checklist for every skill.

## Path / task SSOT

```text
product/surfaces/<surface>/CMP-*/<slug>/     # no modules/ segment
TODO.md (root)     # from Workflow + Accelerators ONLY, and quote Verification Checklist

```

## Seven interlocks (must follow SSOT_AGENT_PROTOCOL.md)

1. **PRE-FLIGHT:** First action = `{{DOC_SKIT_READ_TOOL}}` / read target `SKILL.md`. Never memory.
2. **TODO TRACKING:** Explode **Workflow + Accelerators** into `TODO.md` ở root. **Forbidden** to only copy Verification Checklist. No batch-check.
3. **PLAN BEFORE WRITE:** Gộp plan vào `TODO.md` quoting every Verification Checklist line before any product YAML/code write.
4. **NO RAM CACHING:** Durable results → disk immediately. Prior file = next input.
5. **ZERO BUSINESS HALLUCINATION:** Data only from User prompt or ArtifactGraph. Gaps → AskQuestion; defer → `qa/open/QA-<page-id>-NNNN.yaml` + `#missing_info QA-…`. No invented business fields.
6. **GRILL HARD GATE:** AG re-check → micro-scope → propose → **STOP for Confirm** before product SSOT write.
7. **HUMAN DSL:** Common/DSL only via `/common`, `/common-spec`, `/docs-mark`, or grill Confirm. `/spec` consumes only.

## Order

```text
{{DOC_SKIT_READ_TOOL}} SKILL.md
  → write TODO.md (Workflow + Accelerators)
  → write plan vào TODO.md (quote Verification Checklist)
  → durable writes immediately (No RAM)
  → AskQuestion or qa/open + grill Confirm before SSOT fill
  → common/DSL only when human-gated
```
