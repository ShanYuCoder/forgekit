# Common confirm dialog

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn confirm dialog cho destructive/overwrite action, thay thế `window.confirm` trong prototype lâu dài.

## status

draft

## owner

portal-team

## principles

```yaml
- Không lạm dụng modal; chỉ dùng khi action destructive, irreversible, overwrite
  hoặc có side effect lớn.
- Dialog phẳng, border rõ, không gradient/shadow nặng.
- Non-destructive confirmation nên dùng inline confirmation hoặc disabled state
  nếu đủ rõ.
- Tránh tuyệt đối modal chồng modal; nếu modal đang mở thì action con phải xử lý
  trong cùng modal hoặc đóng modal hiện tại trước khi mở flow mới.
```

## terminology

```yaml
actionModal:
  definition: Dialog có button action hoặc close, chặn tương tác background.
  dismissal: Chỉ đóng khi user bấm confirm, cancel, close, hoặc flow kết thúc theo spec.
  interaction: User chỉ thao tác được trong modal trong lúc modal mở.
alertToast:
  definition: Thông báo nổi tự mất, không có confirm/cancel action.
  ownerSpec: common-feedback
```

## layout

```yaml
placement:
  default: center
  reason: Dialog có button hành động cần focus và xác nhận rõ, nên hiển thị modal
    giữa màn hình.
  topRightNotAllowedFor:
    - confirm delete
    - confirm overwrite
    - cancel/confirm action flow
  topRightBelongsTo: alert dialog không có action confirm/cancel trong `common-feedback`.
content:
  maxWidth: sm
  title: ngắn, rõ action
  description: mô tả object/impact
footer:
  alignment: right
  order:
    - cancel secondary/outline gray
    - confirm primary hoặc destructive
```

## copy

```yaml
deleteSingle: この要素を削除してよろしいですか？
deleteMultiple: これらのレコードを削除しますか？
overwriteImport: 重複するデータが存在し、それは上書きされます。続行しますか？
```

## testIds

```yaml
dialog: "{module}-{action}-dialog"
title: "{module}-{action}-dialog-title"
content: "{module}-{action}-dialog-content"
confirm: "{module}-{action}-confirm-btn"
cancel: "{module}-{action}-cancel-btn"
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
