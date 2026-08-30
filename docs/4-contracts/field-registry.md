# Contract field registry

SSOT for `pnpm contract:gen` — Zod contracts in `@portal/models` + ORM-agnostic `*.relationships.meta.ts`.

Hub: [TEAM-AI-BACKEND-WORKFLOW](../2-lifecycle/backend-workflow.md) · Registry: `registries/contract-field.registry.json`

---

## Vị trí trong spec

Author trong `ir/design.yaml` (sau `/grill-dev` + split):

```yaml
entities:
  - name: Hotel
    table: hotels
    fields:
      - key: id
        kind: scalar
        type: integer
        scopes: [response, persistence]
        readOnly: true

      - key: chain_id
        kind: fk
        type: integer
        target: Chain
        scopes: [persistence, be]
        readOnly: true
        persistence:
          type: belongsTo
          fkField: chain_id
          orm: typeorm   # or prisma

      - key: name
        kind: scalar
        type: string
        scopes: [form, response, persistence]

      - key: managers
        kind: relation
        cardinality: many
        target: User
        scopes: [response]
        persistence:
          type: hasMany
          orm: typeorm
        contract:
          read:
            includeOn: [list, detail]
            embed: [id, full_name]
          write:
            mode: syncIds
            includeOn: [create, update]
```

`relationships: []` ở root — **derived** khi split/grill (không author tay song song).

---

## `kind`

| kind | Zod layer | ORM meta |
|------|-----------|----------|
| `scalar` | read/write schema | column |
| `fk` | thường ẩn FE (`scopes: be`) | belongsTo FK |
| `relation` | nested read + optional write payload | hasMany / belongsToMany / hasOne |

---

## `scopes`

| scope | Sinh vào |
|-------|---------|
| `form` | `*WriteSchema` |
| `response` | `*ReadSchema` |
| `persistence` | relationships.meta + nest ORM gen |
| `be` | hidden fields (chain_id, audit) |

---

## Infer khi thiếu `entities` (fallback)

`contract:gen` đọc `ui.columns` — relation columns (`managers`, `type: relation`) → `kind: relation`.  
Dev-grill nên materialize `entities[].fields` trước gate.

---

## Output

| File | Consumer |
|------|----------|
| `packages/models/src/{entity}/*.read.schema.ts` | FE parse, Nest Query response |
| `packages/models/src/{entity}/*.write.schema.ts` | FE form, Nest Command + `ZodValidationPipe` |
| `packages/models/src/{entity}/*.relationships.meta.ts` | `nest:gen` TypeORM/Prisma + `BaseWriteHandler.syncRelation` |

`portal:gen` **không** sinh `models/` — chạy `contract:gen` trước.
