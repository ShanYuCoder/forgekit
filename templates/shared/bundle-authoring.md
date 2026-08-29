# portal-feature-bundle/v1 — authoring rules (PHASE 1)

Hub: `docs/templates/feature.bundle.yaml` · split: `pnpm spec:split`

## Top-level

| Key | Purpose |
|-----|---------|
| `page-id` | Screen identity (`cmp-adm-000-01`). Split copies this onto `ir/spec.yaml` as `page-id` (not `id`, so it does not collide with requirement/section ids). Legacy bundles may still use `id`. |
| `summary` | Phải trình bày dạng bullet. Bắt buộc có các tiêu đề (chuẩn Arc42 business): **mục tiêu nghiệp vụ** (business_goals), **các bên liên quan** (stakeholders), **kịch bản người dùng** (user_journey), **bối cảnh** (description, input liên kết cross-page/module, output) và **cách giải quyết** (tùy chọn). Mục đích để 100% Non-tech Stakeholder hiểu và duyệt. |
| `spec` | Design v1 — actors, requirements, `ui.routes`, **`ui.list` / `ui.form` / `ui.detail`**, `acceptance`. **Không** author `spec.api` — API SSOT là `api/<seq>/01-backend-spec.yaml`. |
| `gen` | **Bắt buộc trước codegenkit:** `codegen.profile` (`auth` login/forgot/reset; `change-password`; `public`; `not-found`/`error`; `list`/`create`/`admin-crud`) + entity/module, `tags`, derived `ui.*`. `/grill-dev` ghi. Endpoint `action` ghi trên **01**, không trên bundle. |
| `legacy` | Legacy facts + evidence pointers |
| `design` | Nested **`sections[]`** (card/container/form + `visual` + `interaction` + `validation` + `tags`/`extract` + `apiRefs`/`hidden`) · **`nav`** · `zones[]` fallback · `behavior` · `actions[]` |
| `review` | BA prose only — **không** split sang `ir/*` |

## /spec authoring (complete when information exists)

- Fill `design.sections[]` as a **dynamic nested tree** for that page (any depth). Same node shape everywhere: `kind` + `visual` + `tags`/`extract` + `items[]` + nested `sections[]`. Do not assume login or any one layout.
- When the page has app chrome: `design.nav.sidebar.levels` (đa cấp) + `design.nav.breadcrumb`. Full-bleed pages: `sidebar.enabled: false`.
- Flat `design.zones[]` is only a fallback if there is no nested card tree.
- Fill the matching profile: list → `spec.ui.list`; form → `spec.ui.form` (do not merge form into the page shell); detail → `spec.ui.detail`.
- Do **not** dump the screen into `requirements` prose instead of inventory.
- **UI Metrics Policy:** DO NOT declare basic CSS properties (e.g., `font-size`, `padding`, exact colors) in feature specs. These are governed by the global Design System (e.g., Shadcn/Tailwind). Only declare them if the feature requires a specific, exceptional override.
- Missing hard facts → `#missing_info` on that field. Do not wait for grill to invent inventory.
- `/grill-bqa`, `/grill-dev`, `/grill-docs` only re-check, fill gaps, or fix conflicts.

## spec (design v1) — có

- `actors`, `entities`, `relationships`
- `requirements` (BẮT BUỘC chứa Edge Cases. CHÚ Ý: Field Validations, State Machine, UI Permissions phải được map vào từng item trong `design.sections`, KHÔNG liệt kê chung chung ở đây)
- `ui.routes`, `ui.list`, `ui.form`, `ui.detail`, `ui.toolbar` (intent)
- `acceptance`

API: **chỉ** `…/api/<seq>/01-backend-spec.yaml` (`/api-spec`). Split **chiếu** `api.endpoints` (id/method/path/action) sang `ir/design.yaml` cho FE/testkit — không author trên bundle.

## spec — không (thuộc `gen`)

