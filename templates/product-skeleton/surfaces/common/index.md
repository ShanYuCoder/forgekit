# Common (Code level)

Same tier as feature Code — **not** C4 Context/Container.

## Pilots (`code/`)

| Kind | Example |
|------|---------|
| UI only | [`UI-CMN-EMPTY-001`](./code/UI-CMN-EMPTY-001/) |
| API only | [`API-CMN-HEALTH-001`](./code/API-CMN-HEALTH-001/) |

## Migrated patterns (from portal `docs/common`)

| | |
|-|-|
| YAML | [`yaml/`](./yaml/) |
| MD | [`md/`](./md/) |

```bash
docskit render
docskit split -- <path>
```

## Patterns (UI / UX policy)

| | |
|-|-|
| [Breadcrumb flow](./patterns/breadcrumb-flow.md) | Admin nav breadcrumb |
| [Delete flow](./patterns/delete-flow.md) | Confirm / soft-delete patterns |
| [Common UI spec](./patterns/ui-spec.md) | Grill/common UI rules |

Integrations (BE marks): [`../shared/integrations/`](../shared/integrations/)
