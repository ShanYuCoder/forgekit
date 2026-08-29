---
name: prototype
description: /prototype — UI from docskit ir/design.yaml with mock API via Codegenkit.
disable-model-invocation: true
---

# /prototype — UI Prototype (Mock API Boundary)

**Owner:** Codegenkit (`--type=fe`) · Adapters: `nuxt4` | `nextjs` | `dotnet-line`

## Artifact & Target ID Resolution Rule

- User prompt MAY specify a screen ID, function ID, or slug (e.g. `W-AD-AUTH-001`, `login`).
- Agent MUST use `--id` or resolve `product/surfaces/<surface>/CMP-*/<NN…>/ir/design.yaml` via `CODEGENKIT_DOCS_ROOT` or `docskit_route` (same leaf as the bundle; API trio is sibling `api/<seq>/`, not this file).
- Prerequisite: `/gen-common` when `product/surfaces/<surface>/common` (or `CMP-*/common`) exists — generate shared molecules/shells **before** this skill.
- Do NOT demand full filesystem paths from the user if an ID is given.

```text
product/surfaces/<surface>/CMP-*/<NN…>/ir/design.yaml
# e.g. …/CMP-ADM-009/01/01/01/ir/design.yaml
```

Read the **entire** `ir/design.yaml` (script + agent inspection). Do not filter keys from `*.bundle.yaml`. **`ir/spec.yaml`** is business prose only.

**Docs hub is read-only for this skill.** Never Write/patch `*.bundle.yaml`, `ir/*`, or any file under `CODEGENKIT_DOCS_ROOT`. Missing `ir/design.yaml`, empty `codegen.profile`, or `codegenkit gen` failure → **STOP**, quote the CLI error, hand off to docs-hub `/grill-dev` (or `/spec`). Do not invent SSOT to make gen pass. Login/forgot/reset must be `codegen.profile: auth` (not `create`) or gen writes `(dashboard)`.

Do not invent sibling docskit paths. Pass `CODEGENKIT_DOCS_ROOT` or `--docs-root`.

## Docs Root Resolution

1. If `CODEGENKIT_DOCS_ROOT` is set (non-empty), use it as the canonical
   registry/IR pointer for locating `ir/design.yaml`.
2. If `CODEGENKIT_DOCS_ROOT` is **not** set, fall back to Platform DNA
   configuration (`platform-dna`) to resolve the docs hub path.
   Platform DNA discovery is slower and more error-prone, so always prefer
   an explicit `CODEGENKIT_DOCS_ROOT` when available.

## Route

Architecture/C4 → Docskit (`DOCSKIT_ROOT`); IR/registry/gen →
`CODEGENKIT_DOCS_ROOT`; symbols/call-graph for repo X → Platform DNA-wired
`codegraph-<repo-key>`. Never workspace-parent graphs, sibling-path inference,
or member-edited MCP. Local ArtifactGraph is allowlist/tag hints for this repo
only.

## Workflow

```bash
npm run codegen:dry -- --id W-AD-AUTH-001
npm run codegen -- --id W-AD-AUTH-001

# Fallback direct CLI if wrappers missing:
codegenkit gen:dry --adapter=nuxt4 --docs-root=/path/to/docs-hub -- --id W-AD-AUTH-001
codegenkit gen --adapter=nuxt4 --docs-root=/path/to/docs-hub -- --id W-AD-AUTH-001

codegenkit gen:dry --adapter=nextjs -- --spec ir/design.yaml
codegenkit gen --adapter=nextjs -- --spec ir/design.yaml
codegenkit gen:dry --adapter=dotnet-line -- --spec ir/design.yaml
codegenkit gen --adapter=dotnet-line -- --spec ir/design.yaml
codegenkit registry --adapter=dotnet-line
```

You MUST run `/gen-common` for this surface (then `--module=CMP-…` if the module has `common/yaml`) when those trees exist, then run the codegen script (`npm run codegen` or `codegenkit gen`) FIRST to generate the skeleton from **design IR**, before filling gaps **in the FE repo only**.

## Shadcn/ui skill (FE repo only)

When the FE checkout has `components.json`, the member should have installed [shadcn/ui skills](https://ui.shadcn.com/docs/skills) (`pnpm dlx skills add shadcn/ui`). That skill owns **primitives, theming, `shadcn add/search/info`**. This skill owns **IR → gen → slots**.

For each HANDOFF / `#needs-component: Mo…` after gen:

1. Run or read `shadcn info --json` (framework, aliases, installed set, base `radix|aria`).
2. `shadcn search` / docs: if the gap is a missing **primitive**, `shadcn add` it — do **not** hand-roll Button/Dialog/Table.
3. Implement `Mo*` as **composition** of those primitives (FieldGroup for forms, semantic tokens). Match `components.json` aliases.
4. Re-run `codegenkit gen` so slots bind to the new file.
5. Dotnet-line / no `components.json`: skip this section; do not invent React/shadcn APIs.

Do not copy the shadcn skill into Docskit. Do not author `#ui:` tags from memory if `shadcn search` can name the registry item.

`dotnet-line` requires the .NET 8 SDK (`CODEGENKIT_DOTNET`, then `dotnet`) and
is limited to the pilot-specific `kiosk-check-in` profile. Its main pass also
emits generated test source.

## Accelerators (optional)

```text
if local ArtifactGraph available: recommend/check the FE repo's allowlisted gen command
else: run codegenkit gen:dry / gen directly

Missing ArtifactGraph never blocks prototype generation. Complete the direct,
deterministic Codegenkit fallback first, then follow
`.cursor/rules/codegenkit-optional-integrations.mdc` for once-per-run telemetry.
```

Docs render / `spec:split` remain docskit / Docskit handoffs.

## Translation Rule
Luôn bọc text tĩnh bằng i18n helper native của framework. 
- Đọc block `i18n` từ `ir/design.yaml`.
- Tự động sinh/cập nhật file ngôn ngữ tương ứng (`.json` cho FE/NodeJS, hoặc `.resx` cho Dotnet). 
- KHÔNG viết gộp ngôn ngữ lên giao diện (ví dụ không dùng `login / đăng nhập`).
