---
name: build-templates
description: /build-templates — Quét codebase (FE/BE) và sinh EJS templates + common specs phù hợp.
disable-model-invocation: true
---

# /build-templates — Codebase Scanning & Template Scaffolding

**Mục đích:** Đồng bộ giao diện tài liệu của Docs Hub (`docskit`) khớp với thực tế mã nguồn Frontend/Backend của dự án (sử dụng thư viện gì, cấu trúc ra sao) bằng cách quét code và sinh template `.ejs` tùy biến tương ứng.

## Quy trình thực hiện (AI Workflow):

1. **Đọc cấu hình liên kết dự án:**
   - Đọc file `platform-repos.local.json` tại root của Docs Hub để phân giải đường dẫn tuyệt đối tới các thư mục mã nguồn Frontend (`fe`) và Backend (`be`) đang được liên kết bởi `platform-dna`.
   - Nếu không tìm thấy hoặc đường dẫn trống, yêu cầu người dùng cấu hình bằng lệnh `/configure-repo-maps`.

2. **Quét và phân tích Codebase:**
   - **Frontend (fe):** Quét file `package.json` và các import trong component để nhận diện UI Framework (ví dụ: `vuetify`, `shadcn-ui`, `element-plus`, `bootstrap`,...). Tìm các component layout dùng chung (ví dụ: Breadcrumb, MainLayout, Table, Form).
   - **Backend (be):** Quét các router/controller và cấu trúc dữ liệu dùng chung (ví dụ: Base Response, Paging Request) để nắm bắt chuẩn API.

3. **Sinh EJS Templates tùy biến:**
   - Viết các file template EJS vào thư mục `.docskit/templates/` (ví dụ: `.docskit/templates/default-layout.ejs`, `.docskit/templates/breadcrumb-flow.ejs`).
   - Các file EJS này phải được sinh cấu trúc HTML/Markdown và các thẻ component giả lập (hoặc thực tế) khớp chính xác với UI Kit của dự án (ví dụ nếu dùng Vuetify thì sinh các thẻ component mô phỏng kiểu Vuetify, nếu dùng Shadcn thì sinh theo phong cách thiết kế phẳng).

4. **Đồng bộ file Đặc tả dùng chung (Common Specs):**
   - Tạo hoặc cập nhật các file đặc tả YAML dùng chung trong `product/surfaces/common/yaml/` khớp với cấu trúc code dùng chung vừa quét được ở bước 2.

5. **Biên dịch thử nghiệm:**
   - Yêu cầu người dùng hoặc tự động chạy lệnh `pnpm docs:render` để biên dịch toàn bộ spec và đảm bảo các template EJS mới tạo hoạt động hoàn hảo không bị lỗi cú pháp.

## Nguyên tắc:
- Không thay đổi các thẻ neo HTML comment dạng `<!-- docskit-anchor: ... -->` trong template vì đây là neo dữ liệu giúp AI hiểu cấu trúc.
- Nếu template EJS đã tồn tại và có tùy chỉnh từ trước của member, hãy hỏi ý kiến member trước khi ghi đè, hoặc chỉ bổ sung/sửa đổi phần thay đổi.
