# Backend Phase 3b Workflow

> Slide Markdown cho review team: spec trước, code sau.

---

## Agenda

1. Vì sao phase 3b cần tách 2 step
2. Step 1: Backend API Spec
3. Step 2: Backend Implementation
4. Entity/module/relationship analysis
5. OpenAPI YAML + Swagger local
6. Rules/skills cho AI agent

---

## Vấn Đề Nếu Code Quá Sớm

- FE spec thường mô tả screen, chưa đủ contract backend.
- Một cụm chức năng có nhiều màn liên quan, không thể scaffold theo từng endpoint thô.
- Detail API có thể dùng lại cho edit form, nhưng nếu không phân tích trước dễ sinh trùng endpoint.
- Dashboard/summary nếu gom bừa một API lớn sẽ khó cache, khó permission, khó test.
- Relationship/pivot nếu sai từ đầu sẽ làm code Laravel khó sửa.

Thông điệp: backend cần contract review trước khi generator chạy.

---

## Flow Mới

```text
Portal phase 1
  spec.yaml + testcases/*.yaml
        ↓
Step 1: /api-spec
  backend spec + OpenAPI YAML + mock data
        ↓
review/comment/chỉnh contract
        ↓
Step 2: /api-code
  Laravel API Base implementation
```

Step 1 không code Laravel. Step 2 không tự thiết kế lại contract.

---

## Team Làm Song Song

FE có thể update spec sau khi BE đã nhận spec cũ.

Rule mặc định:

```text
Cùng feature/cụm chức năng
  → update spec cũ

Child function thuộc aggregate cũ
  → update spec cũ + changeLog

Bounded feature độc lập
  → tạo spec mới
```

Ví dụ `admin quản lý chain` thêm `setting chain` thì update spec `chain`, không tạo spec mới nếu setting thuộc aggregate Chain.

---

## Step 1 Input

Đọc từ hai hub, không suy đoán vị trí checkout:

```text
base-docs: product/surfaces/…/CMP-*/<NN…>/
base-tests: https://github.com/raintr91/base_test
```

Spec cho biết requirement và route. Testcase cho biết expected behavior, mock endpoint, auth, validation, success/error states.

---

## Step 1 Output

```text
product/surfaces/…/CMP-*/<NN…>/api/<seq>/
├── 01-backend-spec.yaml
├── 02-openapi.yaml
├── 03-mock-data.yaml
└── generated/
    └── backend-spec.md
```

- YAML cho AI/dev.
- Markdown cho FE/BE/BA/QA review trên VitePress.
- OpenAPI YAML cho Swagger/Redoc preview.
- Mock data để FE đối chứng contract sớm.

---

## Step 1 Làm Gì

- Phân tích cụm chức năng, không chỉ một màn.
- Xác định module/API prefix theo actor/scope.
- Xác định Platform/Tenant entity.
- Bóc aggregate root, child entity, pivot M-N.
- Bóc relationship và sync strategy.
- Bóc endpoint cần có.
- Xác định request, response, filter, sort, include.
- Ghi rõ API reuse và API cần tách riêng.

---

## API Reuse

Reuse hợp lý:

- Detail API dùng cho detail page và edit current data.
- Select/autocomplete dùng `select-items`.
- List dùng lại cho table/search nếu shape và permission giống nhau.

Không reuse khi khác:

- permission
- cache/refresh rate
- source data
- pagination/lifecycle
- payload nặng nhẹ quá khác nhau

---

## Dashboard / Summary

Không mặc định gom tất cả vào một API.

Ví dụ có thể tách:

```text
GET /admin/dashboard/summary
GET /admin/dashboard/revenue
GET /admin/dashboard/hotels
GET /admin/dashboard/alerts
```

Tách khi từng block có loading/error/caching/permission khác nhau.

---

## Module Analysis

FE có thể tổ chức:

```text
Một portal:
  /admin/...
  /chain/...
  /store/...

Nhiều portal:
  admin portal
  chain portal
  store portal
```

