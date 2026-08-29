# Common navigation and page header

- **Testcase:** `#`
- **Screen:** `#`

Chuẩn sidebar, page title, breadcrumb và route trong admin portal prototype.

## status

draft

## owner

portal-team

## sidebar

```yaml
behavior:
  - Parent menu click để open/close child.
  - Active child route mở parent tương ứng.
  - Prototype chỉ hiển thị feature đã migrate hoặc đang design.
routePrefix:
  legacyAdminPrefix: /admin
  portalRoute: không dùng `/admin` prefix trong frontend route.
testIds:
  navItem: nav-{id}
```

## pageHeader

```yaml
title:
  source: route meta hoặc component page header.
  testId: "{module}-page-title"
breadcrumb:
  default: optional trong prototype; nếu dùng phải có testId theo
    docs/operational/E2E-TESTIDS.md.
actions:
  - Header actions chỉ dùng cho page-level action thật sự.
  - Nếu legacy/spec yêu cầu group_action trong card/form thì không đưa action
    lên page header.
```

## dynamicRoutes

```yaml
detail: pages/{module}/[id]/index.vue
edit: pages/{module}/[id]/edit.vue
child: pages/{module}/[id]/{child}.vue
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
