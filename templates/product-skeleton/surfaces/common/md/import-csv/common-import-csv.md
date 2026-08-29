# Common CSV import flow

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn flow CSV upload, validate, preview, store và sample download.

## status

draft

## owner

portal-team

## routes

```yaml
upload: /{module}/import
validateApi: POST /{module}/import/validate
preview: /{module}/import/preview/{uuid}
storeApi: POST /{module}/import/store/{uuid}
```

## flow

```yaml
- Upload page tự render form bằng SPA, không dùng API init page.
- Validate API nhận file multipart, parse/validate và trả uuid/preview URL.
- Preview page đọc data từ cache/session import qua uuid.
- Store là mutation nên API mới dùng POST, dù legacy có thể dùng GET.
- Sample CSV là endpoint download rõ nghĩa.
```

## ui

### ui (other)

```yaml
uploadLayout:
  - Card phẳng, bên trái nếu legacy page là import nhỏ.
  - Field file có label rõ và accept đúng extension.
  - Button import primary/complete đứng trước sample download.
previewLayout:
  - Action group trên table: list link, total readonly, import confirm.
  - Duplicate old row marker `-`, màu `#FFECEB`.
  - New row marker `+`, màu `#DCFFF1`.
```

## errors

```yaml
invalidFile: hiển thị alert trên upload card.
expiredPreview: 操作がタイムアウトしたか、CSVファイルが無効です。再度お試しください。
```

## confirm

```yaml
duplicateOverwrite: dùng common confirm dialog với copy `重複するデータが存在し、それは上書きされます。続行しますか？`
```

## testIds

```yaml
fileInput: "{module}-csv-file-input"
uploadSubmit: "{module}-import-submit-btn"
sampleDownload: "{module}-sample-download-btn"
previewTable: "{module}-preview-table"
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
