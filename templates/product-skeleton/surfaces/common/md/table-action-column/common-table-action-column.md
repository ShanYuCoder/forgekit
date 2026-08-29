# Common table action column

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn cột action trong table list: icon-only, fixed width, accessible và không làm row phình.

## status

draft

## owner

portal-team

## layout

```yaml
headerText: アクション hoặc blank nếu table quá hẹp nhưng phải có aria context.
width: fixed theo số action, không auto co text.
alignment: right hoặc center tùy table; mặc định right cho admin list.
overflow: nowrap
```

## actions

```yaml
iconOnly: true
requiredAttrs:
  - data-testid
  - aria-label
  - title
order:
  - view/detail
  - edit/settings
  - duplicate/copy
  - delete/destructive
```

## variants

```yaml
view:
  variant: ghost hoặc outline
  icon: Eye
settings:
  variant: outline
  icon: Settings
loginAs:
  variant: info hoặc outline
  icon: LogIn
  note: Nếu có nhiều user login-as, dùng pattern riêng thay vì nhồi text dài vào
    action column.
delete:
  variant: destructive-ghost
  icon: Trash2
```

## permissions

```yaml
hiddenWhenNotAllowed: true
disabledWhenPending: true
disabledNeedsTooltip: true nếu người dùng cần biết lý do
```

## testIds

```yaml
actionButton: "{module}-{action}-{id}"
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
