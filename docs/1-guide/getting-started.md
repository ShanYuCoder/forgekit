# Start now

<div class="intro-grid">
<div class="intro-card intro-card--main">
<h3>Document Hub cung cấp</h3>
<ul>
<li>Khung <strong>arc42 đầy đủ từ Overview đến Module</strong>, ưu tiên cách diễn đạt gần với business: mục tiêu, phạm vi, actor, operational area, capability, constraint và quyết định.</li>
<li><strong>Architecture views</strong> cho nội dung kỹ thuật: business-process, data model/database, cross-service flow, integration và deployment.</li>
<li><strong>Function Detail</strong> cho hành vi chi tiết của màn hình và API contract: state, action, field, validation, error path và acceptance.</li>
<li>Quy trình vận hành thống nhất để xác định phạm vi, tạo artifact, review, bàn giao, triển khai và duy trì tài liệu.</li>
</ul>
</div>
<div class="intro-card intro-card--side">
<h3>Sau khi đọc, xác định được</h3>
<ol>
<li>Hệ thống phục vụ <strong>operational area</strong> và actor/persona nào?</li>
<li>Nội dung ở tầng <strong>Overview, Operational areas, Surfaces, Common, Modules, Functions hay Architecture/business-process</strong>?</li>
<li>Artifact cần tạo là <code>CMP-*</code>, <code>W-*</code>, <code>API-*</code>, <code>FLOW-*</code> hay <code>DEP-*</code>?</li>
<li>Ai review và điều kiện chuyển bước kế tiếp?</li>
</ol>
</div>
</div>

<div class="base-note"><span class="base-note-mark">(*)</span><em>Base cung cấp đầy đủ các tầng và artifact tham chiếu, nhưng team không bắt buộc phải triển khai toàn bộ. PM/Leader lựa chọn phạm vi phù hợp với quy mô team, giai đoạn và rủi ro của dự án; nội dung có thể được lược bỏ, thực hiện trước hoặc bổ sung sau. Ví dụ, ở giai đoạn đầu chỉ cần hoàn thiện Overview và một số business-process core đại diện cho nghiệp vụ chính, sau đó mở rộng theo nhu cầu thực tế.</em></div>

Chi tiết quy ước: [System doc structure](./system-doc-structure.md).

