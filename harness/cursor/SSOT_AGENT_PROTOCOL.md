# SSOT Agent Protocol — Physical Interlocks (Docskit)

> [!CRITICAL]
> Đây là **KHÓA VẬT LÝ**, không phải lời nhắc.
> Vi phạm bất kỳ đạo luật nào → run **FAILED**. Chat-only "done" = **KHÔNG ĐƯỢC CHẤP NHẬN**.
>
> Tracker SSOT: `TODO.md` ở thư mục root (không dùng `.agents/tasks/` làm SSOT).
> Path SSOT: `product/surfaces/<surface>/CMP-*/<slug>/` (không có segment `modules/`).

---

## ĐẠO LUẬT 1 — CRITICAL RULE FOR PRE-FLIGHT CHECK

**Mục tiêu:** Trị bệnh lười đọc file gốc.

Dù Thread mới hay cũ, ngay khi User yêu cầu chạy một skill/tính năng, hành động **ĐẦU TIÊN BẮT BUỘC** là dùng tool `{{DOC_SKIT_READ_TOOL}}` (hoặc read-file tương đương) nhắm thẳng vào `SKILL.md` của skill đó để nạp lại quy chuẩn.

**TUYỆT ĐỐI KHÔNG** dựa vào trí nhớ mường tượng từ context/thread trước.

Chưa `{{DOC_SKIT_READ_TOOL}}` / read `SKILL.md` → **CẤM** tạo TODO, plan, hay bất kỳ file product nào.

---

## ĐẠO LUẬT 2 — CRITICAL RULE FOR TODO TRACKING (Anti Flat-Check)

**Mục tiêu:** Trị "viết 10 làm 7" / flat-check.

Ngay sau Pref-light, bước tiếp theo Agent **BẮT BUỘC** tạo file:

`TODO.md` ở thư mục root (Ghi đè hoàn toàn nếu chuyển sang skill mới, cập nhật tiếp status nếu đang chat dở skill cũ)

**QUAN TRỌNG — Checklist KHÔNG ĐƯỢC cố định:**

- File TODO này **TUYỆT ĐỐI KHÔNG** chỉ copy mục "Verification Checklist" ở cuối `SKILL.md`.
- Agent **BẮT BUỘC** bóc tách **toàn bộ** mục **Workflow** và **Accelerators** trong `SKILL.md` vừa đọc thành các gạch đầu dòng TODO chưa check (`- [ ]`).
- Mỗi bước Workflow = một dòng TODO. Mỗi nhánh Accelerator = một dòng `if available / else fallback`.
- Làm xong bước nào → dùng tool **ghi đè** file TODO để đánh `[x]` kèm evidence (path/diff/CLI).
- **TUYỆT ĐỐI KHÔNG** gộp bước. **TUYỆT ĐỐI KHÔNG** tick hàng loạt. **TUYỆT ĐỐI KHÔNG** in checklist tĩnh từ `AGENTS.md` thay cho TODO bóc từ skill.

Verification Checklist ở cuối skill chỉ dùng **sau** để map evidence lên các dòng TODO đã derive từ Workflow — không phải nguồn sinh TODO.

---

## ĐẠO LUẬT 3 — CRITICAL RULE FOR EXECUTION (Plan trước khi write)

**Mục tiêu:** Không cho sinh YAML/code ngay trên RAM.

Trước khi gọi tool ghi bất kỳ file YAML/Code/product Markdown nào, Agent **BẮT BUỘC** ghi file vật lý:

`TODO.md` (ở thư mục root)

Trong file `TODO.md` này, Agent **BẮT BUỘC** kết hợp cả TODO và Plan:

1. Trích dẫn **nguyên văn** từng dòng của phần Verification Checklist trong `SKILL.md`.
2. Viết kế hoạch thực thi chi tiết cho **từng** dòng đó (file nào, tool nào, evidence nào).

Chỉ khi file plan đã ghi xong toàn bộ → mới được quyền gọi `{{DOC_SKIT_WRITE_TOOL}}` / write tool cho product SSOT.

**TUYỆT ĐỐI KHÔNG** làm gộp. **TUYỆT ĐỐI KHÔNG** tạo thêm file plan rời (`*-plan.md`).

---

## ĐẠO LUẬT 4 — CRITICAL RULE — PHYSICAL OUTPUT IMMEDIATELY (No RAM Caching)

**Mục tiêu:** Triệt thiếu hụt do tràn context.

