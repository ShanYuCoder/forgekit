# YAML/Markdown AI Workflow

> Page tham khảo cho slide `Portal Feature Artifact Workflow`.

## Mục Tiêu

Không bắt member viết YAML.

Mục tiêu là:

- AI nhận input thô.
- AI chuẩn hóa thành tài liệu kỹ thuật.
- Member review bản Markdown/prototype.
- Phase sau dùng source có cấu trúc để sinh model, API, E2E.

Thông điệp: Markdown cho người đọc, YAML cho máy xử lý.

## Input Không Cần Quá Chuẩn

Team vẫn có thể bắt đầu bằng:

- bullet requirement
- Markdown thô
- một câu mô tả ngắn
- ảnh màn hình
- nội dung copy từ hệ thống khác
- code legacy cần đọc lại behavior

AI hỗ trợ tổng hợp thành bản nháp tốt hơn.

## Vì Sao Dùng YAML?

YAML là format dữ liệu có cấu trúc, dễ đọc hơn JSON trong nhiều tài liệu kỹ thuật.

Lợi ích trong workflow AI:

- Có key/value rõ, giảm mơ hồ.
- Dễ diff bằng Git.
- Dễ render sang Markdown.
- Dễ dùng làm input cho phase sau.
- Ít nhiễu hơn mô tả tự do dài.

YAML không phải deliverable cho mọi member. YAML là lớp kỹ thuật bên dưới.

## Vì Sao Dùng Markdown?

Markdown là bản review cho người đọc.

- BA/QA/member đọc Markdown.
- Dev/AI dùng YAML khi cần xử lý kỹ thuật.
- VitePress render Markdown thành docs site có sidebar/search/link.
- Markdown dễ copy, review, comment, version bằng Git.

## Excel/Docx Có Bị Bỏ Không?

Không.

Excel/Docx vẫn có thể là deliverable nếu team hoặc khách hàng cần.

Khác biệt là:

- Markdown/YAML là lớp làm việc kỹ thuật cho spec/testcase/E2E.
- Excel/Docx là deliverable riêng nếu team hoặc khách hàng cần.
- Từ Markdown/YAML xuất ra Excel dễ hơn là viết ngược từ Excel sang tài liệu kỹ thuật.
- Có thể dùng script, AI cá nhân, công cụ export, hoặc con người chuyển đổi khi cần.

## Docs As Code

Workflow này gần với hướng “docs as code”:

- tài liệu sống cùng repo
- version bằng Git
- review cùng code
- build được bằng CI/script
- giảm drift giữa code và tài liệu

Tham khảo:

- [YAML official spec](https://yaml.org/spec/)
- [Docs as Code overview](https://docsio.co/blog/docs-as-code)
- [Documentation as Code](https://clickhelp.com/clickhelp-technical-writing-blog/what-is-documentation-as-code-and-why-do-you-need-it/)

## Render Markdown

```bash
forgekit init          # Sinh ra scripts forge:render / forge:publish / forge:split...
pnpm forge:render      # ir/generated + qa/index.md
pnpm forge:publish     # CATALOG.md + cập nhật API / QA Inbox
pnpm forge:dev         # Mở giao diện VitePress Local
```

Output (cùng leaf với bundle):

```text
product/surfaces/<surface>/CMP-*/<NN…>/
  <slug>.bundle.yaml
  ir/design.yaml
  ir/spec.yaml
  ir/generated/<slug>.md
  api/<seq>/01-backend-spec.yaml   # nếu API unique của màn
qa/index.md
CATALOG.md
```

## Câu Chốt

Chuyển sang YAML/Markdown không phải để con người phục vụ AI.

Đây là cách để AI hỗ trợ con người tốt hơn: nhận input thô, tạo bản nháp có cấu trúc, rồi member review bản dễ đọc.
