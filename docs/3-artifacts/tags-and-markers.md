# Docs-mark — member annotation (tags / registries)

> Canonical skill: **`/docs-mark`** (ArtifactGraph) · Deprecated alias: `/platform-mark` (one cycle)  
> Registries: `registries/common.registry.json` (logic) · `registries/design.registry.json` (UI)

## Mục đích

Member đánh dấu spec hoặc code cho:

1. **UI common** — `#needs-component:`, `#needs-ui:`, promote Mo* → design registry
2. **Logic common** — `#common:*`, `#needs-common:*` → platform-common registry
3. **Technical** — `#call-external`, `#cross-entity-service`, `#derived-data`

**Không** nằm trong round-1 `/spec` — lane riêng `/docs-mark`, hoặc sau grill member chọn B.

## Lệnh

```bash
pnpm portal:registry              # design registry (Mo*, shells)
pnpm platform-common:registry     # logic common registry
pnpm platform-common:registry show
```

## Hai registry

| Layer | File | Tags |
|-------|------|------|
| UI | `registries/design.registry.json` | `#needs-component:`, `#needs-ui:`, `#shell:`, `#ui:` |
| Logic | `registries/common.registry.json` | `#common:*`, `#needs-common:*` |

Common UI bundles: `product/surfaces/common/` (list-page, status-chip, …).

## Mark kinds (tóm tắt)

| kind | Hashtag | Khi nào |
|------|---------|---------|
| needs-component | `#needs-component: cell-x:MoXxx:prop` | Column/slot custom — prototype implements |
| needs-ui | `#needs-ui: Widget` | Widget planned trong design registry |
| common | `#common:{id}` | Hook/service/helper lặp |
| needs-common | `#needs-common:{id}` | Logic chưa implement — HANDOFF |
| call-external | `#call-external` | HTTP ngoài integration / BFF |
| cross-entity-service | `#cross-entity-service` | 2 aggregate sync |
| call-external | `#call-external` | Outbound / third-party — SSOT [`product/surfaces/common/integrations/call-external.md`](#) |
| cross-entity-service | `#cross-entity-service` | Multi-aggregate sync — SSOT [`product/surfaces/common/integrations/cross-entity-service.md`](#) |
| derived-data | `#derived-data` | Field spec-only / BE-only — SSOT [`product/surfaces/common/data-model/derived-data.md`](#) |

## Spec — `marks[]` trên `ir/spec.yaml`

```yaml
tags:
  - "#shell: DataListPage"
  - "#needs-component: cell-status:MoStatusChip:label"

marks:
  - id: MK-EXPORT-001
    kind: common
    tag: "#common:export-csv"
    registryId: export.csv
    reason: "Toolbar export lặp ở 2 list"
    source: docs-mark
```

## Grill hỏi member

`/grill-dev` in bảng **Common candidates** — custom column, widget, composable lặp.  
Template: `.cursor/extracts/docs-mark-detect.md`

```text
[GRILL-MARK] Phát hiện: ...
Chọn: A) local  B) mark + registry  C) defer
```

Chọn B → agent chạy `/docs-mark` trong cùng session.

## Lane order

```text
/spec → bqa-grill-docs → dev-grill-docs (+ common candidates)
     → Bộ Code (Forgekit) gen:dry → /prototype (Mo*, composables)
     → /docs-mark (promote common)
     → grill-prototype
```

## Codegen handoff

Bộ Code (Forgekit) FE gen **không** emit Mo* — chỉ placeholder + HANDOFF cho `#needs-component` / `#needs-ui`.  
Sau `/prototype` implement file → re-run gen with `--force` when needed.

Extracts: `.cursor/extracts/docs-mark.md`, `docs-mark-detect.md`  
Skill: `.cursor/skills/docs-mark/SKILL.md` · deprecated stub: `.cursor/skills/platform-mark/SKILL.md`
