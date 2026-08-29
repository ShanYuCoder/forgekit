# Common pagination

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn pagination dưới table, dùng page numbers + ellipsis thay vì text generic `Page x of y`.

## status

draft

## owner

portal-team

## layout

```yaml
position: below table
alignment: center
style:
  - Flat outline buttons, border nhẹ, không shadow.
  - Active page dùng text/border primary `#4EAAFF` hoặc background primary nhạt.
  - Disabled previous/next vẫn giữ footprint để layout không nhảy.
```

## controls

```yaml
previous:
  content: icon + text
  icon: ChevronLeft
  text: 前へ
  ariaLabel: 前のページ
next:
  content: icon + text
  icon: ChevronRight
  text: 次へ
  ariaLabel: 次のページ
pageNumbers:
  window: current page +/- 2
  firstLast: show first/last when outside window
  ellipsis: show `...` when gap exists
```

## behavior

```yaml
query:
  - Pagination phải giữ search params hiện tại.
  - Page change gọi list service/composable, không lọc local-only nếu API
    contract có pagination.
perPage:
  - Per-page select và page summary không nằm trong pagination bar dưới table.
  - Per-page select nằm ở toolbar/header table góc phải theo
    `common-list-toolbar`, copy giữ `表示 ... 件 / ページ`.
  - Đổi per-page reset page về 1.
```

## testIds

```yaml
pagination: "{module}-pagination"
previous: "{module}-pagination-prev-btn"
next: "{module}-pagination-next-btn"
pageButton: "{module}-pagination-page-{page}"
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
