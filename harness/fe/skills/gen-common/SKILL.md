---
name: gen-common
description: >-
  /gen-common — generate shared UI from Docskit common specs before
  /prototype. Covers surface common (product/surfaces/<surface>/common) and
  module common (product/surfaces/<surface>/CMP-*/common). Use when
  bootstrapping DataListPage, MoStatusChip, or CMP-level shared widgets.
disable-model-invocation: true
---

# /gen-common — Shared UI before /prototype

**Owner:** Codegenkit (`--type=fe`) · Adapters: `nuxt4` | `nextjs`  
Not synced for `dotnet-line`.

Skill is **`/gen-common`**, not `/common` — `common` is the docs folder name (and there are three of them).

| Scope | Docs path | Flag |
|-------|-----------|------|
| Platform | `product/surfaces/common` | `--surface=common` |
| Surface | `product/surfaces/<surface>/common` | `--surface=admin-web` |
| Module | `product/surfaces/<surface>/<CMP-*>/common` | `--module=CMP-ADM-009` |

Run **surface** first, then **module**, then `/prototype` for screens.

## IR

```text
…/common/yaml/<slug>/ir/design.yaml   # tech — Read entire file
…/common/yaml/<slug>/ir/spec.yaml     # prose only — do not gen from this
```

Read the **entire** `ir/design.yaml`. Missing design → STOP, hand off to docs `/common-spec` + `docskit split` (do not invent yaml). Prose-only `common/processes` (FLOW) is not `/gen-common` input. Thin design is OK for tokens; do not page-gen common IRs.

**Docs hub is read-only.** Never Write common bundles/`ir/*` on the docs hub.

Do **not** run `codegenkit gen --id common-list-page`. Page gen skips all three common trees.

## Docs Root Resolution

1. If `CODEGENKIT_DOCS_ROOT` is set (non-empty), use it as the canonical
   pointer for locating common IR (`ir/design.yaml`).
2. If `CODEGENKIT_DOCS_ROOT` is **not** set, fall back to Platform DNA
   configuration (`platform-dna`) to resolve the docs hub path.
   Platform DNA discovery is slower and more error-prone, so always prefer
   an explicit `CODEGENKIT_DOCS_ROOT` when available.

## Workflow

```bash
npm run codegen:common:dry -- --surface=admin-web --json
npm run codegen:common -- --surface=admin-web
npm run codegen:common:dry -- --module=CMP-ADM-009 --json
npm run codegen:common -- --module=CMP-ADM-009

# Fallback:
codegenkit gen-common:dry --adapter=nextjs --docs-root=/path/to/docs -- --surface=admin-web --json
codegenkit gen-common --adapter=nextjs --docs-root=/path/to/docs -- --module=CMP-ADM-009
codegenkit gen-common:dry -- --id common-status-chip --surface=admin-web
```

`common-gen` is an alias of `gen-common`.

1. Choose scope (`--surface` xor `--module`, or `--surface=… --all-modules`). Do not guess when several surfaces exist.
2. Dry `--json`. Kinds: `tokens` / `policy` / `molecule` / `shell` / `flow`.
3. Write stubs + upsert `registries/common.registry.json`. Keep existing files unless `--force`.
4. Implement `action: implement` from **`ir/design.yaml`** (tokens/policy as constraints). shadcn compose when `components.json` exists.
5. Surface emit → molecules/organisms. Module emit → `src/components/modules/<cmp-…>/` (namespaced, no overwrite of surface shells).
6. Re-run dry until emit entries are `implemented`.
7. `/prototype` for `CMP-*` screens.

## Kind handling

| Kind | Emit? | Agent |
|------|-------|--------|
| `tokens` / `policy` | no | Apply while implementing others |
| `molecule` | yes | Compose primitive → molecule |
| `shell` | yes | After `dependsOn` molecules |
| `flow` | sometimes | delete-flow wires ConfirmDialog; import-csv emits `MoImportCsv` |
| `skip` | no | Backend folders (`common-api`, `backend-core-services`) |

## Do not

- Page-gen common IRs or invent routes from them.
- Copy platform `surfaces/common` over a surface overlay that already exists.
- Emit module widgets onto surface paths (`DataListPage`, `MoStatusChip`).
- Rewrite unrelated feature screens here.

## Translation Rule
Luôn bọc text tĩnh bằng i18n helper native của framework. 
- Đọc block `i18n` từ `ir/design.yaml`.
- Tự động sinh/cập nhật file ngôn ngữ tương ứng (`.json` cho FE/NodeJS, hoặc `.resx` cho Dotnet). 
- KHÔNG viết gộp ngôn ngữ lên giao diện (ví dụ không dùng `login / đăng nhập`).
