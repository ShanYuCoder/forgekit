# Hướng dẫn tạo Common Function / Pattern

Tài liệu này hướng dẫn quy trình tiêu chuẩn để định nghĩa và thiết kế các thành phần dùng chung (Common) trong hệ thống Docskit, bao gồm: UI Patterns, Backend Middlewares, API Functions, và các Business Rules.

## 1. Phạm vi Common (bắt buộc)

Đọc `.cursor/extracts/common-scope.md`. Đặt `common/` tại **thư mục thấp nhất mà mọi consumer dùng chung** (cluster → module → surface → `product/surfaces/common`). Nội bộ một module → `CMP-*/common/` (hoặc `CMP-*/NN/common/` nếu chỉ một cluster). Không dump hết vào `product/surfaces/common`.

## 2. Phân loại các tầng Common

Hệ thống hỗ trợ định nghĩa Common ở nhiều tầng khác nhau, phục vụ cho mọi loại Surface (Web Portal, HMI, Mobile, Gateway):

- **UI / UX Patterns:** Các mẫu giao diện và tương tác (vd: `confirm-dialog`, `breadcrumb-flow`, `step-navigation`).
- **Middlewares:** Các logic đánh chặn/xử lý trung gian (vd: `auth-guard`, `rate-limiter`, `tenant-context`).
- **API Functions:** Các API dùng chung không phụ thuộc nghiệp vụ cụ thể (vd: `health-check`, `file-upload`, `master-data`).
- **Business Rules:** Các quy tắc nghiệp vụ toàn cục (vd: quy tắc tính thuế, quy tắc làm tròn số).

> **Lưu ý:** Thư mục template hiện tại (`templates/product-skeleton/surfaces/common/yaml/`) chủ yếu chứa các seed mẫu cho **UI Patterns** (Web CRUD). Hệ thống **chưa** có sẵn các seed mẫu cho tầng **Middlewares** hay **API Functions** (ngoại trừ pilot `API-CMN-HEALTH-001` trong thư mục `code/`). Bạn có thể tự do tạo mới chúng theo nhu cầu dự án bằng công cụ AI có sẵn.

## 2. Quy trình thiết kế Common

### Bước 1: Chọn LCA rồi scaffold `common/`
- Nội bộ module: `/module CMP-… common` (hoặc `/module CMP-… 02 common` cho cluster).
- Nhiều module một surface: `/surfaces <surface> common`.
- Nhiều surface: `/surfaces common` → `product/surfaces/common`.

### Bước 2: Định nghĩa Quy tắc Nghiệp vụ (Markdown)
Dành cho BA / QA / Dev để thống nhất logic trên giấy tờ (Human-readable).
```bash
# Trong màn hình chat với Agent:
/common
```
- **Mô tả yêu cầu:** "Tạo tài liệu common cho Middleware Auth, yêu cầu check token và tenant id."
- **Kết quả:** `…/<LCA>/common/patterns/auth-middleware.md`.

### Bước 3: Định nghĩa Kỹ thuật (YAML Bundle)
Dành cho Dev để khai báo cấu trúc kỹ thuật, chuẩn bị cho CodeGen (Machine-readable).
```bash
# Trong màn hình chat với Agent:
/common-spec
```
- **Mô tả yêu cầu:** "Viết technical bundle cho auth middleware vừa tạo."
- **Kết quả:** `…/<LCA>/common/yaml/auth-middleware/auth-middleware.bundle.yaml`.

### Bước 4: Kiểm duyệt Kỹ thuật (Audit)
Trước khi sinh code, bạn có thể yêu cầu AI kiểm tra lại bundle:
```bash
/grill-common-spec
```

### Bước 5: Render và Tích hợp
Sau khi có file YAML, chạy lệnh để sinh tài liệu Markdown cho toàn team đọc:
```bash
docskit split -- product/surfaces/<surface>/common/yaml/auth-middleware/auth-middleware.bundle.yaml
docskit render
```

---

## 3. Cách tái sử dụng Common trong Feature Spec

Khi bạn thiết kế một màn hình hoặc API cụ thể, bạn (hoặc AI) có thể tái sử dụng các Common đã định nghĩa:

### Kế thừa UI Pattern
Khai báo trong file `bundle.yaml` của màn hình (`design.patterns`):
```yaml
design:
  patterns:
    - "#pattern: confirm-dialog"
```

### Kế thừa API / Middleware
Khai báo thẻ `#reuse-api` hoặc `#middleware` trong API spec để CodeGen tự động map route thay vì sinh code duplicate:
```yaml
spec:
  api:
    endpoints:
      - id: get-profile
        path: /api/v1/profile
        tags:
          - "#middleware: auth-middleware"
```

## 4. Tạo Project-Level Pattern Archetype (Tùy chọn)

Nếu dự án có một nhóm các common thường xuyên đi chung với nhau (ví dụ: mọi webhook đều cần rate-limit, circuit-breaker, retry), bạn có thể tạo một file archetype:

**File:** `product/surfaces/<surface>/common/patterns/webhook.pattern.yaml`
```yaml
schema: surface-pattern/v1
id: gateway-webhook
appliesWhen:
  - webhook

commonSpecs:
  - yaml/common/rate-limit/common-rate-limit
  - yaml/common/circuit-breaker/common-circuit-breaker
  - yaml/common/webhook-retry/common-webhook-retry

defaultTags:
  - "#pattern: Webhook"
  - "#shell: OtAdapter"
```
Khi dùng `/spec` để tạo webhook mới, AI sẽ tự động đọc file này và gợi ý chèn đầy đủ các common specs cần thiết.