Pilot tham khảo: [FLOW-login](#). Màn hình sống dưới `product/surfaces/<surface>/CMP-*/<NN…>/` (bundle + `ir/` + `api/<seq>/`).

<div class="intro-hero">

![Các tầng tài liệu](#)

</div>

---

## 1. Mô hình tài liệu tổng thể

<div class="duo-grid">
<div class="duo-col">

### 1.1 Overview & Operational areas

Overview mô tả actor/persona, vùng vận hành, năng lực nghiệp vụ và kênh tương tác.

```mermaid
flowchart LR
  subgraph Areas["Operational areas"]
    Admin["Admin operations"]
    Workforce["Workforce operations"]
    Shopfloor["Shop-floor operations"]
    Plant["Plant integration"]
  end

  Admin --> AdminActor["Admin / Supervisor"]
  AdminActor --> Portal["Web Portal"]

  Workforce --> Employee["Nhân viên"]
  Employee --> WebLine["Web / Line Client"]

  Shopfloor --> Worker["Công nhân / Technician"]
  Worker --> HMI["HMI / Line Client"]

  Plant --> Device["PLC / MES / Device"]
  Device --> Gateway["Integration Gateway"]

  classDef area fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
  classDef actor fill:#D1FAE5,stroke:#047857,color:#064E3B
  classDef channel fill:#FEF3C7,stroke:#B45309,color:#78350F
  class Admin,Workforce,Shopfloor,Plant area
  class AdminActor,Employee,Worker,Device actor
  class Portal,WebLine,HMI,Gateway channel
```

`Admin`, `Nhân viên`, `Công nhân` là persona/actor trong một vùng vận hành. `Web Portal`, `Line Client`, `HMI`, `Gateway` là interaction channel, không phải API endpoint.

</div>
<div class="duo-col">

### 1.2 Architecture

Architecture mô tả business-process, dữ liệu, cross-service flow, integration và deployment.

```mermaid
flowchart TB
  BP["business-process · FLOW-*"] --> DATA["Data model / Database"]
  BP --> CROSS["Cross-service flows · Integrations"]
  DATA --> DEP["Deployment · DEP-*"]
  CROSS --> DEP

  classDef process fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
  classDef data fill:#D1FAE5,stroke:#047857,color:#064E3B
  classDef deploy fill:#F3E8FF,stroke:#7E22CE,color:#581C87
  class BP process
  class DATA,CROSS data
  class DEP deploy
```

</div>
</div>

---

## 2. Cây tài liệu theo nghiệp vụ

<div class="tree-overview-grid">
<div class="tree-overview-grid__tree">

```text
Overview
└─ Operational areas
   ├─ Admin operations
   ├─ Workforce operations
   ├─ Shop-floor operations
   └─ Plant integration

Surfaces
├─ Common?                         # DETAIL theo scope — chỉ hiện khi có
│  ├─ business-process · FLOW-*
│  ├─ Data model / Database
│  └─ Cross-service flows · Integrations
│
├─ Admin Web
│  ├─ Common?                      # DETAIL scope surface
│  │  ├─ business-process · FLOW-*
│  │  ├─ Data model / Database
│  │  └─ Cross-service flows
│  └─ Modules · CMP-*              # owner surface giữ SSOT
│     ├─ Common?                   # DETAIL scope module
│     │  ├─ business-process · FLOW-*
│     │  ├─ Data model / Database
│     │  └─ Cross-service flows
│     └─ Functions                 # nav label — folder = <function-slug>/
│        └─ <slug>/code/{W-*,API-*}
│
├─ Line Client / HMI               # cùng cấu trúc; link Module nếu không phải owner
└─ Integration / Gateway           # …

Architecture
├─ business-process · FLOW-*       # OVERVIEW flow chính, sơ sài
├─ Data model / Database
├─ Cross-service flows · Integrations
└─ Deployment · DEP-*
```

`Common?` là node **động**: hiện khi scope có artifact dùng chung. Architecture giữ overview `FLOW-*` chính; Common giữ detail theo scope. Function vật lý = leaf số dưới `CMP-*` (`bundle` + `ir/` + `api/<seq>/`).

</div>
<div class="tree-overview-grid__diagram">

```mermaid
flowchart TB
  O["Overview"]
  OA["Operational areas<br/>actor · persona · channel"]
  S["Surfaces<br/>Admin Web · Line/HMI · Gateway"]
  M["Modules · CMP-*"]
  F["Functions · <slug>"]
  W["ir/design.yaml"]
  A["api/<seq>/01"]
  CO["Common? DETAIL<br/>FLOW detail · Data · Cross-service"]
  Arch["Architecture OVERVIEW<br/>FLOW main · data · integrations · DEP"]

  O --> OA
  OA --> S
  S --> M
  M --> F
  F --> W
  F --> A
  S -. "scope: system / surface / module" .-> CO
  M -. "scope: module" .-> CO
  O -. "implemented by" .-> Arch
  F -. "served by architecture" .-> Arch

  classDef overview fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
  classDef surface fill:#CFFAFE,stroke:#0E7490,color:#164E63
  classDef product fill:#D1FAE5,stroke:#047857,color:#064E3B
  classDef detail fill:#FEF3C7,stroke:#B45309,color:#78350F
  classDef flow fill:#EDE9FE,stroke:#6D28D9,color:#4C1D95
  class O,OA overview
  class S surface
  class M product
  class F,W,A detail
  class CO,Arch flow
```

</div>
</div>

`Surface` là bề mặt tương tác (Admin Web, Line Client/HMI, Integration Gateway) — không đồng nghĩa với Operational area. Mỗi surface lặp lại cùng cấu trúc `Common? → Modules → Functions`.

Mỗi Module (`CMP-*`) có **một owner surface** và SSOT tại `product/surfaces/<owner-surface>/CMP-*`. Surface khác chỉ map/link, không copy. `FLOW-*`: Architecture = overview; Common = detail. Màn hình: `CMP-*/<NN…>/` (`*.bundle.yaml`, `ir/`, `api/<seq>/`).

---

## 3. Responsibility matrix

Vai trò được xác định theo trách nhiệm đối với thay đổi, không phụ thuộc hoàn toàn vào chức danh tổ chức. Một thành viên có thể đảm nhiệm nhiều vai trò; mỗi artifact vẫn phải có owner và reviewer rõ ràng.

| Vai trò | Phạm vi phụ trách | Artifact chính | Skill / công cụ |
|---------|-------------------|---------------|-----------------|
| **Solution Architect / Technical Lead** | System scope, operational areas, business-process, cross-system flow, deployment | `FLOW-*`, `DEP-*` | `/architecture`, `/overview`, `/business-process`, `/deployment` |
| **Product / Feature Owner** | Ranh giới và ownership của capability/module | `CMP-*` README + mapping area/module | `/module` |
| **Business Analyst** | Actor, business rule, acceptance, open question | Function requirement + grill | `/spec`, `/legacy /spec`, `/grill-bqa` |
| **Software Engineer** | Function detail, feasibility, contract | `ir/design.yaml`, `api/01`, `/grill-dev` | `/spec`, `/grill-dev`, `/update-spec`, `/api-spec` |
| **Quality Engineer** | Scenario, testcase và traceability | `SC-*`, `TC-*` tại `base-tests` | testcase lane |
| **Implementation / Codegen Owner** | Dry-run, generate, integration và verification | Source code tại FE/BE repo | repo-specific generator |

---

## 4. Quy trình vận hành dự án

```mermaid
flowchart LR
  P1["1 · Leader / PM<br/>Overview → Module"] --> P2["2 · Member<br/>Function Detail"]
  P2 --> P3["3 · Tester / QC<br/>Test Design"]
  P2 --> P4["4 · Developer<br/>FE + BE"]
  P3 --> P5["5 · Project Team<br/>Wire · Test · UAT · Handoff"]
  P4 --> P5
  P5 -. "requirement / behaviour changed" .-> P1
  P5 -. "function gap" .-> P2

  classDef lead fill:#DBEAFE,stroke:#1D4ED8,color:#1E3A8A
  classDef detail fill:#D1FAE5,stroke:#047857,color:#064E3B
  classDef test fill:#FEF3C7,stroke:#B45309,color:#78350F
  classDef dev fill:#EDE9FE,stroke:#6D28D9,color:#4C1D95
  classDef ship fill:#E2E8F0,stroke:#334155,color:#1E293B
  class P1 lead
  class P2 detail
  class P3 test
  class P4 dev
  class P5 ship
```

<section class="phase-card phase-card--lead">
<div class="phase-card__visual">
<img src="./assets/phase-1-lead-analysis.png" alt="PM và Technical Lead phân tích overview dự án" />
</div>
<div class="phase-card__body">

### 1. Leader / PM — Phân tích từ Overview đến Module

**Đầu vào:** yêu cầu dự án mới hoặc yêu cầu trên hệ thống legacy như maintain, refactor, migration và mở rộng chức năng.

- **Dự án mới:** dùng `/architecture` để route, sau đó `/overview`, `/business-process`, `/module`; bổ sung `/deployment`, `/decision` hoặc `/cross-cutting` khi có nội dung tương ứng.
- **Dự án legacy:** dùng modifier **`/legacy`** kèm skill tương ứng (ví dụ `/legacy /spec`). Phần kiến trúc mục tiêu vẫn đi qua `/architecture`.

<div class="phase-pills">
<span>business-process · scope · actor</span>
<span>Operational areas</span>
<span>Architecture</span>
<span>Database / data model</span>
<span>business-process · FLOW-*</span>
<span>Module boundaries · CMP-*</span>
</div>

**Kết quả:** business-process, scope và system boundary rõ; architecture/database được mô tả; capability được chia thành Module có owner, dependency và Function index.

</div>
</section>

<section class="phase-card phase-card--member phase-card--reverse">
<div class="phase-card__visual">
<img src="./assets/phase-2-function-analysis.png" alt="Member phân tích Function Detail của màn hình" />
</div>
<div class="phase-card__body">

### 2. Member — Phân tích Function / màn hình chi tiết

Member nhận Module và business-process đã được thống nhất, sau đó đặc tả từng Function thay vì mở rộng lại toàn bộ architecture.

<div class="phase-pills">
<span>Actor · precondition</span>
<span>Screen states · actions</span>
<span>Fields · validation</span>
<span>API contracts</span>
<span>Error / edge cases</span>
<span>Acceptance criteria</span>
</div>

- Function mới dùng `/spec`; Function từ hệ thống cũ dùng `/legacy /spec` (qua Forgekit).
- BA xác nhận business qua `/grill-bqa`; Engineer qua `/grill-dev` + `/api-spec`.
- Output: leaf `CMP-*/NN…/` (`ir/` + `api/<seq>/`). Câu treo: `qa/open/QA-…` rồi `/qa-resolve`.
- Đọc trên GitHub: `pnpm forge:render` rồi **`pnpm forge:publish`** (README → `CATALOG.md`).

**Kết quả:** Function Detail đủ rõ để Tester thiết kế testcase và Developer triển khai mà không phải suy đoán lại requirement.

</div>
</section>

<section class="phase-card phase-card--test">
<div class="phase-card__visual">
<img src="./assets/phase-3-test-design.png" alt="Tester và QC thiết kế scenario và testcase" />
</div>
<div class="phase-card__body">

### 3. Tester / QC — Thiết kế testcase tại `base-tests`

Tester nhận acceptance, `CMP-*`, `W-*`, `API-*` và `FLOW-*` từ docs hub; test plan được quản lý độc lập tại repo `base-tests`.

<div class="phase-pills">
<span>Map surface · CMP-* · W-*</span>
<span>Scenario · SC-*</span>
<span>Test case · TC-*</span>
<span>Suite / smoke set</span>
<span>Grill + cases:render</span>
<span>Handoff automation</span>
</div>

- `/testcase` tạo Scenario và Test case; `/grill-testcase` kiểm tra coverage, data, assertion và edge cases.
- `pnpm cases:render` sinh bản review từ test plan SSOT.
- Khi cần automation, FE repo đọc plan bằng `testcase:gen` và ghi Playwright vào `tests/e2e/`; file FE không thay thế plan trong `base-tests`.

**Kết quả:** test scope có traceability với Function/Flow và sẵn sàng cho automation, integration test và regression.

</div>
</section>

<section class="phase-card phase-card--dev phase-card--reverse">
<div class="phase-card__visual">
<img src="./assets/phase-4-development.png" alt="Developer triển khai frontend và backend theo contract" />
</div>
<div class="phase-card__body">

### 4. Developer — Triển khai FE + BE

Developer triển khai tại code repo tương ứng dựa trên Function Detail, API contract và testcase đã thống nhất.

<div class="phase-pills">
<span>FE scaffold / prototype</span>
<span>BE API / business logic</span>
<span>Contract parity</span>
<span>Unit + build checks</span>
<span class="phase-pill-more">…</span>
</div>

- **FE/client:** tạo route, UI component, state, validation, service/model và xử lý loading/empty/error.
- **BE/API:** triển khai request validation, controller/handler, service, model/repository và response/error contract.
- Kiểm tra field keys giữa FE/BE/client, chạy unit test, typecheck/build và cập nhật `/update-spec` nếu implementation buộc phải thay đổi behaviour.

**Kết quả:** từng phần chạy độc lập, tuân thủ contract và sẵn sàng kết nối end-to-end.

</div>
</section>

<section class="phase-card phase-card--ship">
<div class="phase-card__visual">
<img src="./assets/phase-5-wire-uat-handoff.png" alt="Nhóm dự án wire, kiểm thử, UAT và bàn giao" />
</div>
<div class="phase-card__body">

### 5. Project Team — Wire, Integration Test, UAT và bàn giao

Dev, QA, PM/Leader và stakeholder hợp nhất các đầu ra thành một luồng vận hành hoàn chỉnh.

<div class="phase-pills">
<span>Wire FE ↔ BE ↔ Client</span>
<span>Config / auth / environment</span>
<span>Integration + E2E</span>
<span>Regression</span>
<span>UAT</span>
<span>Review · merge · handoff</span>
</div>

- Wire theo contract, xử lý môi trường và dependency thực tế.
- Chạy integration/E2E/regression; gap quay lại Function Detail hoặc testcase tương ứng.
- Stakeholder thực hiện UAT theo acceptance; thay đổi behaviour phải cập nhật docs/spec trước khi đóng.
- Hoàn tất review, merge, release note, tài liệu vận hành và bàn giao ownership.

**Kết quả:** implementation, test evidence, UAT và documented behaviour thống nhất.

</div>
</section>

---

## 5. Trợ lý và công cụ

![Skill, ArtifactGraph và Docskit](#)

| Công cụ | Trách nhiệm |
|---------|-------------|
| **Skill `/…`** | Workflow theo đúng tầng và vai trò |
| **Forgekit (Bộ Docs)** | Phân tích Bundle YAML, render VitePress, sinh Markdown |
| **Forgekit (Bộ Code/Test)** | Sinh code UI/API và kịch bản Playwright E2E |
| **ArtifactGraph** | (Tích hợp trong Forgekit) Gap analysis, parity, tag và codegen allowlist |
| **VitePress + Mermaid** | Trình bày docs và diagrams |

Setup: [Kits (MCP)](./toolkits.md) — Sử dụng `forgekit init`.

---

## 6. Tra cứu nhanh

| Nhu cầu | Artifact | Skill | Technical home |
|---------|----------|-------|----------------|
| Overview / scope / actor | — | `/overview` | `product/overview/` |
| business-process overview | `FLOW-*` | `/business-process` | `architecture/03-business-process/` |
| business-process detail | `FLOW-*` | `/business-process` | Common theo scope |
| Module | `CMP-*` | `/module` | `product/surfaces/<owner-surface>/CMP-*/` |
| Screen leaf | `<NN…>` | `/spec` | `…/CMP-*/<NN…>/` |
| FE IR | — | Codegenkit `/prototype` | `…/ir/design.yaml` |
| API contract | — | `/api-spec` | `…/api/<seq>/01-backend-spec.yaml` |
| Deployment | `DEP-*` | `/deployment` | `architecture/07-deployment/` |

Đọc tiếp: [System doc structure](./system-doc-structure.md) · [Platform guide index](./).
