---
name: spec
extractBundle: spec-requirement
description: EXCLUSIVE /spec — ONLY for authoring design bundle (feature.bundle.yaml). DO NOT trigger for grill or testcase skills.
disable-model-invocation: true
---

> [!CRITICAL] MANDATORY AGENT INSTRUCTION BEFORE EXECUTION
> - Physical interlocks: `AGENTS.md` + `SSOT_AGENT_PROTOCOL.md` (Đạo luật 1–7). Chat-only done = FAILED.
> - ĐẠO LUẬT 1: First action **BẮT BUỘC** `{{DOC_SKIT_READ_TOOL}}` this entire `SKILL.md`. **TUYỆT ĐỐI KHÔNG** dựa trí nhớ.
> - ĐẠO LUẬT 2: **BẮT BUỘC** `TODO.md` ở root bóc **toàn bộ Workflow + Accelerators** → `- [ ]`. **TUYỆT ĐỐI KHÔNG** chỉ copy Verification Checklist. **TUYỆT ĐỐI KHÔNG** gộp/tick hàng loạt.
> - ĐẠO LUẬT 3–4: **BẮT BUỘC** gộp plan vào `TODO.md` (quote nguyên văn từng dòng Verification Checklist) trước khi write bundle; mọi kết quả bền ghi disk **NGAY** (No RAM).
> - ĐẠO LUẬT 5: Data lấy từ User prompt | ArtifactGraph. **BẮT BUỘC brainstorm bổ sung text business (bối cảnh bài toán, input, output, mô tả chức năng màn hình theo ngôn ngữ business) cho đội Non-tech hiểu.** Core rules thiếu: AskQuestion, hoặc treo `qa/open/QA-<page-id>-NNNN` + `#missing_info QA-…`.
> - ĐẠO LUẬT 6–7: Grill Confirm trước khi vá gap; common/DSL chỉ `/common`|`/common-spec`|`/docs-mark`|Confirm — `/spec` chỉ consume.
> - You MUST follow ALL Workflow steps below; verify via harness TODO evidence, not a static AGENTS checklist.

# /spec — Function detail (design)

**Mindset:** Author a **complete** bundle from the template when information exists. Fill a **dynamic** `design.sections[]` tree for that page (any `kind` / depth; `visual` + `tags`/`extract`) and `design.nav` when the page has sidebar/breadcrumb. Leaf controls in `items[]`. Matching `spec.ui.list` | `ui.form` | `ui.detail`. Do **not** copy a login (or any) sample as the default layout. `/grill-*` only re-check, fill gaps, or fix conflicts.

**Business layer:** Function (screen `W-*` / API `API-*` inside a module)  
**Standards:** **C4 only** — do **not** open new arc42 chapters for one screen.

**Extracts:** `extractBundle: spec-requirement` → `.cursor/extracts/extract-registry.json`

> [!CRITICAL] TEMPLATE REQUIREMENT
> You MUST read the template `.docskit/templates/feature.bundle.yaml` and rules `.docskit/templates/bundle-authoring.md` BEFORE generating any spec.
> If these files are missing, you MUST STOP immediately and report an error to the user: "Template missing. Please run `docskit init` to generate templates." DO NOT attempt to guess the format or generate the YAML without them.

## Load policy

**Write** the **entire** `*.bundle.yaml` (authoring SSOT). After split exists, **re-read the entire `ir/design.yaml`** (and `ir/spec.yaml` for prose) — do **not** open the bundle only to skim `design.sections` / `spec.ui` keys. Do not Read generated `*.md`.

Tree: [`platform/guide/SYSTEM-DOC-STRUCTURE.md`](../../../platform/guide/SYSTEM-DOC-STRUCTURE.md) · [Start now](../../../platform/guide/start-now.md)

## Scope

**In:** Code bundle / `--id` under `product/surfaces/.../CMP-*/<slug>`, `pnpm docs:split`, `pnpm docs:render` (design MD only), harness notes.

**Out:** E2E plans → **`base-tests` `/testcase`**. UI → `/prototype` after grill-docs. product/overview / CTR → `product/architecture` children.

## Target / ID Resolution Rule

