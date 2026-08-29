# Common search filter

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn form search/filter cho list page, tách rõ input filter và nút search/clear.

## status

draft

## owner

portal-team

## layout

```yaml
filterRow:
  position: top of list block
  behavior:
    - Các field filter nằm cùng row khi đủ rộng, tự wrap theo nhóm field khi màn
      nhỏ.
    - Không đặt button search/clear cùng hàng với action toolbar như
      create/delete/import.
    - Date range dùng start + separator `to` + end trong cùng input group.
buttonRow:
  position: below filter row
  alignment: center
  buttons:
    - key: search
      text: 検索
      icon: Search
      variant: outline-primary
      color: "#4EAAFF"
      background: "#FFFFFF"
      minWidth: 170px
    - key: clear
      text: クリア
      icon: RotateCcw
      variant: outline-secondary
      color: "#C2C2C2"
      background: "#FFFFFF"
      minWidth: 170px
```

## behavior

```yaml
submit:
  - Submit gọi composable/service-like action.
  - Query filter phải có thể giữ trên URL ở phase wire để pagination/sort không
    mất điều kiện.
clear:
  - Clear reset filter về default.
  - Clear điều hướng hoặc sync về route base của list nếu URL đang có query.
  - Clear không xoá dữ liệu list bằng local-only state; phải refresh qua service
    boundary.
```

## fieldGuidelines

```yaml
text: input compact, max width theo domain.
select: dùng select/combobox common, label rõ.
dateRange: label `期間`, separator `to`, không tách thành hai field rời rạc nếu
  legacy/domain đang hiểu là một khoảng.
```

## testIds

```yaml
searchForm: "{module}-search-form"
submitButton: "{module}-search-btn"
clearButton: "{module}-clear-btn"
fields: "{module}-{field}-input|select"
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
