# Unit test registry promotion

**Sau khi pilot `portal:unit-gen` ổn** trên feature đầu — promote pattern trong `registries/unit-test.registry.json` để grill/`/unit` gap và gen lần sau không lặp HANDOFF thừa.

**Registry:** `registries/unit-test.registry.json`  
**Validate:** `pnpm portal:unit-registry`  
**Agent extract:** FE checkout unit-test extracts (not vendored into docs hub)

---

## Phân vai theo phase

| Phase | Việc với unit layer thiếu |
|-------|---------------------------|
| `/grill-with-docs` | Optional `#gen:test-schema`, `#gen:test-service` (list); create profile thêm `#gen:test-validation` |
| `/prototype` + `portal:unit-gen` | Gen file từ pattern `implemented`; gap → `UNIT-HANDOFF.md` + `#needs-unit-test:*` |
| `/unit` | Chỉ gap — không gen lại common baselines |
| `/wire` | `portal:unit-gen --phase wire` → `service.wire.test.ts` |

---

## Khi nào promote pattern

| Điều kiện | Hành động |
|-----------|-----------|
| Pattern dùng lại ở feature thứ 2 cùng profile | `status: implemented` (nếu còn `planned`) |
| Pilot file vitest pass + template ổn | Ghi feature vào `promotedFeatures[]` |
| Composable mock boundary rõ (service / `apiFetch`) | Promote `composable.useList` / `useForm` |
| Export / create endpoint tách file | Giữ pattern `service.exportReport` / `service.create` — không gộp vào search test |

## Khi nào **không** promote

| Trường hợp | Ví dụ |
|------------|--------|
| Domain-only assertion | Login-as handoff, export filename legacy |
| `#wire-only:` / `#manual-composable:` | Giữ HANDOFF; wire phase mới assert sâu hơn |
| Một lần, không tái sử dụng | `#skip-unit-test:` hoặc test tay trong feature folder |

---

## Checklist promote (cuối pilot feature)

1. [ ] `pnpm portal:unit-gen --spec …` + `pnpm exec vitest run` trên file gen — pass
2. [ ] `registries/unit-test.registry.json`:
   - Pattern `status: implemented`, `template` + `output` đúng
   - `promotedFeatures[]` thêm slug feature (vd `chain-hotel-list`)
3. [ ] `pnpm portal:unit-registry` — exit 0
4. [ ] Grill spec **mới** (list): default `#gen:test-schema`, `#gen:test-service` khi chưa có tag unit
5. [ ] (Optional) `pnpm portal:unit-gen --spec … --write-spec-tags` merge `#needs-unit-test:*` từ manifest vào spec — **opt-in**

---

## `promotedFeatures[]` (audit)

| Feature | Patterns pilot | Ghi chú |
|---------|----------------|---------|
| `chain-hotel-list` | schema, service search, service export, composable useList | E2E pilot `testcase:gen` tách pipeline PR12 |

---

## Ai làm

| Bước | Owner |
|------|--------|
| Pilot + vitest pass | Dev / agent `/prototype` |
| Registry + doc | Cùng PR prototype hoặc PR promote riêng |
| Grill default tags | `/grill-dev` extract |
