# Common status chip

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn chip/tag trạng thái cho table, form detail và summary block.

## status

draft

## owner

portal-team

## principles

```yaml
- Status không để text trần nếu cần người dùng nhận biết nhanh.
- Màu phải có ý nghĩa trạng thái, không dùng để trang trí.
- Chip luôn có text label, không chỉ dùng màu để đảm bảo accessibility.
```

## tones

```yaml
success:
  useFor:
    - active
    - sent
    - valid
    - connected
  color: green
danger:
  useFor:
    - inactive
    - failed
    - error
    - disconnected
  color: red
warning:
  useFor:
    - pending
    - sending
    - attention
  color: amber
info:
  useFor:
    - draft
    - system
    - informational
  color: blue
muted:
  useFor:
    - disabled
    - unknown
    - none
  color: gray
```

## layout

```yaml
shape: rounded-full hoặc rounded-md nhỏ, phẳng, border nhẹ.
size: compact table chip, không làm row cao.
maxTextLength: 12-16 ký tự; text dài dùng truncate-tooltip.
```

## testIds

```yaml
chip: "{module}-{field}-chip"
rowChip: "{module}-{field}-{id}-chip"
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
