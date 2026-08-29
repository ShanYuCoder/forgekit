# Common buttons

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn button toàn admin portal để tránh chỗ chỉ text, chỗ icon + text không nhất quán.

## status

draft

## owner

portal-team

## principles

```yaml
- Button nghiệp vụ mặc định dùng icon + text.
- Nếu legacy thiếu icon, prototype chọn icon lucide hợp lý theo ý nghĩa action.
- Icon không được là placeholder; phải phản ánh action/status.
- Thiết kế phẳng: border/background rõ, không gradient, không shadow nặng.
- Tránh button chỉ màu mà không có text/icon đủ nghĩa.
```

## defaultPattern

```yaml
businessAction:
  content: icon + text
  iconPosition: left
  gap: 2
  examples:
    search:
      text: 検索
      icon: Search
    clear:
      text: クリア
      icon: RotateCcw hoặc X
    create:
      text: 新規作成
      icon: Plus
    save:
      text: 保存
      icon: Save
    update:
      text: 更新
      icon: Save
    edit:
      text: 編集
      icon: Edit
    duplicate:
      text: 複製
      icon: Copy
    import:
      text: インポート
      icon: Upload
    upload:
      text: アップロード
      icon: Upload
    download:
      text: ダウンロード
      icon: Download
    export:
      text: エクスポート
      icon: Download
    backToList:
      text: 一覧へ
      icon: List
    delete:
      text: 削除
      icon: Trash2
      variant: destructive
```

## exceptions

```yaml
tableAction:
  rule: icon-only
  reason: Cột action trong table cần compact và đã có aria-label/title theo
    `common-table-action-column`.
paginationPrevNext:
  rule: icon + text
  icons:
    previous: ChevronLeft
    next: ChevronRight
  text:
    previous: 前へ
    next: 次へ
  reason: Pagination cần dễ hiểu hơn cho admin user, giữ icon để nhận diện nhanh
    và text tiếng Nhật để rõ hành động.
iconUtility:
  rule: icon-only
  appliesTo:
    - close dialog
    - collapse sidebar
    - clear single chip
  requirement: bắt buộc có aria-label/title.
readonlyMetric:
  rule: text-only allowed
  examples:
    - 合計 {count}
  reason: Đây là indicator dạng button-style nhưng không phải action clickable.
```

## variants

```yaml
complete:
  useFor: primary/complete action
  background: "#48b0f7"
  text: "#ffffff"
outlinePrimary:
  useFor: search/secondary positive action
  border: "#4EAAFF"
  text: "#4EAAFF"
  background: "#FFFFFF"
outlineSecondary:
  useFor: clear/cancel/back neutral action
  border: "#C2C2C2"
  text: "#6B7280"
  background: "#FFFFFF"
destructive:
  useFor: delete/destructive action
  icon: Trash2
```

## accessibility

```yaml
- Button icon + text không cần aria-label riêng nếu text đủ rõ.
- Button icon-only bắt buộc có `aria-label` và `title`.
- Loading button giữ icon hoặc spinner bên trái, text vẫn mô tả action.
```

## testIds

```yaml
button: "{module}-{action}-btn"
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
