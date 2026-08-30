# Design registry promotion

**Chỉ phase `/prototype`** — sau khi agent/dev **đã implement** component từ hashtag trong spec.  
**Không** là việc của `portal:gen` (gen chỉ scaffold từ registry + ghi slot thiếu trong HANDOFF).

**Registry:** `registries/design.registry.json`  
**Validate:** `pnpm portal:registry`  
**Agent extract:** FE design-registry extract (not vendored into docs hub); promotion policy stays here.

---

## Phân vai theo phase

| Phase | Việc với component thiếu |
|-------|---------------------------|
| `/grill-with-docs` | Ghi `tags:` — `#needs-component: slot:MoName:prop`, `#needs-ui: Widget` (inventory; tên Mo* rõ) |
| `/prototype` | **Implement** `Mo*` / shell; **promote registry** nếu common; domain-only giữ trong feature |
| `portal:gen` | Scaffold layers + shell từ registry; slot chưa có file → **placeholder** + HANDOFF *Prototype next* — **không** emit stub `.vue` |

---

## Vì sao cần promote (sau prototype)

Base không implement hết `planned` (DataFormPage, Repeater, …). Page đầu prototype ra `Mo*` / pattern thật. Nếu không promote:

- Grill page sau vẫn gõ `#needs-component` thay vì `#widget:` / `#shell:` chuẩn.
- `aliasIndex` thiếu từ BA đã dùng trên page đầu.
- Gen không map đúng component đã có trong repo.

---

## Khi nào promote (ít nhất một)

| Điều kiện | Hành động |
|-----------|-----------|
| Component/shell **dùng lại** ở feature thứ 2 | Promote registry |
| Là **widget/shell chuẩn** (Input, Repeater, DataFormPage) — không domain-only | Promote |
| Pattern layout lặp (settings 2 cột, list + export block) | Promote `patterns` hoặc `shells.variants` + cân nhắc `product/surfaces/common/common-*.spec.yaml` |
| BA/legacy dùng từ mơ hồ lặp lại | Thêm `aliasIndex` |

## Khi nào **không** promote

| Trường hợp | Ví dụ |
|------------|--------|
| Domain-only | `MoManagerHandoffPills` (chain hotel) |
| `#manual-composable` / `#wire-only` | export API, login-as handoff |
| Một lần, không tái sử dụng | Giữ `components/molecules/custom/`; ghi *Feature-only* trong PR/notes |

---

## Checklist promote (cuối /prototype)

1. [ ] Đủ điều kiện promote ở bảng trên?
2. [ ] Sửa `registries/design.registry.json`:
   - `status: planned` → `implemented`
   - `portal.path` / `molecule` đúng file thật
   - `aliasIndex` + `componentAliases` (từ ngữ BA/spec page đầu)
   - `shells` / `fieldWidgets` / `patterns` nếu là shell hoặc widget chuẩn
3. [ ] `pnpm portal:registry` — exit 0
4. [ ] `pnpm portal:gen --spec ... --force` — slot wire sau khi file tồn tại
5. [ ] Grill spec **mới**: canonical (`#widget:`, `#shell:`) thay `#needs-*` nếu đã implemented
6. [ ] Pattern layout rộng → `product/surfaces/common/common-*.spec.yaml` (optional)

---

## Map hashtag → registry

| Hashtag trong spec | Sau prototype |
|--------------------|----------------|
| `#needs-component: cell-x:MoXxx` | Domain → giữ tag; generic → `fieldWidgets` / `#widget:` + registry |
| `#needs-ui: Repeater` | `fieldWidgets.Repeater` → `implemented` |
| `#shell: custom` + DataListPage variant | Lặp → `shells.DataListPage.variants` hoặc pattern mới |
| `#wire-only:` | **Không** registry (phase API) |

---

## Ai làm

| Bước | Owner |
|------|--------|
| Inventory thiếu hụt trong spec | `/grill-with-docs` |
| HANDOFF slot / placeholder | `portal:gen` (ghi only) |
| Implement `Mo*` + **promote registry** | `/prototype` |
| Review PR | *New reusable Mo* → registry updated hoặc feature-only noted* |

---

## PR / review gợi ý

- File mới dưới `components/molecules/` (không `custom/`) → xem xét promote.
- Organism mới `Data*` → cập nhật `shells`.
- Chỉ sửa một feature page, không sửa registry → OK nếu domain-only; ghi trong PR.

---

## Liên quan

- [PAGE-LIFECYCLE.md](../7-architecture/page-lifecycle.md) — stage route (`prototype` / `wire`)
- [E2E-TESTIDS.md](../5-testing/e2e-testids.md) — testId khi promote widget
- `product/surfaces/common/index.md` — common YAML khi promote pattern UI
