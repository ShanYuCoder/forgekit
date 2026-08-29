# Common Breadcrumb Flow

Applies to all dashboard pages with sidebar navigation. Read in `/grill-bqa`, `/spec`, `/grill-docs`.

## Rule

Every page **must** show breadcrumb aligned with **left-menu parent → child** hierarchy and **in-page action navigation** (list → detail → edit → …).

Breadcrumb is **not optional** on admin/list/detail/edit/create flows.

## Hierarchy model

```text
Sidebar parent (menu group)
  → Sidebar child (menu item) OR list page
    → Action child page (detail, edit, create, settings, …)
      → Further nested step if spec defines it
```

### Example — hotel admin

```text
ホテル管理 (sidebar parent)
  → ホテル一覧 (list — menu child or list route)
    → Hotel detail (row action / view)
      → Hotel edit (action from detail)
```

Rendered breadcrumb (conceptual):

```text
ホテル管理 > ホテル一覧
ホテル管理 > ホテル一覧 > {hotel name}
ホテル管理 > ホテル一覧 > {hotel name} > 編集
```

Use **route labels from spec** (`ui.screens`, menu copy) — do not invent labels in code without spec.

## Mapping spec → breadcrumb

| Page type | Breadcrumb depth | Source in spec |
|-----------|------------------|----------------|
| List | Parent > List | Sidebar + `ui.routes` / page title |
| Create | Parent > List > Create | Toolbar create action label |
| Detail | Parent > List > Entity name | Row view action |
| Edit | Parent > List > Entity name > Edit | Detail edit action |
| Settings / sub-flow | Parent > List > … > Step | `ui.screens` action chain |

**Create** is not a sidebar child — breadcrumb goes through **list** (from toolbar action), same as legacy portal pattern.

## UI requirements

- Breadcrumb sits in page header area (dashboard layout), above or beside page title per common list/detail shell.
- Each segment except the last is a **link** back to that level (list → detail → edit: each prior segment navigates correctly).
- Last segment is current page (plain text, not link).
- Entity name segment uses display field from data (`name`, `title`) when on detail/edit.
- i18n: labels match sidebar / spec copy (JP admin terms when legacy applies).

## Grill BQA — questions

1. Sidebar parent label và child label (menu copy)?
2. Create page breadcrumb label (e.g. 新規作成)?
3. Detail/edit segment: entity field hiển thị (`name`, `code`)?
4. Sub-flows (crawl setting, import): chèn level nào?

## Grill Dev — notes

- `ui.routes` chain: list `/hotels`, detail `/hotels/[id]`, edit `/hotels/[id]/edit`.
- Breadcrumb data often from route meta + loaded entity; `#wire-only` if menu API deferred.
- Do not flatten menu hierarchy into flat titles.

## Related common specs

- ``docs/features/` stub · hubs`
- ``docs/features/` stub · hubs` (if present)
- `common-ui-spec.md` — flat design, header area

## Anti-patterns

- List page without breadcrumb when sidebar has parent group
- Detail/edit only showing page title, no trail
- Breadcrumb labels unrelated to sidebar menu
- Create as fake sidebar root — must go through list
