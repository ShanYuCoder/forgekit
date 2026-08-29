# {{DOC_SKIT_AGENT_LABEL}} Workspace Rules — Docskit Physical Interlocks

> [!CRITICAL]
> Đây là **KHÓA VẬT LÝ (Physical Interlocks)**, không phải checklist nhắc nhở.
> Generated at `docskit init` for agent `{{DOC_SKIT_AGENT_ID}}` → `{{DOC_SKIT_AGENT_DIR}}/{{DOC_SKIT_OVERLAY_FILE}}`.
> Đồng bộ với `SSOT_AGENT_PROTOCOL.md`.
> Vi phạm bất kỳ đạo luật → run **FAILED**. Chat-only "done" = **KHÔNG ĐƯỢC CHẤP NHẬN**.
>
> **CẤM** dùng danh sách dưới đây như Verification Checklist thay cho TODO bóc từ `SKILL.md`.
> TODO **BẮT BUỘC** derive từ **Workflow + Accelerators** của skill đang chạy — không cố định, không copy-paste checklist tĩnh.

**Path SSOT:** `product/surfaces/<surface>/CMP-*/<slug>/` (không có `modules/`)  
**Task SSOT:** `TODO.md` ở thư mục root (không dùng `.agents/tasks/` làm SSOT)  
**Skill root:** `{{DOC_SKIT_AGENT_DIR}}/skills/<name>/SKILL.md`  
**Tools:** read=`{{DOC_SKIT_READ_TOOL}}` · write=`{{DOC_SKIT_WRITE_TOOL}}`

---

## ĐẠO LUẬT 1 — CRITICAL RULE FOR PRE-FLIGHT CHECK

Dù Thread mới hay cũ, ngay khi User yêu cầu chạy một skill/tính năng, hành động **ĐẦU TIÊN BẮT BUỘC** là dùng tool `{{DOC_SKIT_READ_TOOL}}` nhắm thẳng vào file `SKILL.md` của skill đó để nạp lại quy chuẩn.

**TUYỆT ĐỐI KHÔNG** / **CẤM TUYỆT ĐỐI** việc dựa vào trí nhớ mường tượng.

Chưa `{{DOC_SKIT_READ_TOOL}}` `SKILL.md` → **CẤM** mọi bước sau (TODO, plan, YAML, report).

---

## ĐẠO LUẬT 2 — CRITICAL RULE FOR TODO TRACKING (Anti Flat-Check)

Ngay sau Pref-light, Agent **BẮT BUỘC** tạo file:

`TODO.md` ở thư mục root (Ghi đè hoàn toàn nếu chuyển sang skill mới, cập nhật tiếp status nếu đang chat dở skill cũ)

**QUAN TRỌNG:**

- File TODO này **TUYỆT ĐỐI KHÔNG CHỈ** copy phần "Verification Checklist" ở cuối `SKILL.md`.
- Agent **BẮT BUỘC** bóc tách **toàn bộ** mục **Workflow** và **Accelerators** trong `SKILL.md` thành các gạch đầu dòng TODO (`- [ ]`).
- Làm xong bước nào → tool `{{DOC_SKIT_WRITE_TOOL}}` ghi đè file TODO đánh `[x]` + evidence (path / diff / CLI).
- **TUYỆT ĐỐI KHÔNG** gộp các bước. **TUYỆT ĐỐI KHÔNG** tick hàng loạt.
- **TUYỆT ĐỐI KHÔNG** in một bảng checklist cố định cho mọi skill rồi tuyên bố done.

Verification Checklist chỉ để map evidence **sau** — không phải nguồn sinh TODO.

---

## ĐẠO LUẬT 3 — CRITICAL RULE FOR EXECUTION (Plan trước khi write)

Trước khi sinh / ghi bất kỳ file YAML/Code/product nào, Agent **BẮT BUỘC** ghi file vật lý:

`TODO.md` (ở thư mục root)

Trong file `TODO.md` này, Agent **BẮT BUỘC** kết hợp cả TODO và Plan: trích dẫn **nguyên văn từng dòng** của Verification Checklist trong `SKILL.md` và viết kế hoạch thực thi chi tiết cho **từng** dòng.

Chỉ khi viết xong toàn bộ plan file → mới được quyền gọi `{{DOC_SKIT_WRITE_TOOL}}` cho product SSOT.

**TUYỆT ĐỐI KHÔNG** làm gộp. **TUYỆT ĐỐI KHÔNG** tạo thêm file plan rời (`*-plan.md`).

---

