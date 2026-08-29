# Common feedback and alerts

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn loading, empty, error, success feedback trong admin portal.

## status

draft

## owner

portal-team

## principles

```yaml
- Không lạm dụng modal/alert lớn; ưu tiên inline feedback gần nơi xảy ra action.
- Giao diện phẳng: border + background nhạt, không gradient/shadow.
- Feedback phải đến từ service/composable state, không chỉ đổi text local.
- Legacy dùng alert/dialog tùy hứng thì chỉ xem là evidence; project mới ưu tiên
  common placement.
```

## terminology

```yaml
inlineAlert:
  definition: Thông báo nằm trong page/block, không tự mất.
  dismissal: Giữ nguyên cho đến khi user có action khác như submit lại, clear,
    refresh hoặc đổi route.
  useFor:
    - lỗi validation/global form
    - lỗi tải dữ liệu page
    - cảnh báo cần user đọc trước khi thao tác tiếp
alertToast:
  definition: Thông báo nổi không có action confirm/cancel, tự biến mất sau timeout.
  defaultDuration: 5s
  stacking:
    topPlacement: alert mới xuất hiện phía dưới hoặc tại đầu stack, alert cũ được
      đẩy lên theo animation.
    bottomPlacement: không dùng mặc định; nếu override thì alert cũ bị đẩy xuống.
  useFor:
    - success sau mutation nhẹ
    - thông báo hệ thống không cần chặn thao tác
actionModal:
  definition: Dialog có button action hoặc close, chặn tương tác background cho
    đến khi user bấm confirm/cancel/close.
  ownerSpec: common-confirm-dialog
```

## placement

```yaml
defaultPageAlert:
  position: ngay dưới page title/page header
  surface: nền phẳng cùng content, border + background nhạt
  useFor:
    - lỗi tải dữ liệu page
    - success/error sau mutation khi user vẫn ở cùng page
    - cảnh báo điều kiện thao tác không destructive
contextualAlert:
  position: gần block phát sinh lỗi
  useFor:
    - table list error
    - form global error
    - import file error
alertDialog:
  useOnlyWhen:
    - page dài phải scroll và inline alert có thể khuất khỏi viewport
    - thông báo không cần confirm/cancel action
  placement: top-right of viewport/page
  avoid:
    - center modal cho alert thông thường không có action
    - bottom modal/toast kiểu legacy nếu không có lý do mới
  note: Nếu dialog có button hành động như confirm/delete/overwrite/cancel thì
    dùng `common-confirm-dialog` và hiển thị giữa màn hình.
```

## patterns

```yaml
loading:
  list: skeleton rows hoặc skeleton cards trong table body area
  form: disable submit và đổi label pending nếu cần
empty:
  list: empty state trong table body, không xóa toolbar/search
  copy: "{entity}が見つかりません。"
error:
  list: alert trên table body area
  formGlobal: alert trên form/card
  importFile: alert trên import card, giữ message cụ thể từ validation
success:
  mutation: inline success alert hoặc toast global, chọn một theo page; không dùng
    modal success.
```

## alertStyle

```yaml
error:
  border: destructive/30
  background: destructive/10
  text: destructive
success:
  border: success/30 hoặc primary/30
  background: success/10 hoặc primary/10
warning:
  border: warning/30
  background: warning/10
```

## testIds

```yaml
loading: "{module}-loading"
empty: "{module}-empty"
errorAlert: "{module}-error-alert"
successAlert: "{module}-success-alert"
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