- User prompt MAY specify a screen ID, module ID, slug (e.g. `CMP-ADM-000`, `W-AD-AUTH-001`, `login`), or Draft ID (e.g., `1-1`, `2-1-1`).
- If a Draft ID is provided, Agent MUST split it into numeric segments (e.g., `1-1-1` -> `01/01/01/`) to resolve the exact numeric target folder.
- Agent MUST use `docskit_route` or `docskit_get_element` (or glob search) to resolve the exact target folder under `product/surfaces/.../CMP-*/<numeric-path>/`.
- Do NOT force the user to provide the full filesystem surface/module path if an ID, Draft ID or short slug is given.

## Workflow

0. Create/update `TODO.md` ở root (all steps below + Accelerator if/else items + plan).
1. Confirm **module (`CMP-*`) exists**, its operational-area mapping is known, and the implementing `CTR-*` is identified — otherwise stop for lead/owner.
2. If bundle exists, verify gaps: actors, fields, validations, routes, actions, edge cases, acceptance. API contracts live in **`api/<seq>/01`** (`/api-spec`), not `spec.api`. Unknown facts → AskQuestion (Other chưa chốt → `qa-inbox.md`; đóng sau **`/qa-resolve`**); do not invent.
3. If new, draft from user bullets. **CRITICAL: BẮT BUỘC brainstorm 2 mảng: (1) Mặt Business cho Stakeholder (Chuẩn Arc42: Mục tiêu nghiệp vụ, Các bên liên quan, Kịch bản người dùng - bằng ngôn ngữ đời thường 100% Non-tech); (2) Mặt Kỹ thuật cho Dev/QA (Bắt buộc định nghĩa Field Validations, State Machine, UI Permissions, Edge Cases). TUYỆT ĐỐI KHÔNG viết các khối text chung chung ở ngoài (vd: "Field Validations: Username...", "State Machine: ..."). BẮT BUỘC map mọi rule/validation vào chính xác item tương ứng thông qua các thuộc tính `validation`, `messages`, `states` (disabledWhen, visibleWhen, etc.), `action` (onSuccess, onCommonError, onSpecificError) trong `design.sections[]`.** Map every visible control into nested `design.sections[]` (or flat `zones[]`) and `spec.ui.list|form|detail` (widget required). App pages: `design.nav.sidebar.levels` + breadcrumb. Phân vân: **AskQuestion** (Recommended + **Other**) rồi **STOP**. Picks A/B/Other-with-text → ghi field thật. Other **chưa chốt** → `qa-inbox.md` (sau **`/qa-resolve`**). Summary đủ **key**; câu ngắn = member review. API endpoints → `/api-spec` `01`, không `spec.api`.
   - **Draft ID Mapping:** Nếu có Draft ID (`1-1-1`, `2-1-2`), padding số 0 vào từng đốt (`01-01-01`, `02-01-02`).
   - **Bundle ID:** Lắp tiền tố của module cha với các đốt vừa pad (vd: Module `CMP-ADM-002` + `02-01-02` -> `page-id: cmp-adm-002-02-01-02`). Split ghi `page-id` lên `ir/spec.yaml`.
   - **Numeric Folder Path:** Cấu trúc thư mục BẮT BUỘC phản ánh chính xác các đốt số, KHÔNG ĐƯỢC chứa text. Draft ID có 3 đốt (vd `2-1-2`) thì sinh đúng 3 cấp thư mục: `02/01/02/`.
   - **Bundle Name:** File `.bundle.yaml` BẮT BUỘC phải mang tên chức năng (textual slug), vd: `login.bundle.yaml`. Do đó path cuối cùng sẽ là: `product/surfaces/<surface>/CMP-*/02/01/02/login.bundle.yaml`.
   - **Textual Info:** Tất cả các mô tả (cluster-name, submodule-name, function-name) phải được ghi vào các trường YAML (title, name, summary, sidebar, breadcrumb), KHÔNG đưa vào đường dẫn vật lý. Create this `*.bundle.yaml` with `specOrigin: requirement`. Do NOT write Markdown.
