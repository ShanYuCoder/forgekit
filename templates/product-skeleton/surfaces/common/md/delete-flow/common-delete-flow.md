# Common delete flow

- **Testcase:** `#`
- **Screen:** `#`

Delete và bulk delete luôn dùng confirm dialog chặn + result dialog — không toast-only.

## status

draft

## owner

portal-team

## principles

```yaml
- Confirm trước delete — blocking modal, user phải chọn cancel hoặc confirm.
- Sau delete — success hoặc error đều qua result dialog blocking; user
  acknowledge trước khi tiếp tục.
- Không dùng toast/inline alert làm phản hồi duy nhất cho delete.
```

## references

```yaml
- docs/features/common/common-confirm-dialog.spec.yaml
- docs/features/common/common-feedback.spec.yaml
- .cursor/extracts/common-delete-flow.md
```

## flow

```yaml
- step: confirm
  ui: AlertDialog blocking
  copy: theo object (single / bulk)
- step: api
  onSuccess: result dialog success
  onError: result dialog error
```

## grill

```yaml
bqa: copy confirm, button labels, navigation sau delete
dev: endpoint, bulk vs single, wire-only nếu API chưa có
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
