# 🛠 Danh sách Lệnh CLI & Agent Skills (Usage)

Tài liệu này liệt kê toàn bộ các lệnh thực thi (Commands) và bộ Kỹ năng (Skills) của Forgekit.

## ⚙️ Các Lệnh Xử Lý Cốt Lõi (Forgekit CLI)

Forgekit chia hệ thống ra làm 3 bộ máy chính: **Bộ Docs**, **Bộ Code**, và **Bộ Test**. Dưới đây là các lệnh thao tác cho từng bộ:

### Bộ Docs (Quản lý Tài liệu & Specs)
Các lệnh thao tác với tài liệu, chia tách Spec và kết xuất giao diện Markdown/OpenAPI.

| Lệnh Forgekit | Tương đương CLI cũ | Chức năng |
|---------------|--------------------|-----------|
| `forgekit split` | `docskit split` | Cắt nhỏ `.bundle.yaml` ra Markdown & IR files. |
| `forgekit split_all` | `docskit split-all` | Quét và cắt nhỏ toàn bộ Bundle YAML trong repo. |
| `forgekit render` | `docskit render` | Render lại UI Design Specs từ YAML sang MD. |
| `forgekit dev` | `docskit serve` | Chạy Live Server của VitePress (`npx vitepress dev`). |
| `forgekit build` | `docskit build` | Đóng gói Document Hub tĩnh (`npx vitepress build`). |
| `forgekit publish` | `docskit publish` | Publish tài liệu lên server hoặc CDN tĩnh. |
| `forgekit openapi_render` | *scripts/render-openapi* | Gộp các OpenAPI YAML nhỏ thành `docs/openapi/api.yaml`. |
| `forgekit openapi_build_ui` | *scripts/build-openapi-ui* | Build giao diện Swagger UI tĩnh cho Docs Hub. |

*(Ví dụ chạy: `forgekit split_all`)*

### Bộ Test (Kiểm thử & Testcase)
Forgekit chịu trách nhiệm phân tích kịch bản kiểm thử định dạng YAML để kết xuất ra Markdown hoặc soi chiếu Coverage.

| Lệnh Forgekit | Tương đương CLI cũ | Chức năng |
|---------------|--------------------|-----------|
| `forgekit cases:render` | `testkit cases:render` | Dịch toàn bộ Testplan YAML sang Markdown để đọc trên Docs Hub. |
| `forgekit cases:check` | `testkit cases:check` | Kiểm tra cú pháp YAML của Testplan. |
| `forgekit cases:coverage` | `testkit cases:coverage` | Quét Coverage để phát hiện các specs chưa có Testplan. |
| `forgekit testcase:gen` | `testkit testcase:gen` | Tự động sinh mã nguồn Playwright E2E từ YAML. |
| `forgekit e2e-registry` | `testkit e2e-registry` | Kiểm tra/Xác thực registry của Playwright Test. |

