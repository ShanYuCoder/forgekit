---
name: common-spec
extractBundle: spec-core
description: EXCLUSIVE /common-spec — Use this to define common technical bundles (YAML) for a Surface for Codegen. DO NOT output Markdown files.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Pre-flight: re-read this entire `SKILL.md` via a file-read tool (do not rely on memory).
> - Materialize `TODO.md` at root from Workflow before durable writes.
> - This skill is an **allowed** human-invoked path to create/update common YAML SSOT. Do not run it as a side-effect of `/spec`.
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.

# /common-spec

**Target Path:** `<LCA>/common/yaml/<slug>/<slug>.bundle.yaml` — LCA from `.cursor/extracts/common-scope.md`.

## Purpose

The `/common-spec` skill is exclusively for creating **YAML Bundles** (`portal-feature-bundle/v1`) that define the technical implementation of common components (e.g., Confirm Dialogs, Shared Layouts, Middlewares, Step Flows) so they can be processed by CodeGen.

**DSL / common gate:** Only use when the user explicitly invoked `/common-spec` (or confirmed a grill proposal to promote common).

## Platform-Agnostic Generation (MANDATORY)

Docskit supports multiple surface types (Web, WinForms, Mobile, Gateway). You MUST adapt the generated bundle to the target surface. 
- Use the `design.shell.tag` to denote surface type (e.g., `#shell: DataListPage`, `#shell: KioskCheckIn`, `#shell: OtAdapter`).
- Populate `spec.clients` if applicable.

**Templates are optional seeds:** There are 16 bundle templates in `templates/product-skeleton/surfaces/common/yaml/` (mostly for Web Portal CRUD).
- If the user asks for a known Web pattern (e.g., `confirm-dialog`), you can ask if they want to inherit from the seed.
- If the user specifies a non-Web surface (e.g., `line-client-hmi`), you MUST generate a new bundle tailored to that requirement. Do not force them to inherit from Web templates.

## Workflow

1. **Read** `.cursor/extracts/common-scope.md`. List consumers → one LCA `common/yaml/<slug>/`. Example module-local: `product/surfaces/admin/CMP-ADM-002/common/yaml/confirm-dialog/confirm-dialog.bundle.yaml`. Example cluster: `…/CMP-ADM-002/02/common/yaml/…`. Surface/global only when consumers span modules/surfaces.
2. Generate the `.bundle.yaml` using the `portal-feature-bundle/v1` schema.
3. Instruct the user to run `docskit split -- <path>` (or `pnpm docs:split`) followed by `docskit render` (or `pnpm docs:render`). Split **must** emit `ir/design.yaml` (thin is OK). `docskit split --check` fails if that file is missing. Codegenkit `/gen-common` does not invent YAML.

## Rules

- Output MUST be a `.bundle.yaml` file. Do NOT generate Markdown (`.md`) files directly.
- Ensure strict YAML escaping for strings containing colons or brackets.

## Verification Checklist (Evidence Required)
- [ ] **Surface & Slug Resolved:** Path correctly resolved.
- [ ] **Platform Checked:** Adapted the bundle schema usage to the target platform type via `design.shell.tag` or `spec.clients`.
- [ ] **YAML Output:** Generated `.bundle.yaml` file.