- `codegen`, `tags`
- root `ui.filters`, `ui.columns`, `ui.composition`, `ui.testIds` (derive after inventory exists)
- Prose layout blob — dùng `design.sections[]` (nested) + `design.nav` + `review.layoutNotes`

## Split output

Split exists so agents **Read the entire `ir/design.yaml`** (tech) or **entire `ir/spec.yaml`** (prose). Do **not** instruct “only Read `design.sections` / `spec.ui` from the bundle” — that misses fields and is why IR is split.

Authoring (`/spec`, grill-*) still **writes** `*.bundle.yaml`, then split.

| Artifact | Đọc bởi | Nội dung |
|----------|---------|----------|
| `*.bundle.yaml` | Ghi SSOT (`/spec`, grill-*) | Đầy đủ spec+gen+design |
| `ir/design.yaml` | **Đọc cả file** — grill-*, FE `/prototype`, `/testcase` | Tech: id, kind, tags, bind, visual CSS, `api` chiếu từ 01. Giữ label/purpose. |
| `ir/spec.yaml` | VitePress + stakeholder | Business page + requirements/acceptance. Không id/tag/bind. `"Q&A"`. Không stub `legacy` rỗng. |
| `…/api/<seq>/01-backend-spec.yaml` | BE `/api`, `openapi:gen`, **author API** | Tech BE — SSOT duy nhất cho endpoint |
| `<slug>.md` | Người (BA/QA) | Render từ **`ir/spec.yaml`** (chưa split thì không có trang) |

Không còn `ir/legacy.yaml`. `legacy:` trên `ir/spec.yaml` chỉ khi có evidence thật.

Thiếu fact → `#missing_info` trên field đó. Grill không bịa CSS/API.

## design.nav + nested sections (dynamic)

Cùng một schema cho mọi page. Agent điền cây theo màn thực tế — không dùng một màn (login, list, …) làm mặc định.

```yaml
nav:
  sidebar:
    enabled: true   # false nếu không có menu trái
    position: left
    levels: []      # { id, label, href, active, children[] } lồng đa cấp
  breadcrumb: []    # { label, href }

**LƯU Ý ĐẶC BIỆT VỀ ĐA NGÔN NGỮ (i18n):**
1. **Text hiển thị UI (cần i18n)**: Các thuộc tính như `label`, `value`, `copy.placeholder`, text của component lib... BẮT BUỘC dùng cho i18n (sẽ được map với file ngôn ngữ). Áp dụng cho các component lá như `input`, `text`, `button`, v.v.
2. **Text ngữ cảnh (không i18n)**: Các thuộc tính giải thích/cấu trúc như `name`, `description`, `purpose` chỉ dùng cho BA/Dev, KHÔNG dùng để render UI, KHÔNG mang đi dịch. Tùy thuộc vào `kind` mà khai báo cho đúng bản chất, **tuyệt đối không dùng `label` để mô tả một node ẩn (như container)**.

```yaml
sections:
  # Ví dụ 1: Nhóm cấu trúc (Không có text hiển thị UI -> Không i18n)
  - id: <slug>
    name: <tên node (BA/Dev)>
    kind: container   # header | container | card | form | sidebar | toolbar | table | …
    description: <mô tả chi tiết>
    purpose: <việc user làm>
    visual:
      background: ""
      color: ""
      width: ""
      height: ""
      maxWidth: ""
      overflow: ""
      scroll: ""
    interaction:
      hover: {}
      blur: {}
      focus: {}
    validation: {}    # required, maxLength, pattern, … + messages
    apiRefs: []
    hidden: false
    tags: []          # "#needs-component: BlockName"
    extract: null
    items: []         # control lá — visual / interaction / validation / bind.apiRef / bind.hidden
    sections: []      # lồng tiếp cùng shape
    
  # Ví dụ 2: Node text (Có text hiển thị UI -> Cần i18n)
  - id: <slug>
    name: <tên node (BA/Dev)>
    kind: text
    value: "Tiêu đề trang" # Text này sẽ được map i18n
    
  # Ví dụ 3: Component nhập liệu (Có placeholder/label -> Cần i18n)
  - id: <slug>
    name: <tên node (BA/Dev)>
    kind: input
    description: <mô tả>
    purpose: <việc user làm>
    label: "Tên đăng nhập" # Cần i18n
    copy:
      placeholder: "Nhập tên đăng nhập..." # Cần i18n
