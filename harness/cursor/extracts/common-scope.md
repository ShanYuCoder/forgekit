# Common + FLOW placement (lowest shared folder)

Agents MUST pick **one** `common/` using the **lowest folder that every consumer already shares**. Do not invent extra `common/` trees. `/spec` only **consumes**; create/update common only via `/common`, `/common-spec`, or `/module … common` after the user named the scope.

Numeric function folders stay numeric (`01/02/03/`). The only non-numeric directory names under a `CMP-*` are `common/` and the `CMP-*` id itself.

## 1. Who uses it? → where `common/` lives

Walk consumers (functions / clusters / modules / surfaces). Place `common/` **next to their lowest common ancestor (LCA)**.

| Consumers | Write here |
|-----------|------------|
| One function only | **No `common/`.** Keep rules on that function’s `*.bundle.yaml`. |
| ≥2 functions in the **same cluster** (same numeric prefix, e.g. all under `CMP-…/02/`) | `product/surfaces/<surface>/<CMP-id>/02/common/` |
| ≥2 clusters **inside one module** | `product/surfaces/<surface>/<CMP-id>/common/` |
| ≥2 modules on **one surface** | `product/surfaces/<surface>/common/` |
| ≥2 surfaces | `product/surfaces/common/` |

**Cluster** = first numeric segment under the module (`02/`, `03/`, …) when the module uses hierarchical IDs. Deeper share (only `02/01/*`) → `…/02/01/common/`.

Inside every `common/`:

```text
common/
  patterns/          ← /common Markdown (BA/QA rules)
  yaml/<slug>/       ← /common-spec *.bundle.yaml
  processes/         ← module/cluster FLOW-*.md (not architecture catalog)
```

## 2. Ambiguous scope

If the prompt does not name consumers, **stop and ask** (propose the LCA from the table). Do not default to `product/surfaces/common` or to a random function folder.

If the same pattern already exists at a **narrower** `common/`, **reuse it** (reference `#pattern` / `#reuse-api`). Promote to a wider `common/` only when the user confirms **new consumers outside** that folder.

## 3. Consume order (`/spec`, `/grill-*`, `/api-spec`)

From the function folder, walk **up** and use the **nearest** hit. Do not skip a module `common/` to copy into surface `common/`.

1. `…/<CMP>/<cluster…>/common/yaml/` (nearest ancestor `common/`)
2. `…/<CMP>/common/yaml/`
3. `product/surfaces/<surface>/common/yaml/`
4. `product/surfaces/common/yaml/`

Same walk for `patterns/` Markdown.

## 4. Business process (`FLOW-*`)

| Scope of the flow | File |
|-------------------|------|
| Org / cross-surface / “hero” catalog | `architecture/03-business-process/FLOW-*.md` (MCP `docskit_business_processes`) |
| Many modules, one surface | `product/surfaces/<surface>/common/processes/FLOW-*.md` |
| Whole module, several clusters | `product/surfaces/<surface>/<CMP-id>/common/processes/FLOW-*.md` |
| One cluster / submodule only | `product/surfaces/<surface>/<CMP-id>/<NN>/common/processes/FLOW-*.md` |

Do **not** drop `FLOW-*.md` beside a single `W-*` bundle. Do **not** write module-internal flows only under `architecture/03-business-process/` (optional **link** from the catalog to the product path).

`/db-erd` and `/cross-service` use the **same** `common/` LCA (`common/db-erd.md`, `common/cross-service.md`), not a second invented folder name.

## 5. Forbidden

- Creating `common/` from `/spec`
- Textual slugs in the path (`auth/`, `cluster-name/`) except `common/` and `yaml/<bundle-slug>/`
- Duplicate copies of the same bundle at two LCA levels
- `Surfaces/Common` mixed case when the hub uses `product/surfaces/`
