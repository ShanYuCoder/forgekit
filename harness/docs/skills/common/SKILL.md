---
name: common
description: EXCLUSIVE /common — Use this to define common business rules, UX/UI rules, and patterns for a Surface as Markdown documentation. DO NOT use this to generate YAML technical bundles (use /common-spec for that).
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Pre-flight: re-read this entire `SKILL.md` via a file-read tool (do not rely on memory).
> - Materialize `TODO.md` at root from Workflow before durable writes.
> - This skill is an **allowed** human-invoked path to create/update common Markdown rules. Do not run it as a side-effect of `/spec`.
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.

# /common

**Target Path:** `<LCA>/common/patterns/` — resolve LCA from `.cursor/extracts/common-scope.md` (module/cluster `common/` before surface, never invent a second tree).

## Purpose

Markdown rules for a **named scope** (cluster / module / surface / global). Not “always surface-wide”. First **Read** `.cursor/extracts/common-scope.md` and pick the LCA `common/patterns/` folder. One function only → do not create `common/`; put the rule on the function bundle.

**DSL / common gate:** Only use when the user explicitly invoked `/common` (or confirmed a grill proposal).

**DO NOT** generate YAML bundles here. If the user wants to generate codegen bundles for common features, instruct them to use `/common-spec`.

## Target / ID Resolution Rule

- Prompt MUST name **consumers** (CMP id, cluster `NN`, surface, or “all surfaces”). Ambiguous → ask; propose one LCA from `common-scope.md`.
- Scaffold `common/patterns/` at that LCA only. Do not create `product/surfaces/common` unless ≥2 surfaces share the rule.
- Surface-wide with no `common/` yet: `/surfaces <name> common` then write `patterns/` there.

## Rules for Markdown Content

1. Use clear, non-technical language where possible, geared towards Business / QA / Dev alignment.
2. If applicable, define rules based on the surface type (e.g., Kiosk UI rules differ from Web Portal UI rules).
3. Do NOT output fake i18n tables or framework prose. Focus on the actual rules (e.g., "Confirm dialog must always block background").

## Verification Checklist (Evidence Required)
- [ ] **Surface Resolved:** Resolved the target surface to `product/surfaces/[Surface]/`.
- [ ] **Common Directory Exists:** Verified that `common/` exists.
- [ ] **Markdown Output:** Wrote `.md` under the LCA `common/patterns/` from `common-scope.md` (not beside a single function).