4. Incremental blocks per extracts when needed.
5. Apply **existing** common UI / spec-split extracts (consume only — do not invent or overwrite common SSOT; promote via `/common-spec` or confirmed grill).
6. `pnpm docs:split -- <bundle>` (emits `ir/*`). `pnpm docs:render` writes **`ir/generated/spec.md` only**. VitePress/publish menu: module MD uses **Mã tài liệu**; function folder is `NN + <page-id>` → that spec.md (no handoff/generate/API extra items).
7. Update `.harness/progress.md` when present; keep harness TODO in sync (`[x]` + evidence).
8. Handoff plans: open **base-tests** → `/testcase` from acceptance.

## Output

- `spec` / `design` only (see `bundle-authoring.md`)
- **Không** author `TC-*` / `*.test.yaml` here (R3)

## Rules

- **UI Metrics / Design System Policy:** DO NOT invent or explicitly declare low-level CSS properties (font-size, exact hex colors, padding, margin, border-radius) in feature specs. Assume these are governed globally by the common Design System (e.g., Tailwind/Shadcn base). Only declare `visual` properties if there is a specific, exceptional override requested by the spec.
- Do not edit FE production code or Playwright.
- Do not run `portal:gen` / `testcase:gen`.
- Vague spec → `/grill-bqa` before `/prototype`.