```

Minh họa lồng (không phải template cố định): container → card → form, hoặc sidebar → toolbar → table.

## design.zones (flat fallback)

```yaml
zones:
  - id: search
    label: Khu vực tìm kiếm
    kind: container
    items:
      - id: keyword
        kind: search
        widget: search
        label: Ô tìm kiếm
        purpose: "User tìm bản ghi theo tên hoặc mã"
        copy:
          placeholder: Search by name or code
        bind: { field: keyword }
```

## design.behavior (CRUD table trong md render)

```yaml
behavior:
  create: { enabled: true, surface: page }
  delete: { enabled: true, mode: confirm_dialog }
```

## design.actions (API calls + UI error handling)

Không còn `bundle.spec.api`. Màn gọi API nào = `design.actions` (và button/item trong `sections`/`zones`) trên **`ir/design.yaml`** sau split.

- Unique API của màn: `apiRefs` (sau `/api-spec` ghi trio `api/<seq>/`).
- API đã có (màn khác / common): `tags: ["#reuse-api"]` + `reuseFrom: …/01-backend-spec.yaml`. **Không** tạo trio mới.

```yaml
actions:
  - id: submit_form
    label: Submit Form
    purpose: "Lưu form và báo kết quả cho user"
    variant: primary
    position: form_footer
    trigger: button_click
    apiRefs: [ feature.create ]
    # tags: ["#reuse-api"]
    # reuseFrom: product/surfaces/admin/CMP-01/auth/01/01/01/api/01/01-backend-spec.yaml
    onSuccess:
      - Navigate to list page
      - Show success toast "Created successfully"
    onCommonError:
      override: false
      notes: "Inherit #ui-common:error-handler (Global toast 500/401)"
    onSpecificError:
      - condition: "422 Validation"
        notes: "Show inline field errors below inputs"
      - condition: "403 IDOR"
        notes: "Redirect to safety page, show warning"
```

## Agent output (/spec)

YAML only per schema. No explanation. No markdown.

## Questions: AskQuestion wizard or hub `qa/open/`

Do **not** write `openQuestions` anywhere. Schema/render không còn field này.

- Member trả lời **ngay:** AskQuestion (options + Recommended + **Other**) → **STOP** → ghi field thật.
- Member chọn **Other** mà **chưa quyết:** `.cursor/extracts/qa-inbox.md` → `qa/open/QA-<bundle.id>-NNNN.yaml`. Đóng sau bằng **`/qa-resolve <id>` + giải pháp**.
- `grillStatus` có thể `done` khi vẫn còn file QA.

## YAML Syntax & Escaping Rules

- **ALWAYS quote colons in strings:** Any string containing `:` (e.g., `summary: "Case 1: Token..."`, `label: "Hàng nút: [Secondary]"`) MUST be wrapped in double quotes `"..."`.
- **Multiline text:** Use `|` block scalar for multiline strings or list items containing formatting symbols.

## ir/spec.yaml vs ir/design.yaml

`pnpm spec:split` ghi hai file. Docskit grill **không** đọc `ir/*` khi author — chỉ bundle. Split ghi `"Q&A":` trên **`ir/spec.yaml`** (id `QA-<bundle.id>-NNNN` cách nhau bởi `, `) từ `qa/open/` — không nhét list vào bundle.

Downstream (UI gen, API gen, testcase) đọc **chỉ `ir/design.yaml`**. Thiếu file = split/spec chưa xong. Story/copy chưa đủ thì **bổ sung design** (bundle.gen + split), không đọc `ir/spec.yaml`. `ir/spec.yaml` chỉ văn mô tả + `legacy` + `qa` (id treo).

