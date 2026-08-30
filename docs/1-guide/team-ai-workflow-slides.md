# Feature Artifact Workflow

> **Slide vs operational doc:** Deck training này **cố ý giữ `/design`** làm tên phase “design lane”. Doc vận hành: [Toolchain index](..) · [`PROMPT-TEMPLATES.md`](../6-reference/prompt-templates.md): `/design` deprecated → **`/spec`** + **`/prototype`**.

---

## Agenda

0. Vì sao cần workflow mới
1. Mục tiêu: AI support team
2. Cách vận hành mới
3. Workflow phases
4. E2E automation và Platform Base
5. Kết luận

---

## 0. Vấn Đề Hiện Tại

Hiện tại nhiều dự án vẫn test chủ yếu bằng con người.

- Một số dự án thiếu spec, thiếu BA, hoặc thiếu tester so với nhu cầu.
- Requirement rời rạc, mỗi người hiểu một kiểu.
- Cùng công nghệ nhưng mỗi dự án code một kiểu.
- Unit test chưa phủ logic quan trọng.
- Chưa có E2E automation cho flow nghiệp vụ chính.
- Regression thủ công thường chỉ test chọn lọc theo phạm vi ảnh hưởng.
- Nếu đánh giá sai phạm vi ảnh hưởng, dễ thiếu case và degrade sau release.
- Chưa ứng dụng AI nhiều vào quy trình dự án.

Mục tiêu: ứng dụng AI để review sớm hơn, release ít rủi ro hơn, giảm manual regression, tăng automation test cho IT/release và khắc phục điểm yếu của team/member.

---

## 0.1 Ý Tưởng Cốt Lõi

Không đổi input của team quá nhiều.

```text
Requirement thô
  ↓
AI hỗ trợ chuẩn hóa
  ↓
Prototype + user story Markdown + spec/testcase có cấu trúc
  ↓
Human review
  ↓
E2E/unit/API/wire
  ↓
Release có safety net
```

Thông điệp: AI support, human review.

---

## 0.2 Tham Khảo Tư Duy

- Harness workflow: mỗi session làm đúng một command.
- Progressive disclosure: chỉ load context cần thiết.
- Early feedback: có prototype sớm để review trên màn hình chạy được.
- Docs as code: tài liệu có version, review, build được như code.

Delivery ngoài phase như Excel/Docx vẫn có thể export riêng nếu team cần.

---

## 1. Mục Tiêu: AI Support Team

AI không thay member.

AI là trợ lý cho cả team từ phân tích yêu cầu đến release:

- cải thiện tốc độ
- nâng cao chất lượng
- nâng cao năng lực member
- giảm việc lặp lại, chậm, dễ thiếu sót

Con người vẫn review, chỉnh sửa, quyết định.

---

## 1.1 AI Phục Vụ Con Người

Không phải: con người phải viết spec thật chuẩn để phục vụ AI.

Mục tiêu là ngược lại:

- Có requirement gạch đầu dòng: AI giúp chuẩn hóa.
- Có ảnh/copy text/code legacy: AI giúp tổng hợp.
- Chưa có BA/spec đầy đủ: AI dựng bản nháp để team review.
- Testcase AI làm được 70% tốt hơn hiện tại cũng đã có giá trị.

Câu chốt: AI phục vụ con người, không phải con người phục vụ AI.

---

## 1.2 Input Gần Như Không Đổi

Team vẫn có thể bắt đầu bằng:

- bullet requirement
- Markdown thụt dòng cơ bản
- một câu nói ngắn
- ảnh màn hình hoặc nội dung copy
- chức năng từ dự án khác
- code legacy cần đọc lại behavior

Điểm đổi nằm ở output kỹ thuật, không phải bắt member viết đầu vào phức tạp hơn.

---

## 1.3 Output Được Chuẩn Hóa

Output mới:

- prototype chạy được
- user story Markdown cho người review
- spec/testcase có cấu trúc cho AI/dev
- E2E/unit/API/wire có input rõ hơn

Không bắt member viết YAML.

AI sinh YAML. Member chủ yếu review Markdown và prototype.

Xem thêm: [YAML/Markdown workflow](./ai-workflow.md).

