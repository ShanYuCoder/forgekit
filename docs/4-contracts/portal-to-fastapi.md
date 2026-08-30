# Contract portal ↔ fast-api-base

> Hub cho contract Portal ↔ Fast API. Naming SSOT: [CONTRACT-FIELD-REGISTRY](./field-registry.md).
> Repo split: [REPO-SPLIT-MAP](../6-reference/repo-split-map.md)

**Cập nhật:** 2026-07-09

---

## 1. Trạng thái từng mục (todo)

| Mục | Code / pilot | Doc / diagram | Ghi chú |
|-----|--------------|---------------|---------|
| **SSOT field keys** | ✅ `ir/design.yaml` (sau split) + pilots | [CONTRACT-FIELD-REGISTRY](./field-registry.md) | `kind: array` / relation — `contract:gen` cần registry đủ |
| **contract:gen → Zod** | ✅ `pnpm contract:gen` → `packages/models` | [BACKEND-CODEGEN](https://github.com/raintr91/lara12/blob/v3/docs/operational/BACKEND-CODEGEN.md) sub-lane Contract | HANDOFF: `{function}/generated/CONTRACT-HANDOFF.md` |
| **fast Pydantic / OpenAPI** | ✅ Pydantic stub modules; ⚠️ OpenAPI chỉ `contract-pilot` | [FastAPI structure git](https://github.com/raintr91/fast-api/blob/v3/docs/operational/FAST-API-STRUCTURE.md) · [FastAPI codegen git](https://github.com/raintr91/fast-api/blob/v3/docs/operational/FAST-CODEGEN.md) | `fast-gen openapi` → `backend/02-openapi.yaml` — chưa chạy cho `knowledge-hub` |
| **Envelope** | ✅ `api_response.success/error` ↔ `assertApiSuccess` + `parseApiData` | [FastAPI structure § Envelope](https://github.com/raintr91/fast-api/blob/v3/docs/operational/FAST-API-STRUCTURE.md) · [WIRE-PHASE-DIAGRAM](../2-lifecycle/overview.md) `/grill-api` | FE type gọn hơn BE (`code`, `trace_id` optional phía FE) |
| **List `{ items, total }`** | ✅ `PaginatedResult` + `SampleItemListResponseSchema` | Chưa E2E list qua fast (sample-items mock) | `meta.pagination` có helper `to_envelope_meta()` — dùng khi cần |
| **Auth cookie/header** | ⚠️ Stub: `auth_token` cookie → `Bearer` · fast `get_current_user` stub | [PAGE-LIFECYCLE](../7-architecture/page-lifecycle.md) `wire` | Chưa JWT thật / refresh — đủ cho pilot E2E |

---

## 2. Luồng contract (diagram)

```mermaid
flowchart TD
  IR["portal ir/design.yaml\nentities / bind"]
  CG["pnpm contract:gen"]
  ZOD["packages/models @portal/models"]
  BS["/fast-spec\nbackend/01-backend-spec.yaml"]
  OAS["fast-gen openapi\nbackend/02-openapi.yaml"]
  FG["/fast-code\nfast_gen write"]
  PY["fast Pydantic\nmodules/*/schemas"]
  WIRE["/wire\nservices → apiFetch"]
  GRILL["/grill-api\naudit keys + envelope"]

  IR --> CG --> ZOD
  IR --> BS
  BS --> OAS
  BS --> FG --> PY
  ZOD --> WIRE
  PY --> WIRE
  WIRE --> GRILL
```

| Phase | Doc diagram |
|-------|-------------|
| Contract Zod | [BACKEND-PHASE-DIAGRAM](../2-lifecycle/overview.md) sub-lane Contract |
| Fast backend | [FastAPI phase diagram git](https://github.com/raintr91/fast-api/blob/v3/docs/operational/FAST-BACKEND-PHASE-DIAGRAM.md) |
| Wire + audit | [WIRE-PHASE-DIAGRAM](../2-lifecycle/overview.md) |
| Full stack | [factory-ai-stack](../7-architecture/portal-architecture.md) |

---

## 3. Envelope (đã align pilot)

**Fast** (`src/app/common/http/api_response.py`):

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": { },
  "meta": null
}
```

**Portal** (`src/services/shared/api-response.ts`):

- `assertApiSuccess(res)` — `success === true`
- `parseApiData(schema, res.data)` — Zod parse `data`

Global prefix: **`/api`** — `NEXT_PUBLIC_API_URL` + `api-client.ts`.

---

## 4. List & pagination

| Shape | Fast | Portal Zod |
|-------|------|------------|
| Inline list | `data: { items, total }` | `*ListResponseSchema` (`items`, `total?`) |
| Meta pagination | `meta.pagination` via `PaginatedResult.to_envelope_meta()` | `ApiSuccess.meta` (optional) |

Search list pilot: `contract-pilot` / `sample-items` — FE schema có; wire list endpoint fast chưa E2E.

---

## 5. Auth (stub — chưa production)

| Tầng | Hiện tại |
|------|----------|
| Portal middleware | Cookie `auth_token` → redirect nếu thiếu (lifecycle `wire`) |
| `apiFetch` | `Authorization: Bearer <token>` từ cookie |
| Fast `Depends` | `get_current_user` — Bearer stub → `CurrentUser` |

Gate production: JWT issuer, refresh, `require_user` trên route nhạy cảm — **chưa** trong todo CONTRACT.

---

## 6. Hashtag / tech tags (spec)

| Tag | Doc | Ý nghĩa |
|-----|-----|---------|
| `#needs-component:*` | [NEEDS-COMPONENT-FLOW](../2-lifecycle/overview.md) | Thiếu Mo/Data* trước gen |
| `#wire-only:*` | NEEDS-COMPONENT-FLOW · knowledge-hub `#wire-only: network` | Prototype mock; thật ở `/wire` |
| `#shell:` · `#widget:` | [DESIGN-REGISTRY-PROMOTION](../3-artifacts/design-registry-promotion.md) | Design registry |

**Chưa có** tag chuẩn trong spec cho MES/CMMS/LLM — mô tả ở `factory-ai-stack` + fast `clients/` (xem §7).

---

## 7. Gọi dịch vụ bên thứ 3 (fast)

OT / external **không** gọi từ portal — chỉ **fast-api-base**:

| Client | Path | Trạng thái |
|--------|------|------------|
| MES | `src/app/clients/mes_client.py` | Stub + mock fallback |
| CMMS | `src/app/clients/cmms_client.py` | Stub |
| LLM / RAG | `src/app/clients/llm_client.py` | Stub |
| Integration gateway | `factory-ai-stack` § OT | Phase sau (`<integration-checkout>`) |

Env: `MES_BASE_URL`, `CMMS_BASE_URL`, … trong fast `.env.example`.

---

## 8. OpenAPI artifact

| Bước | Lệnh |
|------|------|
| Sau `01-backend-spec.yaml` | `Bộ Docs (Forgekit) openapi:gen --spec <docs>/…/api/<seq>/01-backend-spec.yaml` |
| Output | `backend/02-openapi.yaml` cạnh spec (portal yaml tree) |
| Pilot có file | `_example/contract-pilot/backend/02-openapi.yaml` |
| Pilot thiếu file | `factory/knowledge-hub` — **chưa** export |

Dùng sau cho line-base NSwag / audit contract — không bắt buộc cho wire pilot query-only.

---

## 9. Lệnh verify nhanh

```bash
# Envelope
curl -s http://127.0.0.1:4000/api/health | jq .

# Knowledge hub contract end-to-end
cd <portal-checkout> && pnpm test:e2e tests/e2e/factory/knowledge-hub.spec.ts

# Contract gen
pnpm contract:gen --spec `base-docs` Product Code (prefer `--id`)
```

---

## 10. Việc còn lại (production)

1. Auth JWT thật (portal + fast) — stub đủ pilot
2. `contract:gen` — `plant_id` nullable optional trên write schema (registry/template)
3. Cập nhật [BACKEND-PHASE-DIAGRAM](../2-lifecycle/overview.md) body Nest → fast
