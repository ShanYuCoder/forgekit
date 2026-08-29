# Common form validation

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn vị trí, copy và state validation cho form admin portal.

## status

draft

## owner

portal-team

## fieldErrors

```yaml
position: ngay dưới field/input liên quan
style: text destructive, cỡ nhỏ, không dùng alert global cho lỗi field đơn lẻ
testId: "{module}-{field}-error"
```

## globalErrors

```yaml
position: trên form/card hoặc gần submit group
useFor:
  - lỗi file import
  - lỗi server không map được field
  - timeout/expired session của flow import/preview
testId: "{module}-error-alert"
```

## requiredMarker

```yaml
default: optional
whenUsed: dấu `*` đỏ cạnh label, không thêm text dài.
```

## pendingState

```yaml
submitDisabled: true
labelCanChange: true
fieldsDisabled: chỉ khi action cần lock form để tránh double submit
```

## copy

```yaml
source: Ưu tiên message Laravel ja/validation.php khi đã có legacy/API source.
language: Japanese UI copy.
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