Backend chọn module theo domain boundary, actor, permission và data ownership, không theo folder FE máy móc.

---

## Entity Mode

| Mode | Khi dùng | Laravel |
|---|---|---|
| Platform | global/master/config | `App\Models\Platform\*` |
| Tenant | dữ liệu thuộc tenant | `App\Models\Tenant\*` |
| Pivot M-N | mapping nhiều-nhiều | không model |

Pivot M-N chỉ có migration và `belongsToMany`; sync qua parent Action.

---

## Relationship Strategy

| Relationship | Xử lý |
|---|---|
| `hasOne` | `updateOrCreate` qua parent Action |
| `hasMany` | sync/createMany qua parent Action nếu thuộc aggregate |
| `belongsToMany` | pivot migration only, `sync` |
| Cross-domain | Service riêng |

Rule: có relationship thì ưu tiên Action/Query của entity cha.

---

## Step 2 Input

```text
product/surfaces/…/CMP-*/<NN…>/api/<seq>/01-backend-spec.yaml
product/surfaces/…/CMP-*/<NN…>/api/<seq>/02-openapi.yaml
product/surfaces/…/CMP-*/<NN…>/api/<seq>/03-mock-data.yaml
src/make_help.md
```

`src/make_help.md` bắt buộc đọc trước khi tạo class.

---

## Step 2 Làm Gì

- Dùng `m:*` / `add:*` generator.
- Tạo module/model/migration/controller/request/action/query/resource.
- Điền fillable và relationship.
- Điền Request validation.
- Điền Query filters/sorts/includes.
- Điền Action create/update/delete/sync relations.
- Điền Resource đúng response contract.
- Verify bằng test/lint liên quan.

---

## OpenAPI / Swagger

Source là YAML:

```text
docs/openapi/api.yaml
product/surfaces/…/CMP-*/<NN…>/api/<seq>/02-openapi.yaml
```

Không dùng decorator trong Laravel controller/resource.

Commands:

```bash
pnpm openapi:lint
pnpm openapi:preview
pnpm swagger:dev
```

---

## Service Hashtags

Hai hashtag đặc biệt:

```text
#call-external
  payment / webhook / SMS / shipping / OAuth / ERP
  → Service only cho external integration

#cross-entity-service
  2 entity nội bộ độc lập, rất ít dùng
  → Action/Query entry + Service orchestration
```

Nếu có relationship thì dùng Eloquent relationship. Nếu chỉ là side effect thì ưu tiên Event/Observer/Job.

---

## VitePress Local Docs

Chạy:

```bash
pnpm docs:dev
```

Build static:

```bash
pnpm docs:build
pnpm docs:preview
```

Review được workflow, generated backend specs, OpenAPI guide và slide này.

---

## Skills

```text
api-spec
  Step 1: requirement → backend contract

grill-api-spec
  Audit contract trước khi code (khuyến nghị)

api-code
  Step 2: approved contract → Laravel code
```

Router:

- `/api-spec` hoặc "phase 3b spec" → Step 1.
- `/grill-api-spec` → audit contract (optional, recommended).
- `/api-code` hoặc "implement backend theo spec" → Step 2.
- `/api` mặc định vào Step 1 nếu chưa có backend spec.

Commands hiện tại: `/api-spec`, `/grill-api-spec`, `/api-code` (xem skills trên).

---

## Definition Of Done

Step 1 done:

- backend spec YAML
- OpenAPI YAML
- mock data
- generated Markdown
- open questions rõ

Step 2 done:

- Laravel code theo generator
- resource/request/query/action đúng contract
- verify pass hoặc ghi rõ blocker

---

## Kết Luận

Backend phase 3b đẹp nhất khi đi theo hướng:

```text
Requirement → Contract → Review → Swagger/Mock → Code
```

Spec trước giúp FE/BE cùng nhìn một API contract trước khi code Laravel phát sinh diff lớn.