---

## 1.4 Vì Sao Không Dừng Ở Excel?

Excel/Docx vẫn có thể là deliverable khi team hoặc khách hàng cần.

Nhưng với spec/testcase kỹ thuật, Markdown/YAML phù hợp hơn cho quy trình mới:

- Markdown là tầng tài liệu cao hơn, dễ đọc như user story/spec hiện đại.
- Nhiều team đang chuyển tài liệu kỹ thuật sang Markdown/docs site.
- Docx/Excel phù hợp hơn cho tài liệu end-user hoặc template bàn giao riêng.
- AI common thường không xuất Excel chuẩn theo template nội bộ ngay.
- Từ Markdown/YAML xuất ra Excel dễ và chuẩn hơn là từ Excel viết ngược lại Markdown/testcase kỹ thuật.

Member có thể tự thêm bước export Excel bằng công cụ, AI cá nhân, script, hoặc con người.

Điểm quan trọng: thay đổi này không phải để phục vụ AI. Nó phục vụ bước sau lớn hơn: E2E automation chạy tốt hơn, chuẩn hơn, ít thiếu case hơn.

---

## 2. Cách Vận Hành Mới

Luồng mới:

```text
/design
  prototype + user story Markdown + testcase round 1

/grill-with-docs
  soi spec đã gen, hỏi gap, update YAML/docs

/grill-prototype
  soi prototype trước khi chạy/demo

/test
  refine testcase + Playwright E2E

/api + /wire + /unit
  backend, integration, unit logic

/grill-api + /grill-test + /grill-unit
  check completeness sau từng phase
```

YAML là lớp kỹ thuật bên dưới. Markdown là bản review cho người.

---

## 2.1 Prototype + User Story Markdown

Thay đổi lớn nhất: review màn hình chạy được sớm hơn.

Trước đây:

- đọc spec Excel
- nhìn wireframe/hình
- tự hình dung behavior

Mới:

- AI dựng prototype bằng component thật
- user story Markdown sinh kèm
- BA/QA/Dev review trực tiếp flow

