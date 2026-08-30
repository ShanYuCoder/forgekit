# Artifact layout — leaf màn + API trio

> Một diagram · [Toolchain index](..)

```mermaid
flowchart TB
  subgraph leaf["product/surfaces/&lt;surface&gt;/CMP-*/&lt;NN…&gt;/"]
    BUNDLE["&lt;slug&gt;.bundle.yaml\nauthoring SSOT"]
    IRD["ir/design.yaml"]
    IRS["ir/spec.yaml"]
    IRG["ir/generated/&lt;slug&gt;.md"]
    API["api/&lt;seq&gt;/01 · 02 · 03"]
  end
  QA["qa/open/QA-*.yaml\nqa/index.md"]
  BUNDLE -->|spec:split| IRD
  BUNDLE -->|spec:split| IRS
  IRS -->|docs:render| IRG
  IRD -->|Bộ Code (Forgekit) FE / Bộ Test (Forgekit)| FE["FE repo"]
  API -->|Bộ Code (Forgekit) BE| BE["BE repo"]
  QA -->|docs:render| QAL["qa/index.md"]
  IRG -->|docs:publish| CAT["CATALOG.md"]
```

**Không** `modules/` trên path vật lý, **không** `code/W-*` / `code/API-*` sát leaf. Numeric cluster: `CMP-*/01/01/01/`.

## Quy tắc path

| Path | Vai trò |
|------|---------|
| `*.bundle.yaml` | Authoring SSOT (business + tech trên cùng file) |
| `ir/design.yaml` | Tech IR — **input FE Bộ Code (Forgekit) + Bộ Test (Forgekit)** |
| `ir/spec.yaml` | Business inventory — VitePress đọc qua `ir/generated` |
| `ir/generated/<slug>.md` | Markdown site / GitHub catalog |
| `api/<seq>/01-backend-spec.yaml` | **API SSOT** (một API / một primary entity) |
| `api/<seq>/02-openapi.yaml` | `Bộ Docs (Forgekit) openapi:gen` |
| `product/surfaces/…/common/yaml/` | LCA common (FE bundle + `ir/design.yaml`; API common = trio tại slug) |
| `architecture/03-business-process/FLOW-*.md` | Catalog FLOW; module-internal: `…/common/processes/FLOW-*.md` |
| `qa/open/` · `qa/index.md` | Inbox + list (render luôn ghi list, kể cả rỗng) |
| `CATALOG.md` | Mục lục GitHub — `pnpm forge:publish` |

Pattern CRUD: `templates` Bộ Docs (Forgekit) `admin-crud.pattern.yaml` (hub `.Bộ Docs (Forgekit)/templates/` sau init).