### Common Pattern Resolution (MANDATORY)
Before authoring a new Spec, you MUST:
1. Scan **upward** from the function folder: nearest `common/yaml/` then module `common/yaml/`, then `product/surfaces/<surface>/common/yaml/`, then `product/surfaces/common/yaml/` (see `.cursor/extracts/common-scope.md`). **Consume only** — do not create/overwrite common here.
2. Read `templates/shared/patterns/*.pattern.yaml` to identify which `commonSpecs` are associated with each pattern.
3. From the prompt (structural cues only — not invented business fields), propose appropriate pattern tags:
   - Screen has >8 columns → suggest `#split-hook:columns`
   - Screen has >3 filters → suggest `#split-hook:filters`
   - Screen has export/download → suggest `#split-hook:export`
   - Complex form (>6 fields) → suggest `#split-hook:form-sections`
   - **Proactive Component Splitting:** If the screen contains >= 2 **domain** structural blocks (card of *this* feature, not a generic Dialog), suggest `#needs-component: MoBlockName` for each. **Do not** tag shadcn primitives (`Button`, `Dialog`, `Table`, `FieldGroup`, `Sidebar`, …) as `#needs-component` — those are `#ui: AlertDialog` (design registry) and installed on the FE repo via the [shadcn/ui skill](https://ui.shadcn.com/docs/skills) (`shadcn add` / `shadcn search`). `#needs-component` = composite `Mo*` the generator cannot emit.
   - **Deeply Nested Structure (Global Store):** If the screen contains deeply nested UI blocks ($\ge 3$ levels deep), suggest `#use-store` to extract local state into a Pinia/Zustand store.
   - **Absolute Rule for Forms:** Whenever a form is present (Create, Edit, Modal, etc.), it MUST be extracted. Codegenkit auto-extracts it, so ensure the spec defines `ui.form` properly and DO NOT merge form layout into the page shell.
   - Screen has a delete button → `#pattern: delete-flow`
   - Screen is a list/table → `#pattern: CRUD` + `common-list-page`, `common-pagination`
   - Contains confirm/overwrite actions → reference `common-confirm-dialog`
4. Inject references into the `design.patterns` of the bundle.yaml:
   ```yaml
   design:
     inherits: admin-crud
     patterns:
       - "#pattern: CRUD"
       - "#pattern: delete-flow"
   ```

- **STRICT API REUSE & `#reuse-api`:** Walk up `common/yaml/` (module/cluster first) and sibling `api/<seq>/`. If a **page action/item** calls an existing 01, set `tags: ["#reuse-api"]` and `reuseFrom` on that action/item. Do **not** author `bundle.spec.api`.
- **EXPLICIT ACTION SUFFIX URIs:** All API endpoints MUST use explicit action suffixes (`/create`, `/{id}/update`, `/{id}/duplicate`, `/{id}/delete`, `/{id}/detail`, `/list`). Never use ambiguous RESTful paths without action suffixes.
- **MANDATORY UI & API ERROR HANDLING SPECIFICATION:**
  - **UI Actions (`design.yaml`):** Agent MUST specify 3 execution outcomes for EVERY user action / API call: `onSuccess` (feedback, navigation), `onCommonError` (inherit `#ui-common:error-handler` or explicit `override: true`), and `onSpecificError` (inline `422` validation, `404` empty state, `403 IDOR` safety block, `409` conflict copy).
  - **API Contract (`spec.yaml`):** MUST apply Endpoint Error Storming Matrix using `#err:*` tags. Detail/Update/Delete routes with `{id}` MUST have `#err:not-found` & `#err:idor-violation`. Form Submits MUST have `#err:validation` rules.
- **CRITICAL:** Output MUST be a `.bundle.yaml` file. Do NOT generate Markdown (`.md`) files by hand. Markdown is generated by `pnpm docs:split` / `docskit split` (and `docs:render`) from the bundle.
- **STRICT YAML ESCAPING:** ALL string properties (e.g. `summary`, `label`, `review.layoutNotes`) containing colon (`:`), brackets (`[]`), or leading symbols MUST be quoted with double quotes (`"..."`) or written using YAML multiline block scalars (`|`). Never leave unquoted colons inside string values.
- If a custom template/layout is required, specify the template name in the bundle YAML's `template` field (e.g., `template: breadcrumb-flow`). Do not edit the generated Markdown output directly.

## Modifiers (If /legacy is used)
Khi người dùng gọi `... /legacy /spec`, Agent PHẢI:
- Đọc source từ `legacy-repos.local.json` thay vì source hiện tại.
- Trích xuất function logic từ source code cũ.
- Viết/cập nhật `product/legacy-dynamics/{module}/_legacy.dynamics.yaml` (`portal-legacy-dynamics/v1`).
- Viết `*.bundle.yaml` cho function đó vào `product/surfaces/<surface>/CMP-*/<slug>/` với `specOrigin: legacy`.
- **Không** tạo codegen tags. Hỗ trợ chạy validate: `legacy_dynamics_validate` / `pnpm legacy-dynamics:validate`.

## Tools (required after docskit init)

Prefer MCP/CLI when Docskit is installed:

- `docskit_bundle_split` / `docskit split -- <bundle>`
- `docs_render` / `docskit render …`
- Local fallback only if package not installed: `pnpm docs:split` · `pnpm docs:render`

## Accelerators (optional)

```text
if Docskit available: resolve CMP/CTR/FLOW IDs → paths
else: repository conventions / search (local fallback)

if ArtifactGraph available: tags/parity slice for touched contracts
else: model review from scoped bundle evidence (model fallback)
```

Missing optionals never block `/spec`. After the existing fallback completes,
emit exactly one `docskit.missing-optional` event per `runId` + optional
against `.cursor/schemas/docskit/missing-optional-event.schema.json`.
Deduplicate retries and report only actual `fileReads` / `contextBytes`.

## Done

- Design bundle coherent · split + docs:render pass · plans handoff → `/testcase` on tests hub.

## Verification Checklist
- [ ] Harness TODO + plan written under `TODO.md` ở root and kept in sync with evidence.
- [ ] Strict adherence to scope boundaries and module CMP mapping (`product/surfaces/<surface>/CMP-*/<slug>/`).
- [ ] Brainstormed business text (context, input, output). Missing **keys** filled or deferred as `qa/open/QA-<page-id>-NNNN` + `#missing_info QA-…`. Short prose is member review, not a QA file.
- [ ] Screen inventory complete when info exists: nested `design.sections[]` (kind/visual/tags) or `zones[].items[]`, plus `spec.ui.list|form|detail`. App pages include `design.nav` sidebar/breadcrumb when a left menu exists.
- [ ] Common/DSL only consumed (not invented); output MUST be a `.bundle.yaml` (Do NOT write `.md` directly).
- [ ] **YAML Syntax Check:** All strings with colons (`:`) or brackets (`[]`) are double-quoted (`"..."`) or block-escaped (`|`).
- [ ] Executed `docskit split` / `pnpm docs:split` (IR + spec MD) with zero parse errors.
- [ ] Handed off testcase plans to `base-tests` `/testcase`.