Xem thêm: [Platform Base overview](#).

---

## 2.2 Spec/Testcase Có Cấu Trúc

Spec và testcase không phải để “phục vụ AI”.

Chúng phục vụ phase sau:

- model/API hiểu entity rõ hơn
- E2E có steps và expected result rõ hơn
- QA trace testcase với requirement tốt hơn
- release giảm thiếu case do viết test muộn

Chi tiết định dạng: [YAML/Markdown workflow](./ai-workflow.md).

---

## 2.3 E2E Là Lợi Ích Lớn Cho QA

Mục tiêu: giảm regression thủ công khi release.

- Flow chính chạy tự động trên browser thật.
- CI/CD có thể chạy toàn project.
- Trace/screenshot giúp debug khi fail.
- QA tập trung thiết kế case mới thay vì retest lặp lại.

Không thay QA. E2E giúp QA đỡ bị kéo vào regression muộn.

Xem thêm: [E2E automation details](../5-testing/e2e-automation-playwright.md).

---

## 3. Workflow Phases

Các command chính:

- `/design`: prototype + user story + spec/testcase round 1
- `/grill-with-docs`: hỏi sâu để soi spec đã gen, chốt gap và update docs
- `/grill-prototype`: soi prototype trước khi chạy/demo, check spec fit, UI states, action thật, mock API boundary
- `/grill-api`: sau `/api`, check đủ endpoint/contract/permission/error để wire
- `/grill-test`: sau `/test`, check đủ E2E flow/action/state/testId
- `/grill-unit`: sau `/unit`, check coverage scoped/100% target và behavior gaps
- `/model`: Zod schema + TypeScript types trong `models/`
- `/test`: refine testcase + Playwright E2E
- `/api`: backend API ở repo backend
- `/wire`: thay mock bằng API thật
- `/unit`: Vitest cho logic nhỏ

Một session chỉ nên theo một command.

Mặc định output docs/spec/testcase/handoff bằng tiếng Việt; giữ nguyên key contract, route, API field, code identifier.

Khi cần đọc legacy checkout, agent dùng path user cung cấp hoặc
`legacy-repos.local.json` machine-local; không suy đoán sibling path. Xem
[`PROJECT-MAPS`](../6-reference/repo-split-map.md).

Nếu legacy là Laravel Blade/HTML cũ: route GET render page chỉ là evidence. Chuyển sang API backend + SPA frontend, không sinh API init page như `GET /auth/login` hoặc `GET /{entity}/create`; edit/copy dùng detail API lấy old data.

---

## 3.1 Phase Design

Mục tiêu: early feedback.

Input:

- requirement thô
- ảnh/code legacy nếu có
- component base hiện có

Output:

- prototype chạy được
- user story Markdown
- `spec.yaml`
- testcase round 1
- `data-testid` từ đầu

Example prompt:

```text
/design tạo chức năng blog quản lý bài viết:
- có danh sách bài viết
- tạo bài viết
- validate title required
- mock data đủ empty/loading/error/long text
```

---

## 3.1.1 Design: Thay Đổi

Không còn flow chính:

```text
Wireframe → Excel/Google Sheet → Dev tự hình dung UI
```

Flow mới:

```text
Input thô → AI prototype → Markdown/spec/testcase → Team review
```

Review chuyển từ “đọc và tưởng tượng” sang “trải nghiệm và góp ý”.

---

## 3.1.2 Design: Trở Ngại

Trở ngại thật:

- Prototype cần có nhanh.
- Member quen Excel/Google Sheet hơn Markdown.
- Lúc đầu sẽ chưa quen review theo flow mới.
- AI có thể sai pattern nếu thiếu rule/skill.

Khắc phục:

- dùng component base, Storybook, shadcn
- dùng skill/rule theo command
- giữ Markdown là bản review chính
- con người review trước khi chốt

---

## 3.1.3 Design: Lợi Ích

Lợi ích dễ thấy:

- Có màn hình chạy được sớm.
- Feedback đến trước khi dev thật quá xa.
- Mock data có empty/loading/error/long text.
- Testcase round 1 được sinh ngay.
- E2E có `data-testid` từ đầu.

AI không thay design review. AI giúp có bản nháp nhanh để review tốt hơn.

---

## 3.1.4 Mock API Phải Gần API Thật

Mock không chỉ để nhìn cho đẹp.

Mock nên gần contract thật:

- Detail page dùng `getXxxDetail(id)`.
- Edit form dùng lại detail API để fill initial data.
- Duplicate dùng detail API rồi reset field tạo mới.
- Block/tab độc lập thì tách API riêng.

Ví dụ dashboard:

```text
GET /dashboard/summary
GET /dashboard/users
GET /dashboard/stats
```

---

## 3.2 Phase Implement: Testcase/E2E

Mục tiêu: biến testcase thành safety net.

Thay đổi:

- Testcase kỹ thuật dùng YAML làm source.
- Member/QA review generated Markdown.
- AI/dev sinh Playwright E2E từ testcase đã review.

Không bắt QA viết code E2E từ đầu. AI hỗ trợ draft, QA review logic và case.

Example prompt:

```text
/test làm mịn testcase blog:
- bổ sung empty state
- title quá dài
- duplicate slug
- permission denied
- kiểm tra table layout level2
```

---

## 3.2.1 Testcase/E2E: Trở Ngại

Trở ngại:

- QA quen Excel testcase cũ.
- Markdown/YAML là mẫu tài liệu mới.
- Cần mô tả rõ precondition, data, steps, expected.
- E2E cần selector/test data ổn định.

Khắc phục:

- AI convert requirement thành testcase draft.
- QA review Markdown trước.
- Dev/AI bổ sung `data-testid`.
- Playwright trace giúp debug khi fail.

---

## 3.2.2 Testcase/E2E: Lợi Ích

Lợi ích cho QA:

- Giảm retest regression thủ công.
- Cover flow chính toàn project, không chỉ khoanh vùng.
- Bắt lỗi tích hợp trước release.
- Có report/trace khi test fail.
- QA có thêm thời gian nghĩ case tốt hơn.

Đây là lợi ích lớn nhất của workflow mới.

---

## 3.3 Phase Backend/API

`/api` làm ở repo backend riêng.

Input:

- spec đã review
- testcase để hiểu expected behavior

Output:

- endpoint thật
- validation backend
- response contract
- backend tests nếu repo backend yêu cầu

Portal chỉ giữ vai trò cung cấp spec/testcase đã thống nhất.

Example prompt:

```text
/api implement blog API trong repo backend:
- list/search blog
- create blog
- validate title required
- validate slug unique
```

---

## 3.4 Phase Integration

`/wire` thay mock bằng API thật.

Việc chính:

- tạo/update `models/`
- viết service/composable thật
- bỏ mock khỏi production path
- giữ E2E green

Nguyên tắc: page/component không gọi API trực tiếp.

Example prompt:

```text
/wire blog thay mock bằng API thật:
- tạo service/composable thật
- dùng model đã có
- giữ E2E green
```

---

## 3.5 Phase Unit Test

`/unit` dùng cho logic nhỏ, chạy nhanh.

Nên test:

- validation schema
- payload builder
- service parser
- composable state
- store action
- pure helper

Unit test bắt edge nhỏ. E2E giữ flow chính.

Example prompt:

```text
/unit bổ sung Vitest cho blog validation schema và service parser
```

---

## 4. Platform Base Support Gì?

Platform Base là nền để AI gen nhanh hơn và ít lệch pattern hơn.

- Nuxt 4 auth-first portal
- shadcn-vue + molecules + organisms
- 4 tầng: page → composable → service/store → model/validation
- Storybook để xem component
- VitePress để review docs
- Playwright + semantic UI helpers

Xem thêm: [Platform Base overview](#).

---

## 4.1 Lệnh Làm Việc Với AI

Member chỉ cần nhớ các lệnh ngắn:

- `/design`: kiểm tra/cập nhật spec, testcase nháp, docs, dựng prototype thật
- `/grill-with-docs`: phân tích spec đã gen, hỏi gap, update YAML/docs/ADR
- `/grill-prototype`: grill prototype trước khi run/demo
- `/grill-api`: check API đã đủ trước `/wire`
- `/grill-test`: check E2E flow/action/state sau `/test`
- `/grill-unit`: check coverage/behavior gap sau `/unit`
- `/legacy /spec`: Platform DNA modifier + Docskit `/spec` — đọc code cũ để viết lại spec/testcase
- `/model`: model schemas/types trong `models/`
- `/test`: testcase/E2E
- `/api`: backend repo
- `/wire`: nối API thật, bỏ mock
- `/unit`: Vitest

Trong `/design`: UI thật, actions thật, logic thật; chỉ mock response data ở API boundary.

Prototype route bỏ auth/guest/rbac middleware thật, không redirect `/auth/login?redirect=...`, không gọi login/logout/me/backend thật; user/session/permission thì mock.

Page list/table/search/filter ưu tiên `DataListPage` organism, không dựng lại shell table/search nếu component đã tương thích.

List có pagination phải mock đủ ít nhất 2 page. Grill UI check cả text/copy, icon, và vị trí trái/phải/trên/dưới của action/filter/pagination/dialog.

Legacy Blade/HTML phải được chuyển đổi sang SPA/API contract mới, không bê nguyên flow server-render.

Dynamic detail/edit route dùng `pages/{module}/[id]/index.vue` và `pages/{module}/[id]/edit.vue`, không tạo `pages/{module}/[id].vue`.

Phase `/design` không chạy full E2E/unit. Nếu cần thì chỉ code smoke skeleton cho happy path, luồng chính, validation message và để `/test`/`/unit` hoàn thiện sau.

`/test` và `/unit` làm theo vertical slice: một behavior/scenario quan trọng → test tối thiểu → chạy scoped → behavior tiếp theo; mock ở boundary, không bám implementation detail.

Mục tiêu: gõ đúng lệnh → load đúng context, giảm token, giảm lạc phase.

---

## 5. Kết Luận

Không đổi để phục vụ AI.

Đổi để AI phục vụ team tốt hơn:

- input thô vẫn dùng được
- prototype có sớm hơn
- spec/testcase rõ hơn
- E2E giảm regression thủ công
- con người review và quyết định

Thông điệp cuối: AI support, human review, automation protects release.

---