## ĐẠO LUẬT 4 — CRITICAL RULE — PHYSICAL OUTPUT IMMEDIATELY (No RAM Caching)

Bất cứ khi nào Agent sinh ra một kết quả bền, Agent **KHÔNG ĐƯỢC PHÉP** lưu giữ nó dưới dạng ngữ cảnh lơ lửng trong RAM.

**BẮT BUỘC PHẢI DÙNG TOOL `{{DOC_SKIT_WRITE_TOOL}}` GHI THẲNG THÀNH FILE VẬT LÝ NGAY LẬP TỨC.**

Output vật lý của bước trước = Input vật lý của bước sau.

**Ngoại lệ:** Đề xuất Grill chưa Confirm → hiển thị trên **Chat Thread**. Sau khi Member Confirm → update trực tiếp SSOT và **Artifact Registry**.

---

## ĐẠO LUẬT 5 — CRITICAL RULE FOR DATA ORIGIN (Zero Business Hallucination)

Agent chỉ được phép lấy dữ liệu điền Spec từ đúng **2 nguồn**:

1. Prompt của User
2. Lịch sử / evidence ArtifactGraph Registry

**TUYỆT ĐỐI KHÔNG** "tự suy nghĩ" hay tự bịa trường dữ liệu, validation, cột DB, flow, hoặc tag nghiệp vụ mới.

Thiếu thông tin → **BẮT BUỘC** để trống hoặc gắn `#missing_info` → `/grill`.

**CẤM thông minh đột xuất.**

---

## ĐẠO LUẬT 6 — CRITICAL RULE FOR GRILL PROCESS (Hard Confirmation Gate)

Khi rà lỗ hổng (`#missing_info`), Grill **BẮT BUỘC** 4 bước:

1. **Check lại ArtifactGraph** (nếu available) — Member khác có thể vừa cập nhật.
2. **Micro-scoping:** Chỉ Block/Field thiếu. **TUYỆT ĐỐI** sửa lan man phần đã chốt.
3. **Đề xuất** 1 hoặc nhiều phương án (chỉ định **Recommended**) trực tiếp trên **Chat Thread**. **TUYỆT ĐỐI KHÔNG** tạo file proposal vật lý.
4. **Hard Confirmation Gate:** Agent **TUYỆT ĐỐI KHÔNG** tự ý ghi đè đề xuất vào file product. Agent **BẮT BUỘC** dừng lại, đặt câu hỏi cho Member. Chỉ sau khi Member **chốt / Confirm** mới được ghi SSOT.

---

## ĐẠO LUẬT 7 — CRITICAL RULE FOR DSL REGISTRY (Human-Dictated)

Con người là thực thể **duy nhất** có quyền quyết định và cập nhật kho chuẩn mực DSL/Common.

Agent **KHÔNG CÓ QUYỀN** tự động phân tích và tự quyết định cái gì là "Common".

Agent chỉ là Thư ký — được đăng ký/cập nhật DSL/Common chỉ khi:

1. User chủ động gọi `/common` hoặc `/common-spec`.
2. User chủ động gọi `/docs-mark` để đánh tag/rule cần nhớ.
3. Sau `/grill` và User **BẤM DUYỆT (Confirm)**.

Ở `/spec` thông thường: chỉ **lôi DSL/common có sẵn ra dùng**.

**TUYỆT ĐỐI KHÔNG** tự ý ghi đè hay sáng tác thêm.

---

## Thứ tự khóa bắt buộc

```text
{{DOC_SKIT_READ_TOOL}} SKILL.md
  → {{DOC_SKIT_WRITE_TOOL}} TODO.md  (Workflow + Accelerators)
  → {{DOC_SKIT_WRITE_TOOL}} TODO.md  (quote Verification Checklist)
  → mỗi kết quả bền: {{DOC_SKIT_WRITE_TOOL}} NGAY (No RAM)
  → data: User | ArtifactGraph only; gap → #missing_info
  → grill: 4 bước + STOP chờ Confirm trước khi ghi SSOT
  → common/DSL: chỉ /common|/common-spec|/docs-mark|Confirm
```

## Isolation & fake reports

- **BẮT BUỘC** chạy **đúng một** skill User yêu cầu. **TUYỆT ĐỐI KHÔNG** merge sibling skills.
- **TUYỆT ĐỐI KHÔNG** xuất báo cáo Markdown ảo khi skill yêu cầu sửa YAML/bundle.

Full wording: `SSOT_AGENT_PROTOCOL.md` (cùng `{{DOC_SKIT_AGENT_DIR}}/`).
