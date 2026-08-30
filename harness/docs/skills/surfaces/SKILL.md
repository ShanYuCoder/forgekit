---
name: surfaces
description: "/surfaces — Manage business/interaction surfaces (who does what on which channel)."
disable-model-invocation: true
extractBundle: architecture-core
---
# /surfaces
**Target Paths:** `product/surfaces/[Business Surface]`
**Guidelines:** Manage business/interaction surfaces, not repos or projects. A surface is defined by actor(s), channel, and business responsibility.

## Workflow / Luồng thực thi
1. Kiểm tra xem thư mục `product/surfaces` đã tồn tại chưa. Nếu chưa, tạo mới.
2. Nếu gọi kèm tên một business surface cụ thể (vd: `/surfaces "Customer App"`):
   - Kiểm tra xem thư mục `product/surfaces/[Tên Surface]` đã có chưa. Nếu chưa, tạo mới thư mục rồi mới làm việc.
3. Nếu gọi kèm `common`:
   - Không tên surface → `product/surfaces/common` **chỉ** khi rule/API dùng cho ≥2 surfaces. Không dùng làm thùng rác mặc định.
   - Có tên surface → `product/surfaces/[Surface]/common` cho share **giữa các module** trên surface đó. Share trong một CMP → `/module CMP-… common`.

## Surface meaning
- A surface represents a business interface or interaction channel (e.g., Customer Web, Admin Portal, Mobile App, Integration Gateway).
- common is shared scope used by more than one surface.
- API is **not** a surface; API belongs to architecture containers or function / API contract detail.

## Target / ID Resolution Rule

- User prompt MAY specify a Surface ID or Business Surface name (e.g. `Admin Portal`, `Customer Web`).
- Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve target surface directory under `product/surfaces/...`.

## Overview alignment
When writing overview content, describe the surface in the same business sense:
- who uses it
- what they do
- which channel they use
- what business responsibility it covers

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /surfaces`):
- Tham chiếu source from `legacy-repos.local.json`.
- Khảo cổ: truy vết và ánh xạ các client / app / integration cũ vào đúng business surface hiện tại, ghi nhận vào cùng thư mục đang thao tác tại `product/surfaces/[Tên Surface]/legacy-surface.md`.

## Verification Checklist (Evidence Required)
- [ ] **Target Surface Resolved:** Located or created surface folder under `product/surfaces/[Surface Name]`.
- [ ] **Business Responsibilities:** Documented actors, channels, and scope cleanly.
- **DO NOT output fake checklists, i18n tables, or framework prose.**

