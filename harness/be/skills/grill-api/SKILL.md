---
name: grill-api
description: /grill-api — audit generated FastAPI/Laravel/Nest API before integration.
disable-model-invocation: true
---

# /grill-api

Run after `npm run codegen:api:dry` / `codegenkit api-gen:dry` and after implementation.

**Owner:** Codegenkit (`--type=be`). Docs hub is **read-only**.

## Target / ID Resolution Rule

- User prompt MAY specify a function ID, API slug, or short name (e.g. `API-AUTH-001`, `login`, `CMP-ADM-009`).
- Agent MUST resolve **`…/api/<seq>/01-backend-spec.yaml`** via `CODEGENKIT_DOCS_ROOT` or `docskit_route` (screen leaf `CMP-*/<NN…>/api/<seq>/`, or `common/yaml/<slug>/`, or `integrations/…/api/<seq>/`).
- **Read the entire `01-backend-spec.yaml`**. Do **not** use `ir/design.yaml` or `ir/spec.yaml` as BE contract.
- Compare generated routes/code against that 01 file. Missing 01 → STOP, hand off to docs `/grill-api-spec`.
- Do NOT demand full filesystem paths from the user if an ID is given.

## Docs Root Resolution

1. If `CODEGENKIT_DOCS_ROOT` is set (non-empty), use it as the canonical
   pointer for locating `01-backend-spec.yaml`.
2. If `CODEGENKIT_DOCS_ROOT` is **not** set, fall back to Platform DNA
   configuration (`platform-dna`) to resolve the docs hub path.
   Platform DNA discovery is slower and more error-prone, so always prefer
   an explicit `CODEGENKIT_DOCS_ROOT` when available.

Check:

- Routes/methods/statuses match `01-backend-spec.yaml` (action-suffix paths).
- AuthZ and tenant scope use trusted context.
- Validation does not accept request-bag noise.
- Null/empty/error semantics remain distinct.
- Writes are transaction-safe; async retries are idempotent.
- Generated placeholders are replaced before ship.

## Accelerators (optional)

```text
if ArtifactGraph available: local contract/tag/parity hints only
else: scoped contract-to-code comparison

if codegraph-<repo-key> for this checkout: callers/routes/jobs/listeners
else: targeted repository search

architecture IDs / C4 → Docskit (DOCSKIT_ROOT), never CodeGraph
```

Missing accelerators never block the grill. Complete each scoped model or
targeted-local fallback first, then follow
the remainder of this skill.

## Translation Rule
Luôn bọc text tĩnh bằng i18n helper native của framework (VD: `__('key')`, `_localizer["key"]`, `i18n.t('key')`). 
- Đọc block `i18n` từ `ir/design.yaml`.
- Tự động sinh/cập nhật file ngôn ngữ tương ứng (`.json` cho NodeJS/PHP/Python, hoặc `.resx` cho Dotnet). 
- KHÔNG trả về raw error message tĩnh không được bọc hàm dịch.

## Profile Handling Behavior
LƯU Ý QUAN TRỌNG: AI không được tự ý viết code lại từ đầu. Lệnh `codegenkit api-gen` (Script Engine) luôn luôn chạy trước để sinh ra bộ khung code cơ sở (Scaffolding). Tùy thuộc vào giá trị của `gen.codegen.profile`, AI chỉ được phép đọc bộ khung có sẵn đó, sau đó bổ sung và điều chỉnh logic tương ứng:
- **`profile: auth`**: Bổ sung logic xác thực (Login, JWT token, mã hóa bcrypt) vào bộ khung.
- **`profile: select-item`**: Tinh gọn bộ khung list thành API danh sách siêu nhẹ trả về `id`, `name`/`label` cho Dropdown.
- **`profile: setting`**: Điều chỉnh bộ khung để đọc/ghi cấu hình tĩnh dạng Key-Value hoặc file JSON.
- **`profile: free`**: Bổ sung tự do các nghiệp vụ theo yêu cầu `summary` / `purpose` của spec.
- **`profile: export`**: Bổ sung luồng truy xuất dữ liệu lớn và sinh file export (CSV/Excel).
- **`profile: import`**: Bổ sung luồng upload file, parse dữ liệu, validate hàng loạt và bulk insert.
- **`profile: dashboard-stats`**: Bổ sung logic query tổng hợp (aggregation), gom nhóm dữ liệu trả về số liệu thống kê.
