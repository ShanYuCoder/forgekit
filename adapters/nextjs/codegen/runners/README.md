# Portal Gen

> **Doc chính:** [Portal codegen (gen + unit)](../../docs/operational/PORTAL-CODEGEN.md) — đọc trước khi quên thứ tự lệnh.

Generate 4-layer scaffold from feature `ir/design.yaml` (Handlebars) into **`src/`**. API/contract uses the same `ir/design.yaml`.

**Models:** `codegenkit gen` **không** sinh `models/`. Chạy `codegenkit contract-gen --spec .../ir/design.yaml` trước để có `@portal/models` (`packages/models/src/`).

## Usage

```bash
codegenkit contract-gen:dry --spec docs/features/yaml/.../ir/design.yaml
codegenkit contract-gen --spec docs/features/yaml/.../ir/design.yaml
codegenkit registry   # validate registries/design.registry.json
codegenkit gen --spec docs/features/yaml/admin/hotel/list/ir/design.yaml
codegenkit gen:dry --spec docs/features/.../ir/design.yaml
codegenkit gen --spec ... --force
```

## Design registry

**Source:** `registries/design.registry.json`  
**Docs:** `.cursor/extracts/portal-design-registry.md` · Rule: `.cursor/rules/portal-design-vocabulary.mdc`

- shadcn/ui = canonical (`#ui: AlertDialog`)
- List default shell: `#shell: DataListPage` (aliases: `DataListTable`, `common list`)
- `codegenkit gen` resolves shell → list template (`page.tsx.hbs` vs `page.custom.tsx.hbs`)
- Unknown `#ui:` / `#widget:` → dry-run fails

## Spec requirements

Copy `docs/templates/spec.yaml`. Required:

- `codegen.profile` — `list` \| `create` \| `auth` \| `change-password` \| `public` \| `not-found` \| `error`
- `codegen.entity`, `codegen.module`
- `codegen.namespace` (optional) — when `module` differs from admin entity paths (e.g. `chain-hotels` → files under `chain-hotel/`)
- `ui.routes`, `ui.columns` (list), `ui.filters` (optional)
- `api.endpoints` with `action: list` or `create`
- `tags` — see `.cursor/extracts/codegen/tags.md`

**Lifecycle:** Khi ghi `src/app/(dashboard)/**/page.tsx`, codegenkit gen cập nhật registry (`prototype`) + `pnpm portal:lifecycle sync`. Xóa: `pnpm portal:remove --spec <file>`. Doc: `docs/operational/PAGE-LIFECYCLE.md`.

## Output (Next.js)

- `src/app/(dashboard)/{route}/page.tsx` — list/create/change-password
- `src/app/(auth)/{route}/page.tsx` — login/forgot/reset (`profile: auth`)
- `src/app/(public)/{route}/page.tsx` — other public pages
- `src/app/not-found.tsx` / `src/app/error.tsx` — 404 / 503
- `src/hooks/{entity}/use{Entity}List.ts`
- `src/services/{entity}.service.ts`
- `src/mocks/{entity}.mock.ts`
- `src/validations/{entity}/schemas.ts` (create profile)
- `docs/features/{feature}/generated/HANDOFF.md` + `codegen.manifest.json`

## Templates

```
codegen/templates/
  list/       — DataListPage; wires cell slots when Mo* exists under src
  create/     — form scaffold (planned)
codegen/runners/lib/
  web-paths.mjs       — src path helpers
  design-registry.mjs — load registry, resolve shell, validate tags
```

`#needs-component` in spec → page placeholder + HANDOFF; implement in `/prototype`, then re-gen.

Stack: Node ESM + `yaml` + `handlebars`.
