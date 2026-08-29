---
name: grill-common-spec
description: EXCLUSIVE /grill-common-spec — Use this to audit and verify technical common bundles before code generation.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.

# /grill-common-spec

**Target Path:** any `<LCA>/common/yaml/<slug>/<slug>.bundle.yaml` (see `.cursor/extracts/common-scope.md`). Do not “fix” a module common by copying it to surface `common/`.

## Purpose

The `/grill-common-spec` skill audits a common feature bundle (YAML) for technical validity before passing it to `docskit split` and the code generator.

## Audit Rules

1. **Schema Validation:** Verify that `schema` is set (e.g. `portal-feature-bundle/v1` or appropriate surface schema).
2. **Platform Readiness:** Ensure `design.shell.tag` correctly reflects the target platform (e.g., `#shell: DataListPage` for Web, `#shell: KioskCheckIn` for WinForms, `#shell: OtAdapter` for Gateway).
3. **Completeness:** Ensure `spec.principles` and `spec.acceptance` are sufficiently detailed to generate test cases and drive codegen behavior.
4. **References:** Verify that any `design.patterns` or referenced middlewares point to valid, existing items.

## Output

Do NOT output new files. 
- If issues are found, inform the user and suggest fixes, or fix them directly in the `.bundle.yaml` file if instructed.
- If the bundle is perfect, instruct the user to proceed with `docskit split -- <path>` (must emit `ir/design.yaml`) then Codegenkit FE `/gen-common`. Do not send BE `/api` a common FE bundle.

## Verification Checklist (Evidence Required)
- [ ] **Bundle Audited:** The specified `.bundle.yaml` file was read and checked against the rules.
- [ ] **Platform Checked:** The bundle's platform tags correctly align with its intended surface.
