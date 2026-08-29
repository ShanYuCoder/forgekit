# Common list page shell

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn layout chung cho các page danh sách trong admin portal, ưu tiên giao diện phẳng shadcn và giữ các phần legacy lặp lại có giá trị sử dụng.

## status

draft

## owner

portal-team

## scope

```yaml
appliesTo:
  - admin list page
  - search/filter table page
  - import/report list có pagination
excludes:
  - report preview đặc thù
  - dashboard block
  - form detail/edit page
```

## principles

```yaml
- UI phẳng: dùng border, background nhẹ, spacing rõ; không dùng gradient, shadow
    nặng, hiệu ứng 3D.
- Legacy evidence là input để nhận diện pattern lặp lại; không copy các page
  legacy làm tùy hứng nếu trái common spec.
- Page spec riêng chỉ mô tả phần khác biệt; mọi phần
  list/search/toolbar/table/pagination mặc định dùng common specs.
```

## layout

```yaml
shell:
  - Dashboard layout hiện tại là outer shell; không dựng lại legacy theme
    wrapper.
  - Content list dùng một khối phẳng có border nhẹ và background `bg-card` hoặc
    `bg-white`.
  - Search/filter nằm phía trên table.
  - Toolbar action nằm dưới search/filter và phía trên table.
  - Table body nằm trong vùng trắng, có horizontal overflow khi nhiều cột.
  - Pagination nằm dưới table và căn giữa.
density:
  default: compact
  rowHeight: 40-48px cho table thường
  cellPadding: px-3 py-2
  spacing: 4 hoặc 6 theo scale Tailwind, tránh khoảng trắng quá lớn trên list
    nhiều dữ liệu.
```

## composition

```yaml
preferredComponents:
  - DataListPage
  - MoSearchForm
  - MoDataTable
  - MoPaginationBar
overridePolicy:
  - Chỉ tạo organism riêng khi `DataListPage` không thể giữ đúng layout của spec
    hoặc page có table/report đặc thù.
  - Nếu override common pattern, spec page phải ghi `overrideCommonPattern: true` và lý do.
```

## testIds

```yaml
required:
  page: "{module}-page"
  searchForm: "{module}-search-form"
  toolbar: "{module}-toolbar"
  table: "{module}-table"
  pagination: "{module}-pagination"
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
