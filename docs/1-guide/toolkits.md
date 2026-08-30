# Forgekit & Các Bộ Công Cụ (Kits)

<div class="intro-grid">
<div class="intro-card intro-card--main">
<h3>Forgekit là gì</h3>
<ul>
<li><strong>Forgekit</strong> là giải pháp hợp nhất toàn bộ các toolkits MCP/CLI độc lập trước đây (Docskit, Codegenkit, Testkit, ArtifactGraph...) vào một bộ CLI và bộ kỹ năng duy nhất.</li>
<li>Một <strong>repo</strong> là nơi team thao tác và chia sẻ artifact: có thể là Document Hub (Docs), API/Frontend (Code), hoặc kịch bản kiểm thử (Test).</li>
<li>Lệnh <code>forgekit init</code> sẽ tự động chọn và cài đặt các <em>skill</em>, <em>rule</em>, <em>config</em> tương ứng với đúng vai trò (Project Type) của Repo đó.</li>
</ul>
</div>
<div class="intro-card intro-card--side">
<h3>Nguyên tắc</h3>
<ol>
<li>Cài đặt 1 lần duy nhất qua <code>forgekit</code>, hệ thống tự lo phần rẽ nhánh logic (Docs/FE/BE/Tests).</li>
<li>Các file config được tập trung tại <code>.forgekit/config.json</code> ở gốc dự án.</li>
<li>Dữ liệu cross-repo (như truy xuất docs từ FE/BE) đi qua các biến môi trường <strong>machine-local</strong> (như <code>DOCSKIT_ROOT</code>), không suy đoán tự động để đảm bảo an toàn.</li>
</ol>
</div>
</div>

<div class="base-note"><span class="base-note-mark">(*)</span><em>Tài liệu này gộp toàn bộ nội dung của kiến trúc phân tán trước đây thành kiến trúc Forgekit hợp nhất.</em></div>

---

## 1. Bảng phân loại "Bộ Công Cụ" (Kits) trong Forgekit

Thay vì cài từng toolkit riêng lẻ, `forgekit init` sẽ cung cấp cho bạn lựa chọn "Project Type". Dựa trên đó, các "Bộ" tương ứng sẽ được cài vào `~/.agents/` hoặc `~/.gemini/`:

| Bộ Công Cụ | Hỗ trợ (capability) | Skill cung cấp (`harness/`) | Lane (Project Type) |
|------------|---------------------|-----------------------------|---------------------|
| **Bộ Docs** | SSOT architecture + spec. Split IR, render, publish catalog, API 01. | `docs/`: `/2-lifecycle/overview.md`, `/1-guide/toolkits.md` | Document Hub |
| **Bộ Code** | Sinh code FE/BE từ IR. Quản lý UI Components, Data Models, API Routes. | `fe/`: `/prototype`, `/unit`, `/grill-unit` <br> `be/`: `/api`, `/grill-api` | Frontend, Backend, Fullstack |
| **Bộ Test** | Lên kế hoạch kiểm thử + sinh Playwright E2E Testcase. | `tests/`: `/testcase`, `/grill-testcase` | Test, Frontend, Fullstack |
| **Common** | Gợi ý tag / gap / parity thông qua hệ thống ArtifactGraph cục bộ. | `common/`: `/artifactgraph` | Tất cả (Common) |

<br>

<div class="intro-grid">
  <div class="intro-card">
    <img src="./assets/forgekit-docs.jpg" alt="Bộ Docs" style="border-radius: 8px; margin-bottom: 12px;" />
    <h4>Bộ Docs</h4>
    <p>Quản lý Document Hub, Architecture, Bundle IR và Specifications.</p>
  </div>
  <div class="intro-card">
    <img src="./assets/forgekit-code.jpg" alt="Bộ Code" style="border-radius: 8px; margin-bottom: 12px;" />
    <h4>Bộ Code</h4>
    <p>Sinh mã nguồn FE/BE tự động, quản lý UI Components và API Routes.</p>
  </div>
  <div class="intro-card">
    <img src="./assets/forgekit-test.jpg" alt="Bộ Test" style="border-radius: 8px; margin-bottom: 12px;" />
    <h4>Bộ Test</h4>
    <p>Lên kế hoạch kiểm thử, sinh kịch bản Playwright E2E tự động.</p>
  </div>
  <div class="intro-card">
    <img src="./assets/forgekit-common.jpg" alt="Common" style="border-radius: 8px; margin-bottom: 12px;" />
    <h4>Common (ArtifactGraph)</h4>
    <p>Graph database local, hỗ trợ gap analysis, code tagging và metadata.</p>
  </div>
