# Test phase — E2E lane (Playwright)

> **QA + Dev** — lane Playwright từ testcase YAML, **độc lập** unit lane ([UNIT-PHASE-DIAGRAM](./overview.md)).  
> Nằm trong [FULL-CYCLE-PIPELINE-DIAGRAM](./overview.md) phase **2a Tests**.  
> Hub: [Portal reference](https://github.com/raintr91/nuxt_4/blob/nuxt_v_3/docs/operational/PORTAL-CODEGEN.md) · Skills: `/test` · `/grill-test` · `testcase:gen`

Trạng thái codegen E2E (portal repo):

| PR | Tên | Trạng thái | Deliverable |
|----|-----|------------|-------------|
| **12** | `testcase:gen` | ✅ Done | PO + `*.spec.ts` từ `testcases/*.yaml`; pilot `chain/hotel` |
| **13a** | Semantic + axe registry | ✅ Done | `portal-e2e-test.registry.json`, `#e2e:*` bundles |
| **13b** | Flow partials | ⬜ Planned | delete, confirm dialog, CSV import (`#e2e:flow-*`) |

---

## E2E lane (flow chính)

Chỉ luồng testcase → Playwright — **không** gộp Vitest, **không** loop grill ↔ test săn 100%.

```mermaid
flowchart TD
  SPEC["ir/design.yaml testIds\n+ testcases"]
  GEN["pnpm portal:gen\ndata-testid on UI"]
  TCG["pnpm testcase:gen\nPO + *.spec.ts"]
  TEST["/test\ngap + green scoped"]
  VIT["pnpm test:e2e scoped"]
  GT["/grill-test\ntraceability audit"]
  LIFE["pnpm portal:lifecycle set … test"]
  DONE["E2E lane done"]

  SPEC --> GEN
  SPEC --> TCG
  GEN --> TEST
  TCG --> TEST
  TEST --> VIT
  VIT --> GT
  GT --> LIFE
  LIFE --> DONE

  GT -.->|thiếu PO/spec/file| TEST
```

| Bước | Ai | Việc |
|------|-----|------|
| Grill | BA/dev | `ui.testIds.required` + `patterns`; testcase mirror; `#e2e:*` khi cần semantic/axe |
| `portal:gen` | script | Emit `data-testid` trên page/shell |
| `testcase:gen` | script | Page Object + spec skeleton + semantic matchers |
| **`/test`** | dev + AI | Session/fixture gap, UI testId fix, scoped green |
| **`/grill-test`** | dev + AI | Matrix spec↔testcase↔PO↔spec — **audit**, không regen hàng loạt |
| Lifecycle | dev | `pnpm portal:lifecycle set {route} test` sau grill pass |

**`/grill-test` không loop** đến 100% coverage: pass → promote lifecycle; gap → bảng đề xuất; **chỉ** quay `/test` khi thiếu **file** hoặc testId trên UI.

Unit (`/unit`, `portal:unit-gen`) — pipeline khác, không thay E2E lane.

---

## Ba lớp assertion trong một spec E2E

Một file `tests/e2e/{module}/{id}.spec.ts` có thể gồm **functional** (bắt buộc) và **semantic/a11y** (bundle opt-in).

```mermaid
flowchart TB
  subgraph functional["Functional — testcase steps"]
    GOTO["goto / waitFor / fill / click"]
    NET["assertions.network\nwhenNetworkRequest"]
    UI["assertions.ui\nvisibility · newTabOpened"]
  end

  subgraph semantic["Semantic UI — registry bundles"]
    READY["semantic.ready\nwaitForSemanticUiReady"]
    L1["Level 1\nconsole · scroll · images · overflow"]
    L2["Layout\noverlap · table · grid"]
  end

  subgraph a11y["Accessibility — axe-core"]
    WCAG["toHaveNoA11yViolations"]
    PRE["presets: names · aria · media · document"]
  end

  functional --> READY
  READY --> L1
  L1 --> L2
  L2 --> WCAG
  WCAG --> PRE
```

| Lớp | Mục đích | Không thay thế |
|-----|----------|----------------|
| Functional | User flow, API mock, testId | Unit test logic |
| Semantic Level 1–2 | UI “render được nhưng vỡ” (overflow, table lệch) | Functional pass |
| Axe | WCAG A/AA, accessible names | Manual keyboard review |

Chi tiết matcher: [E2E-SEMANTIC-UI-ASSERTIONS](../5-testing/e2e-assertions.md) · extract: `.cursor/extracts/platform-e2e-semantic-tags.md`

---

## `testcase:gen` — contract lifecycle

```mermaid
flowchart TD
  TC["testcases/{id}.yaml"]
  SP["{parent}.spec.yaml\ncross-check testIds"]
  SREG["portal-e2e-test.registry.json\n#e2e:* bundles"]
  MREG["applyTestcaseMocks.ts\nsession + route mocks"]
  PLAN["semantic-plan.mjs\nmerge tags + assertions.semantic"]
  OUT["tests/e2e/pages/{module}/\n+ tests/e2e/{module}/{id}.spec.ts"]
  DRY["pnpm testcase:gen:dry"]
  WRT["pnpm testcase:gen [--force]"]
  SL["/test gap"]

  TC --> SP
  TC --> SREG
  TC --> MREG
  SREG --> PLAN
  TC --> PLAN
  SP --> DRY
  MREG --> DRY
  PLAN --> DRY
  DRY --> WRT
  WRT --> OUT
  OUT --> SL
```

| Input | Validate | Output |
|-------|----------|--------|
| `setup.session` | Handler trong `session.ts` | `applyTestcaseSession` |
| `setup.mocks[].response` | `tests/e2e/fixtures/{module}.ts` | `applyTestcaseMocks` |
| `testIds.required` | ⊆ `spec.ui.testIds.required` (warn) | PO methods |
| `steps` | `goto`, `waitFor`, `fill`, `click` | Generated steps |
| `assertions.network` | path + method | `whenNetworkRequest` |
| `assertions.ui` | visibility, `newTabOpened` | `expectTestIdVisible`, tab helper |
| `tags` `#e2e:*` | Bundle trong registry | `expect(...)` từ `semantic-ui` fixture |
| `assertions.semantic` | `ready`, `level1`, `layout`, `accessibility` | Union với bundle tags |
| `#skip-e2e-assert:*` | Matcher id | Loại khỏi union |

---

## `#e2e:*` — bundle resolution (PR13a) {#semantic-bundles}

```mermaid
flowchart TD
  TAGS["testcase tags:\n#e2e:semantic-list\n#e2e:a11y-wcag"]
  YAML["assertions.semantic:\nlevel1 · layout · accessibility"]
  SKIP["#skip-e2e-assert:*"]
  REG["portal-e2e-test.registry.json"]
  EXT["extends chain\nsemantic-list → semantic-smoke"]
  UNION["dedupe matchers"]
  CODE["semanticCodegenLines\nin spec.ts.hbs"]
  FIX["import from\nfixtures/semantic-ui.ts"]

  TAGS --> REG
  YAML --> UNION
  REG --> EXT
  EXT --> UNION
  SKIP -.->|remove| UNION
  UNION --> CODE
  CODE --> FIX
```

| Hashtag | Bundle | Matchers (tóm tắt) |
|---------|--------|-------------------|
| `#e2e:semantic-smoke` | Level 1 | `toHaveNoConsoleErrors`, `toHaveNoHorizontalScroll`, `toHaveNoBrokenImages` |
| `#e2e:semantic-list` | List page | smoke + overflow + table layout + overlap |
| `#e2e:semantic-form` | Form page | smoke + text overflow |
| `#e2e:a11y-wcag` | Axe WCAG | `toHaveNoA11yViolations` (scope `rootTestId`) |
| `#e2e:a11y-presets` | Axe presets | names, aria, media, document semantics |
| `#e2e:a11y-full` | Full | wcag + presets |

**Bắt buộc** khi có matcher semantic/axe: `assertions.semantic.ready.rootTestId`.

Grill gợi ý:

- Mọi list sau prototype: `#e2e:semantic-smoke` tối thiểu.
- List có table: `#e2e:semantic-list`.
- Promote lifecycle `test`: cân nhắc `#e2e:a11y-wcag`.

---

## Cấu trúc file trên disk

```mermaid
flowchart LR
  subgraph docs["base-docs Product Code /  {feature}/"]
    TCY["testcases/*.yaml\nsource of truth"]
    SPY["*.spec.yaml\nrequirements + testIds"]
  end

  subgraph shared["shared/"]
    E2EREG["portal-e2e-test.registry.json"]
  end

  subgraph tests["tests/e2e/"]
    PO["pages/{module}/*Page.ts"]
    SPEC["{module}/*.spec.ts"]
    FIX["fixtures/{module}.ts"]
    HELP["helpers/applyTestcaseMocks.ts\nhelpers/testcaseAssertions.ts"]
    SEM["fixtures/semantic-ui.ts\nhelpers/semantic-ui/*"]
  end

  TCY --> SPEC
  SPY --> SPEC
  E2EREG --> SPEC
  TCY --> PO
  FIX --> HELP
  SEM --> SPEC
```

Quy ước: `chain-hotel-list.yaml` → `tests/e2e/chain-hotels/chain-hotel-list.spec.ts` + `pages/chain-hotels/ChainHotelListPage.ts` (`module` từ `spec.ui.testIds.module` hoặc `codegen.module`).

---

## E2E modes (prototype vs wire)

```mermaid
flowchart LR
  TC["testcase YAML\nsame file"]
  PROTO["lifecycle ≠ wire"]
  WIRE["lifecycle = wire"]

  TC --> PROTO
  TC --> WIRE

  PROTO --> MOCK["setup.mocks\npage.route + fixtures"]
  WIRE --> REAL["remove list mocks\nreal API + session"]

  MOCK --> PLAY["playwright test"]
  REAL --> PLAY
```

Spec `#wire-only` trong feature spec → testcase giữ mock hoặc skip cho đến `/wire`.

---

## Đọc gì / không đọc gì (`/test`)

| Đọc | Không đọc |
|-----|-----------|
| `testcases/*.yaml`, spec `ui.testIds` | Legacy blade/repos |
| `portal-e2e-test.registry.json` khi có `#e2e:*` | `portal-unit-test.registry.json` |
| Prototype page + `Mo*` testId | Inventory toàn `tests/e2e/` |
| `test/readiness.md` | Rapi / recorder exports |
| 1 testcase vertical slice | `portal:unit-gen` trong session E2E |

---

## Lệnh mẫu

```bash
pnpm portal:e2e-registry
pnpm testcase:gen:dry --testcase base-docs Product Code /  chain/hotel/testcases/chain-hotel-list.yaml
pnpm testcase:gen --id <W-|TC-|suite>
pnpm testcase:gen --testcase ... --force

pnpm test:e2e tests/e2e/chain-hotels/
pnpm portal:lifecycle set /hotels test
```

---

## Gap loop

| Khi | Hành động |
|-----|-----------|
| `grill-test` / `grill-prototype` sai testId hoặc acceptance | → `/update-spec` |
| Thiếu bundle / matcher mới | → thêm `portal-e2e-test.registry.json` + `semantic-plan.mjs` |
| Sau patch | re-grill → tiếp tục `/test` |

[UPDATE-SPEC-FLOW](./quality-maintenance.md) · [E2E-TESTIDS](../5-testing/e2e-testids.md)

---

## PR13b (planned) — flow partials

```mermaid
flowchart LR
  COMMON["common-delete-flow\ncommon-confirm-dialog"]
  REG2["portal-e2e-test.registry.json\nflow.deleteSingle"]
  TC2["testcase extends:\nflow.deleteSingle"]
  GEN2["partials/flow-*.hbs"]
  SPEC2["confirmDialog steps\n+ result dialog assert"]

  COMMON --> REG2
  REG2 --> TC2
  TC2 --> GEN2
  GEN2 --> SPEC2
```

Chưa implement — hiện delete/confirm chỉ có spec design + `.test.yaml` draft.

---

## Liên kết

| Doc | Mục đích |
|-----|----------|
| [Portal reference](https://github.com/raintr91/nuxt_4/blob/nuxt_v_3/docs/operational/PORTAL-CODEGEN.md) | `testcase:gen` · `ui.testIds` · registry E2E |
| [Portal unit-gen roadmap](https://github.com/raintr91/nuxt_4/blob/nuxt_v_3/docs/operational/PORTAL-UNIT-GEN-ROADMAP.md) PR12–13 | Roadmap codegen E2E |
| [E2E-TESTIDS](../5-testing/e2e-testids.md) | Contract `data-testid` |
| `testgen/runners/README.md` | CLI + steps supported |
| `registries/e2e-test.registry.json` | Bundle + matcher registry |
| [E2E-SEMANTIC-UI-ASSERTIONS](../5-testing/e2e-assertions.md) | Matcher design + levels |
| `.cursor/extracts/platform-e2e-semantic-tags.md` | Hashtag cheat sheet |
| `.cursor/extracts/test/readiness.md` | Gate trước `/test` |
| `.cursor/skills/test/SKILL.md` | `/test` |
| `.cursor/skills/grill-test/SKILL.md` | `/grill-test` |
| [UNIT-PHASE-DIAGRAM](./overview.md) | Vitest lane (tách biệt) |
# Needs test flow

```mermaid
flowchart TD
  T["/test or /grill-test"] --> G{"Gap found?"}
  G -->|yes| N["Tag/issue: needs-test"]
  N --> U["/update-spec or testcase patch"]
  U --> R["pnpm testcase:gen (+ scoped e2e)"]
  R --> T
  G -->|no| D["Promote test lane done"]
```

## Khi nào dùng

- Thiếu testcase file hoặc testcase không cover acceptance quan trọng.
- Thiếu `data-testid` khiến PO/spec E2E không gen được ổn định.
- Mismatch spec ↔ testcase ↔ generated Playwright skeleton.

## Hành động chuẩn

1. Ghi rõ gap ở session `/grill-test` (không loop mù).
2. Patch spec/testcase qua `/update-spec`.
3. Re-gen scoped bằng `pnpm testcase:gen` và chạy `pnpm test:e2e` scoped.
4. Grill lại; pass thì chốt phase test.

## Liên kết

| Doc | Nội dung |
|-----|----------|
| [TEST-PHASE-DIAGRAM](./overview.md) | E2E lane chi tiết |
| [UPDATE-SPEC-FLOW](./quality-maintenance.md) | Gap loop chuẩn |
| [E2E-TESTIDS](../5-testing/e2e-testids.md) | Contract `data-testid` |
# Update spec flow

```mermaid
flowchart LR
  U["/update-spec\n/update-spec-legacy"] --> D["Delta matrix"]
  D --> T["Emit #update:* tags"]
  T --> R["specRevision++"]
  R --> N{"featureStatus\nwas wire?"}
  N -->|yes| NU["need-update"]
  N -->|no| K["keep status"]
  T --> TG["pnpm testcase:gen\nbump lastSynced.testcase"]
  T --> PG["pnpm portal:gen\nbump lastSynced.prototype"]
  TG --> W["/wire"]
  PG --> W
  W --> C["Clear #update:*\nfeatureStatus: wire\nwireCount++"]
```

## Tag reference

| Tag | Trigger |
|-----|---------|
| `#update:add-block:{id}` | New `ui.blocks[]` entry |
| `#update:modify-block:{id}` | Existing block changed |
| `#update:remove-block:{id}` | Block removed |
| `#update:api:{id}` | API contract delta |
| `#update:test:{id}` | Test scenario delta |

See `.cursor/extracts/spec-update-tags.md` and `spec-update-delta.md`.

## Liên kết (cùng phase)

| Doc | Nội dung |
|-----|----------|
| [TECH-DEBT-FLOW](./quality-maintenance.md) | `#tech-debt:*` — chưa chốt; khác `#update:*` |
| [DESIGN-PHASE-DIAGRAM](./overview.md) | Gap từ grill → `/update-spec` |
| [WIRE-PHASE-DIAGRAM](./overview.md) | Clear `#update:*` tại wire |

## Rules

- Spec remains source of truth — no rename-only mapping layers.
- Tags persist through testcase and prototype sync; cleared only at wire.
- No backward lifecycle states after wire.
# Tech debt flow

```mermaid
flowchart TD
  Q["qa/open/QA-<bundle.id>-NNNN.yaml\n#tech-debt:QA-…"] --> G["Grill /qa-resolve"]
  G --> R{"Resolved?"}
  R -->|yes| X["Delete qa/open file + tag"]
  R -->|no| D["Keep until member Confirm"]
  X --> U["Patch bundle or 01 then split"]
  D --> G
```

## Spec shape

**Không** `openQuestions` trên bundle. Treo:

```yaml
# qa/open/QA-cmp-adm-002-02-01-02-0001.yaml
id: QA-cmp-adm-002-02-01-02-0001
kind: tech-debt
target:
  path: product/surfaces/…/<slug>.bundle.yaml
question: |
  Full permission matrix?
```

Trên design/01: `#tech-debt:QA-cmp-adm-002-02-01-02-0001` — **cùng id** với file inbox. Đóng: `/qa-resolve QA-…` + solution.

## vs `#update:*`

| | `#tech-debt:QA-…` | `#update:*` |
|---|-------------------|-------------|
| Meaning | Chưa chốt — file `qa/open` | Delta đã Confirm |
| Cleared | `/qa-resolve` | `/update-spec` / wire |

## Grill

- `/grill-bqa` · `/grill-dev` · `/grill-docs` · `/grill-api-spec` — re-ask QA còn mở.
- Không invent field; Other chưa chốt → file QA.

## Liên kết

| Doc | Nội dung |
|-----|----------|
| [FEATURE-ARTIFACT-GRILL](../3-artifacts/grill-process.md) | AskQuestion + inbox |
| [UPDATE-SPEC-FLOW](./quality-maintenance.md) | `#update:*` sau khi chốt |
| [DESIGN-PHASE-DIAGRAM](./overview.md) | Gap loop |