Bất cứ khi nào Agent sinh ra một kết quả bền (TODO, plan, proposal, bundle, summary bước), Agent **KHÔNG ĐƯỢC PHÉP** giữ nó dưới dạng ngữ cảnh lơ lửng trong RAM/chat.

**BẮT BUỘC** dùng tool ghi thẳng thành file vật lý **NGAY LẬP TỨC**.

Output vật lý của bước trước = Input vật lý của bước sau (đọc lại file, không nhớ).



---

## ĐẠO LUẬT 5 — CRITICAL RULE FOR DATA ORIGIN (Zero Business Hallucination)

**Mục tiêu:** Cấm bịa nghiệp vụ khi prompt thiếu.

Agent **chỉ** được phép lấy dữ liệu để điền Spec từ đúng **2 nguồn**:

1. Prompt của User
2. Evidence từ ArtifactGraph Registry (khi MCP available)

**TUYỆT ĐỐI KHÔNG** "tự suy nghĩ" hay tự bịa trường dữ liệu, validation, cột DB, flow, hoặc tag nghiệp vụ mới.

Cái gì thiếu → **BẮT BUỘC** để trống hoặc gắn `#missing_info` và nhường `/grill`.

**CẤM** thông minh đột xuất.

(Ngoại lệ cấu trúc: pattern tags **rõ ràng** suy từ prompt như list+delete → `#pattern: CRUD` — vẫn **CẤM** bịa field/business rule.)

---

## ĐẠO LUẬT 6 — CRITICAL RULE FOR GRILL PROCESS (Hard Confirmation Gate)

**Mục tiêu:** Grill = trợ lý phân tích cục bộ, không tự sửa lan man.

Khi rà `#missing_info` / lỗ hổng, Grill **BẮT BUỘC** 4 bước:

1. **Check lại ArtifactGraph** (nếu available) — Member khác có thể vừa cập nhật.
2. **Micro-scoping:** Chỉ suy luận đúng Block/Field thiếu. **TUYỆT ĐỐI** sửa lan man phần đã chốt.
3. **Đề xuất:** 1 hoặc nhiều phương án; chỉ định **Recommended**. Hiển thị câu hỏi/đề xuất trực tiếp trên **Chat Thread** để Member review.
4. **Hard Confirmation Gate:** Agent **BẮT BUỘC** chờ Member trả lời trên chat. Chỉ sau khi Member **chốt / Confirm**, Agent mới được phép cập nhật thẳng vào product SSOT (`.bundle.yaml`) và **Artifact Registry**.

---

## ĐẠO LUẬT 7 — CRITICAL RULE FOR DSL REGISTRY (Human-Dictated)

**Mục tiêu:** Cấm ảo tưởng quyền lực với kho Common/DSL.

Con người là thực thể **duy nhất** có quyền quyết định và cập nhật kho chuẩn mực DSL/Common.

Agent **KHÔNG CÓ QUYỀN** tự động phân tích và tự quyết định cái gì là "Common".

Agent chỉ là Thư ký — được đăng ký/cập nhật DSL/Common chỉ trong **3** trường hợp bị động:

1. User chủ động gọi `/common` hoặc `/common-spec`.
2. User chủ động gọi `/docs-mark` (ArtifactGraph) để đánh tag/rule cần nhớ.
3. Sau đề xuất `/grill` và User **BẤM DUYỆT (Confirm)**.

Ở `/spec` thông thường: nhiệm vụ duy nhất là **lôi DSL/common có sẵn ra dùng**.

**TUYỆT ĐỐI KHÔNG** tự ý ghi đè hay sáng tác thêm common/DSL.

---

## Thứ tự khóa bắt buộc mỗi skill run

```text
1) {{DOC_SKIT_READ_TOOL}} SKILL.md          → Đạo luật 1
2) write TODO.md từ Workflow + Accelerators → Đạo luật 2
3) write TODO.md (quote Verification Checklist) → Đạo luật 3
4) mỗi kết quả bền → write file ngay (No RAM) → Đạo luật 4
5) data chỉ từ User | ArtifactGraph; gap → #missing_info → Đạo luật 5
6) grill → 4 bước + STOP chờ Confirm → Đạo luật 6
7) common/DSL chỉ khi /common|/common-spec|/docs-mark|Confirm → Đạo luật 7
```

Host overlay Antigravity: xem `AGENTS.md` (cùng 7 đạo luật).
