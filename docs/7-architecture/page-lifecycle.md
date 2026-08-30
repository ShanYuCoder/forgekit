# Page lifecycle registry

Nguồn máy đọc: `registries/page-lifecycle.registry.json`.

**Tự cập nhật:** `portal:gen` → `prototype`; `portal:remove` → `design-spec`; `pnpm portal:lifecycle sync` quét manifest + page trên disk.

## Bước chính (không ghi sub-step)

| Stage | Ý nghĩa | Auth trên dev |
|-------|---------|---------------|
| `design-spec` | Spec/testcase có; chưa có prototype code | bypass |
| `prototype` | UI + mock API (`portal:gen`) | bypass |
| `test` | E2E/unit pass (vẫn mock API) | bypass |
| `wire` | Ghép API thật xong | **required** |

**Quy tắc:** `stage` = bước cao nhất đã đạt. Sửa spec / re-grill không tự hạ stage. `portal:remove` hoặc `lifecycle sync` (page mất) hạ về `design-spec`.

```bash
pnpm portal:lifecycle sync
pnpm portal:lifecycle set /hotels test
pnpm portal:remove --spec base-docs Product Code /  .../feature.spec.yaml
```

## Routes

| Path | Stage | Auth | Spec | Title | Updated |
|------|-------|------|------|-------|---------|
| /admin/chains | prototype | bypass | `base-docs` Product Code (prefer `--id`) | Quản lý chain admin | 2026-07-08 |
| /admin/chains/create | prototype | bypass | `base-docs` Product Code (prefer `--id`) | Tạo / cập nhật chain admin | 2026-07-08 |
| /admin/hotels | design-spec | bypass | `base-docs` Product Code (prefer `--id`) | Admin hotel list | 2026-06-27 |
| /hotels | test | bypass | `base-docs` Product Code (prefer `--id`) | Chain — danh sách hotel (施設一覧) | 2026-07-08 |

## Liên quan

- Auth bypass: mọi stage **trừ** `wire` — `middleware/auth.global.ts`
- Xóa code: `pnpm portal:remove --spec <file>`
- Session handoff: `.harness/progress.md`