</div>

### Lệnh xử lý tài liệu (Docs Lane)

Trên Repo đóng vai trò **Document Hub**, bộ kỹ năng của Forgekit cung cấp:

| Command | Trỏ tới | Phân hệ |
|---------|---------|---------|
| `/architecture` | Router duy nhất → overview, surfaces, business-process, module... | Bộ Docs |
| `/overview` | `product/overview/` — purpose, actors, operational areas | Bộ Docs |
| `/surfaces` | `product/surfaces/` — actor + action + channel | Bộ Docs |
| `/spec` / `/grill-docs` | `…/CMP-*/<NN…>/` (`*.bundle.yaml` + `ir/` + `api/`) | Bộ Docs |
| `/artifactgraph` | Phân tích local `.artifactgraph/` index | Common |

Lệnh triển khai code (`/prototype`, `/api`, `/test`) sẽ chạy ở các **code repo** (FE/BE) nhờ sự hỗ trợ của Bộ Code và Bộ Test.

---

## 2. Docs là "registry hub", các repo khác chỉ giữ pointer

Repo **Document Hub** là nơi duy nhất sở hữu registry sản phẩm đầy đủ, architecture ID và bundle IR. Repo khác (FE/BE/tests) **không** copy dữ liệu đó — chúng giữ **pointer machine-local** trỏ tới một checkout docs do developer tự config qua file `.forgekit/config.json` hoặc Environment Variable.

| Từ repo | Pointer (MCP env) | Ai dùng |
|---------|-------------------|---------|
| FE / BE | `CODEGENKIT_DOCS_ROOT` / `DOCSKIT_ROOT` | Bộ Code đọc IR (`ir/design.yaml`) |
| Tests | `TESTKIT_DOCS_ROOT` | Bộ Test phân tích `FLOW-*` |

1. Pointer là **đường dẫn tuyệt đối do dev chọn** trên máy đó (config lúc chạy `forgekit init`).
2. Registry / architecture **SSOT ở lại repo docs**. 
3. **ArtifactGraph mặc định chạy local**, sinh index SQLite trong thư mục `.artifactgraph/`.

---

## 3. Chọn Project Type theo nhu cầu

Khi chạy `forgekit init`, bạn sẽ được hỏi loại dự án. Tùy theo lựa chọn, các bộ kỹ năng sẽ được sync:

| Tôi muốn… | Chọn Project Type | Kỹ năng được tải |
|-----------|-------------------|------------------|
| Author/index architecture, sinh Bundle IR, Specs | **Document** | Bộ Docs + Common |
| Sinh code React/Vue/Angular/Nuxt/Next | **Frontend** | Bộ Code (FE) + Common |
| Sinh code FastAPI, Laravel, NestJS | **Backend** | Bộ Code (BE) + Common |
| Code cả FE và BE trong cùng 1 Monorepo | **Fullstack** | Bộ Code (FE+BE) + Common |
| Lên kịch bản Test, sinh Playwright Automation | **Test** | Bộ Test + Common |

---

## 4. Các lệnh của Forgekit CLI

Mọi thao tác đều thông qua lệnh `forgekit`.

| Lệnh | Việc |
|------|------|
| `forgekit init` | Wizard tương tác để khai báo loại dự án, adapter và tự động cài đặt MCP, chèn scripts vào `package.json`. |
| `forgekit dev` | (Dành cho Document/Test) Khởi chạy giao diện VitePress ở localhost. |
| `forgekit build` | Đóng gói trang tĩnh VitePress. |
| `forgekit split` / `split_all` | Phân tách Bundle YAML ra Markdown và JSON IR. |
| `forgekit publish` | Triển khai (Deploy) Document Hub. |
| `forgekit openapi_*` | Render và Build Swagger/OpenAPI UI. |

---

## 5. Ownership & quy tắc độc lập

1. Một `SKILL.md` (như `/architecture`) chỉ nằm trong đúng một thư mục gốc của `harness/` (ví dụ `harness/docs/skills/architecture/`).
2. Các script thực thi (engine) nằm tập trung ở `engines/` và được Forgekit gọi tự động dựa trên alias truyền vào (ví dụ `forgekit split_all`).
3. Dữ liệu local của mỗi dự án lưu tại `.forgekit/config.json`.

---

Đọc tiếp: [Start now](./getting-started.md) · [System doc structure](./system-doc-structure.md) · [Toolchain index](/2-lifecycle/overview.md).