### Bộ Code (Sinh Mã Nguồn & Unit Test)
Forgekit kế thừa trọn vẹn sức mạnh sinh mã nguồn và Unit Test đa ngôn ngữ (NodeJS, Python, PHP, C#, v.v.).

| Lệnh Forgekit | Chức năng |
|---------------|-----------|
| `forgekit gen` | Sinh mã nguồn UI Component (Frontend). |
| `forgekit unit-gen` | Sinh mã nguồn Unit Test cho Frontend (Jest/Vitest). |
| `forgekit api-gen` | Sinh mã nguồn API Route/Controller (Backend). |
| `forgekit api-unit-gen` | Sinh mã nguồn Unit Test cho API (Backend). |
| `forgekit contract-gen` | Sinh mã nguồn Type/DTO dùng chung cho Fullstack. |
| `forgekit gen-css` | Cập nhật CSS Variables từ Design Tokens. |

*(Tất cả lệnh trên đều có thể truyền thêm `:dry` để xem trước thay vì ghi file, ví dụ: `forgekit api-unit-gen:dry`)*

---

## 🛠 Danh sách Kỹ năng (Skills) của Agent

Các kỹ năng (`.mdc` và `SKILL.md`) đã được tổ chức lại chuẩn xác vào 4 thư mục chính dựa trên loại Project:

### 1. Frontend Skills (`harness/fe/`)
Dùng để sinh mã nguồn, component và Unit Test cho UI.
- **Sinh UI/Logic:** `model`, `wire`, `prototype`, `gen-common`, `build-template-code`.
- **Kiểm thử:** `test`, `unit`.
- **Review (Grill):** `grill-prototype`, `grill-test`, `grill-unit`, `business-impact-review`.

### 2. Backend Skills (`harness/be/`)
Dùng để sinh mã nguồn API và Unit Test Backend.
- **Sinh Code:** `api`, `api-unit`.
- **Review (Grill):** `grill-api`, `grill-api-unit`, `business-impact-review`.

### 3. Docs Skills (`harness/docs/`)
Khối óc trung tâm (Docskit SSOT). Nơi diễn ra 90% việc phân tích hệ thống, thiết kế kiến trúc và luồng dữ liệu trước khi code.
- **Kiến trúc & Sơ đồ:** `architecture`, `architecture-grill`, `docskit`, `business-process`, `business-process-trace`, `cross-cutting`, `deployment`, `surfaces`, `db-erd`, `flow-trace`.
- **Thiết kế API & Specs:** `api`, `api-integration`, `api-spec`, `api-update`, `cross-entity-service`, `cross-service`, `openapi`, `module`, `spec`, `update-spec`, `common-spec`.
- **Quản lý & Review:** `decision`, `overview`, `qa-resolve`, `platform-ai`, `build-templates`, `call-external`.
- **Soi chiếu (Grill):** `grill`, `grill-api`, `grill-api-spec`, `grill-bqa`, `grill-common-spec`, `grill-dev`, `grill-docs`, `grill-integration-spec`.

### 4. Test Skills (`harness/tests/`)
Chuyên thiết kế testplan và kịch bản E2E Playwright.
- **Kỹ năng cốt lõi:** `scenario`, `testcase`, `platform-base`.
- **Review (Grill):** `grill-testcase`.

### 5. Common/Shared Skills (`harness/common/` & `harness/shared/`)
Kỹ năng dùng chung bắt buộc cho mọi Agent.
- **Cốt lõi:** `artifactgraph`, `platform-mark`, `docs-mark`, `configure-repo-maps`, `legacy`.
- Các file chuẩn giao tiếp: `SSOT_AGENT_PROTOCOL.md`, `AGENTS.md`.

---

## Hướng dẫn sử dụng MCP Tools

Forgekit phơi bày các bộ công cụ thông qua chuẩn **Model Context Protocol (MCP)**. Các Agent (như Cursor, Antigravity) tự động đọc cấu hình này từ `.agents/mcp_config.json`.
- **docs_***: Các lệnh phân tích `IR`, vẽ `Bundle`.
- **codegen_***: Lệnh gen `Frontend/Backend` (`codegen_run`).
- **graph_***: Truy vấn SQLite để lấy danh sách Entities, Tables, API.
- **test_***: Phân tích `testcases.yaml` để báo cáo độ phủ.


---

# Feature artifact — lệnh script

> **Bộ Docs (Forgekit)** sau `forgekit init`: CLI `Bộ Docs (Forgekit) split|merge|render|publish|openapi:gen|api:check`. `pnpm spec:*` / `docs:*` trên hub là alias. [Toolkits (MCP)](../1-guide/toolkits.md).

> **Layout gen/registry (FE/BE repo):** [CODEGEN-LAYOUT](https://github.com/raintr91/Bộ Code (Forgekit)/blob/main/docs/CODEGEN-LAYOUT.md)

---

## Authoring & IR

| Lệnh | Input | Output |
|------|--------|--------|
| `pnpm spec:split -- <bundle.yaml>` · `Bộ Docs (Forgekit) split` | Bundle | `ir/design.yaml`, `ir/spec.yaml`, `ir/generated/<slug>.md` |
| `pnpm spec:merge -- <bundle.yaml>` | `ir/*` | Bundle |
| `pnpm spec:split:check` · `Bộ Docs (Forgekit) split --check` | Bundle + ir | Fail nếu lệch / common thiếu design |
| `pnpm spec:split:all` · `Bộ Docs (Forgekit) split-all` | Mọi `*.bundle.yaml` dưới surfaces | Split từng file |
| `pnpm forge:render` · `Bộ Docs (Forgekit) render` | `ir/spec.yaml` (skip màn chưa split) | `ir/generated/*.md` + **`qa/index.md`** |
| `pnpm forge:publish` · `Bộ Docs (Forgekit) publish` · MCP `Bộ Docs (Forgekit)_docs_publish` | MD đã có + OpenAPI | **`CATALOG.md`** + link **đầu** README |
| `pnpm docs:dev` | VitePress | Sidebar: surfaces (kèm `ir/generated`) + **QA** cuối |

GitHub: README → `CATALOG.md` (platform / product / QA) → click mở trang MD. Không lục YAML.

---

## Common (shared)

| Lệnh | Mục đích |
|------|----------|
| `pnpm spec:split:common` / `docs:render-common` | `product/surfaces/…/common/yaml` — split **phải** có `ir/design.yaml` |
| Bộ Code (Forgekit) `/gen-common` rồi `/prototype` | FE molecules trước screen |

## API (cùng leaf với FE)

| Lệnh | Mục đích |
|------|----------|
| `/api-spec` | Inventory từ **`ir/design.yaml` actions** (`apiRefs` / `#reuse-api` + `reuseFrom`). Unique → `api/<seq>/` trio. Toàn reuse → **zero** `api/` |
| `Bộ Docs (Forgekit) openapi:gen --spec …/01-backend-spec.yaml` | Ghi sibling `02-openapi.yaml` |
| `Bộ Docs (Forgekit) api:check --spec …/01` | Gate 01 (không để 01 sát leaf) |
| `/qa-resolve QA-…` | Đóng một file `qa/open`, patch bundle/01, split |

## Phase aggregates

| Lệnh | Chạy | Dùng sau |
|------|------|----------|
| `pnpm phase:spec -- <bundle.yaml>` | split → check → `docs:render` | Sửa 1 màn |
| `pnpm phase:spec` | `split-all` → `docs:render` | Cả hub |
| `pnpm forge:publish` | catalog GitHub | Sau render (không gộp vào render) |

## Codegen — FE (`Bộ Code (Forgekit) gen`)

**Input:** `ir/design.yaml` (`--id` hoặc `--spec`). **Không** `ir/spec.yaml`.

| Lệnh | Mục đích |
|------|----------|
| `Bộ Code (Forgekit) gen:dry -- --id W-*` / `--spec …/ir/design.yaml` | Gate sau `/grill-dev` |
| `Bộ Code (Forgekit) gen` | Scaffold FE repo |
| `Bộ Code (Forgekit) contract-gen` | FE models từ **design** (lane FE) |

## Codegen — BE (`Bộ Code (Forgekit) api-gen`)

**Input:** `…/api/<seq>/01-backend-spec.yaml` only. `--id CMP-*` glob mọi 01 dưới module.

## Unit / E2E

| Lệnh | Input |
|------|--------|
| `Bộ Code (Forgekit)` unit-gen FE | `ir/design.yaml` |
| `Bộ Code (Forgekit) api-unit-gen` | `01-backend-spec.yaml` |
| Bộ Test (Forgekit) `testcase:gen --id …` | Plans `base-tests` + docs `ir/design.yaml` / `FLOW-*` |

## Docs-mark

| Skill | Mục đích |
|-------|----------|
| `/docs-mark` | Tags trên **bundle** rồi split (không ghi `ir/spec` tay) |
| `/grill-dev` | Common candidates; `#reuse-api` trên **action/item** |

---

## Ví dụ

```bash
pnpm spec:split -- product/surfaces/admin/CMP-01/01/01/01/<slug>.bundle.yaml
pnpm forge:render
pnpm forge:publish
pnpm docs:dev

# FE
Bộ Code (Forgekit) gen:dry --docs-root ~/workspace/base-docs -- --spec …/ir/design.yaml

# BE
Bộ Code (Forgekit) api-gen:dry -- --spec …/api/01/01-backend-spec.yaml
```

Thứ tự team: [DESIGN-PHASE-DIAGRAM](../2-lifecycle/overview.md)
