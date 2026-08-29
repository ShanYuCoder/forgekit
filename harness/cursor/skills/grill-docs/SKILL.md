---
name: grill-docs
extractBundle: grill-docs
description: EXCLUSIVE /grill-docs — ONLY for reconciling BQA vs Dev conflicts. DO NOT trigger for standalone /grill-dev or /grill-bqa.
disable-model-invocation: true
---

# /grill-docs — Reconcile + codegen gate

**Re-check only:** Reconcile BQA↔dev conflicts and bind mismatches. Do **not** author page inventory from scratch.

## Mindset & Scope Alignment

- **`/grill-bqa`**: Business/BQA view (UI layout, copy, user action flows, acceptance criteria). **NO technical/API/database debates.**
- **`/grill-dev`**: Engineering/Dev view (Database tables, data types, API routes, `#reuse-api`, codegen tags).
- **`/grill-docs`**: Merges and reconciles BOTH BQA Business requirements AND Dev Technical specifications when contradictions exist.

## Load policy

**Read entire IR files** — do not cherry-pick keys from `*.bundle.yaml`.

| Read (whole file) | Write | Do not Read |
|-------------------|-------|-------------|
| **`ir/design.yaml`** | Patch **`*.bundle.yaml`** then `pnpm spec:split` | Generated `*.md` |
| **`ir/spec.yaml`** (prose vs tech conflicts) | | |

## Workflow

0. Deferred gaps: `.cursor/extracts/qa-inbox.md`. Close a known id with **`/qa-resolve`**, not this skill.
1. Resolve spec ↔ legacyEvidence ↔ design conflicts in **bundle**. Member pick now → AskQuestion then write the spec. Member **treo** → QA file + pointer — **no** `openQuestions`.
2. **Reconcile Common Patterns & Code Size:** Verify that the feature bundle inherits and complies with the common patterns specified by both BQA (business flows) and Dev (`#pattern`, `#split-hook:` codegen tags).
3. **Reconcile API & Tech Decisions (`#reuse-api`):** Verify Dev tags on **page actions/items** (`#reuse-api` + `reuseFrom`) against BQA flows. Duplicate contracts must not get a new `api/<seq>/`.
4. **Codegen gate:** `bundle.gen.codegen.profile` (and entity/module when required) must be set. Login/forgot/reset = `auth`, not `create`. If missing or wrong, **do not** set `grillStatus.full: done` — report and hand back to `/grill-dev`.
5. Write/fix `bundle.gen` → `docskit_bundle_split` (fallback: `docskit split`).
6. If ArtifactGraph is available, use `artifactgraph_allowlist_check` +
   `artifactgraph_recommend_command` for `genDry`; never execute FE gen here.
7. `docs_render` (fallback: `docskit render`).
8. Handoff ID/path + recommendation to FE Codegenkit. Missing Codegenkit is a
   pending handoff, not a reason to invent a local shell fallback.

## Accelerators (optional)

```text
if ArtifactGraph available: reconcile/parity/tag hints + command recommendation
else: model reconcile from scoped bundle slices (model fallback)

if Docskit available: resolve referenced CMP/FLOW IDs
else: repository path conventions (deterministic fallback)
```

Missing optionals never block `/grill-docs`. After the existing fallback
completes, emit exactly one `docskit.missing-optional` event per `runId` +
optional against
`.cursor/schemas/docskit/missing-optional-event.schema.json`. Deduplicate
retries and report only actual `fileReads` / `contextBytes`.

## Verification Checklist (Evidence Required)
- [ ] **Conflicts reconciled** in `*.bundle.yaml` (quote paths), or deferred with `qa/open/QA-…`. No `openQuestions` on the bundle.
- [ ] **codegen.profile** present on `bundle.gen` (same gate as `/grill-dev`).
- [ ] **Split** succeeded.

## Do not

- Re-read legacy source or archaeology
- Implement UI/API

## Handoff

→ `/prototype` after FE Codegenkit dry-run passes
