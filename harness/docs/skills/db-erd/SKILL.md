---
name: db-erd
description: /db-erd — Models shared business data and database ERD (entities, ownership, relationships).
disable-model-invocation: true
extractBundle: architecture-core
---
# /db-erd
**Target Paths:** `<LCA>/common/db-erd.md` — same LCA as `.cursor/extracts/common-scope.md`.
**Guidelines:** Use Mermaid `erDiagram`. Start from business entities and data ownership, not from a raw repo schema dump. VitePress/publish menu label is **`db-erd`** (not the H1).

## Data meaning
- Model shared entities, relationships, cardinality, and ownership.
- Keep common/shared data in the common scope when it is reused by multiple surfaces or modules.
- Do not use the skill as a per-repo ORM/schema export unless the repo boundary is the actual data boundary.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /db-erd`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: ánh xạ schema cũ sang business data model / entity ownership tương ứng.
