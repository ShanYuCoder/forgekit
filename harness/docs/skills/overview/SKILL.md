---
name: overview
description: /overview — Handles the Overview root folder (Operational areas).
disable-model-invocation: true
extractBundle: architecture-core
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - You MUST read and strictly comply with ALL workflow steps, rules, and load policies below.
> - Do NOT perform a shallow check. Verify your results against the **Verification Checklist** at the end of this skill before completing.

# /overview
**Target Paths:** `product/overview/operational-areas/[Admin operations | Workforce operations | ...]`
**Guidelines:** Focus on personas, operational areas, and high-level system purpose.

## Workflow / Luồng thực thi
1. Kiểm tra xem thư mục `product/overview` đã tồn tại chưa. Nếu chưa, tạo mới.
2. Nếu gọi kèm `common` (vd: `/overview common`):
   - Kiểm tra xem `product/overview/common` đã có chưa.
   - Nếu có, tiến hành cập nhật. Nếu chưa, tạo mới thư mục/file tương ứng rồi mới cập nhật.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /overview`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Nhiệm vụ là "khảo cổ": map các actor/persona và hệ thống con cũ thành Operational Areas tương ứng, ghi nhận vào cùng thư mục đang thao tác nhưng tên file thêm tiền tố `legacy-` ở đầu (vd: `product/overview/legacy-overview.md`).

## Verification Checklist
- [ ] Strictly verified presence/creation of `product/overview` directory structure.
- [ ] Handled `common` modifier if passed.
- [ ] Handled `/legacy` modifier by referencing `legacy-repos.local.json` and prepending `legacy-` to output filenames if applicable.

