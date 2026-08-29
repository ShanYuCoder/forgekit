# Common breadcrumb flow

- **Testcase:** `#`
- **Screen:** `#`

Mọi dashboard page có breadcrumb khớp menu cha-con và action chain; breadcrumb trên page title.

## status

draft

## owner

portal-team

## principles

```yaml
- Breadcrumb bắt buộc trên list, detail, edit, create khi có sidebar parent.
- Thứ tự header — breadcrumb rồi page title rồi content.
- Create không phải menu con — trail đi qua list (toolbar create).
```

## references

```yaml
- .cursor/extracts/common-breadcrumb-flow.md
- docs/features/common/common-list-page.spec.yaml
```

## hierarchy

```yaml
- sidebarParent
- sidebarChildOrList
- actionPages
```

## examples

```yaml
hotelList: ホテル管理 > ホテル一覧
hotelDetail: ホテル管理 > ホテル一覧 > {name}
hotelEdit: ホテル管理 > ホテル一覧 > {name} > 編集
hotelCreate: ホテル管理 > ホテル一覧 > 新規作成
```

## grill

```yaml
bqa: labels, entity display field, create label
dev: ui.routes chain, route meta, wire-only menu API
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
