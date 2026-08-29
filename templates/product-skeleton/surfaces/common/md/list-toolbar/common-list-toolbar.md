# Common list toolbar

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn toolbar action của list page, gồm total readonly button, action chính/phụ, bulk action và per-page control.

## status

draft

## owner

portal-team

## layout

```yaml
position: below search filter, above table
style:
  - Nằm cùng nền list block, không bọc card/nền trắng riêng.
  - Dùng flex wrap, gap nhỏ, per-page đẩy sang phải khi đủ rộng.
  - Thiết kế phẳng, không shadow hoặc gradient.
```

## items

```yaml
total:
  text: 合計 {count}
  variant: complete
  color: "#48b0f7"
  behavior: readonly button-style, không clickable
  badgePolicy: Không bọc số bằng badge bo riêng; số nằm cùng text/nền button.
  testId: "{module}-total-btn"
primaryAction:
  examples:
    - 新規作成
    - CSVアップロード
    - インポート
  variant: complete
  icon: required khi action rõ nghĩa và có icon phù hợp
bulkAction:
  position: after primary actions
  disabledWhen: no selection
  destructive: true nếu là delete
perPage:
  position: right
  labels:
    before: 表示
    after: 件 / ページ
  pageSummary:
    text: "{currentPage} / {totalPages}"
    position: cạnh per-page select trong toolbar/header table góc phải
    note: Đây là số trang hiện tại/tổng số trang, không đặt dưới pagination controls.
  options:
    - 20
    - 40
    - 80
    - 100
  testId: "{module}-per-page-select"
```


## Design intent

**Inherits:** `admin-crud`

**Shell:** #shell: DataPage

**Patterns:**

- #pattern: CRUD

### Zones

| ID | Nhãn | Vị trí | Container | Ghi chú |
| --- | --- | --- | --- | --- |
| main | Nội dung chính |  |  |  |

## Legacy evidence
