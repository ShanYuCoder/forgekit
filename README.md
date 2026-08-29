# Forgekit (Unified AI Toolkit)

**Trạng thái:** Đã hợp nhất thành công từ 5 repository cũ (`codegenkit`, `docskit`, `testkit`, `platform-dna`, `artifactgraph`).

## Bối cảnh & Mục tiêu
Dự án được khởi tạo để giải quyết vấn đề rườm rà và xung đột khi cài đặt riêng rẽ 5 bộ công cụ AI vào cùng một repository đích.
Với Forgekit, bạn chỉ cần cài đặt **DUY NHẤT 1 LẦN** để hưởng toàn bộ hệ sinh thái: sinh code (FE/BE), đồng bộ tài liệu, sinh testcase, vẽ sơ đồ kiến trúc, và nạp kĩ năng cho Agent.

## Cấu trúc Kiến trúc (Sau Refactor)

### 1. Thư mục Lõi (Gọn gàng, sạch sẽ)
- **`src/`**: Mã nguồn gốc được làm phẳng 1 cấp, chia làm 5 module:
  - `codegen/`: Xử lý sinh code.
  - `dna/`: Xử lý context và platform-dna.
  - `docs/`: Quét route và đồng bộ tài liệu.
  - `graph/`: Vẽ sơ đồ kiến trúc (ArtifactGraph).
  - `test/`: Render và quản lý Test Cases.
  *(Toàn bộ các thư mục `install/`, `cli.ts`, `index.ts` rác bị trùng lặp của 5 repo cũ đã bị xóa sạch để dọn đường cho luồng cài đặt tập trung).*

### 2. Thư mục Tài Nguyên (Data & Templates)
- **`adapters/`**: Chứa toàn bộ kịch bản cấu hình cho Frontend (NextJS, Nuxt4) và Backend (NestJS, Laravel, FastAPI, Dotnet).
- **`harness/`**: Gom tất cả các **Skills** (kỹ năng) dành cho AI Agent (Gemini/Antigravity) từ 5 repo cũ.
- **`templates/`**, **`schemas/`**, **`stacks/`**, **`lexicon/`**, **`registries/`**: Các tài nguyên tĩnh, mẫu file, cấu trúc database được gom chung về một mối.

### 3. Giao diện thực thi (Entry Points)
- **`bin/forgekit-mcp.mjs`**: Server MCP **duy nhất**. Nó import tất cả Tool MCP của 5 module (`cases_render`, `docs_sync`, `graph_query`, v.v.) và gắn chung vào 1 server. Các tool đã được trả về tên gọi ngắn gọn nguyên thủy (không dùng tiền tố dài dòng).
- **`bin/forgekit.mjs`**: CLI cài đặt tương tác.

## Luồng hoạt động của `forgekit init` (hoặc `sync`)
Kịch bản khởi tạo giờ đây đã thông minh và tập trung:
1. Hỏi loại dự án: Frontend, Backend, hay Fullstack.
2. Nếu Fullstack/Frontend: Hỏi tiếp công nghệ FE (Nuxt4, NextJS) và yêu cầu nhập thư mục gốc của **Docs** và **Tests**.
3. Thực hiện **Copy Đệ Quy (Recursive Copy)**:
   - Copy đè (sync) các `adapters` tương ứng vào `.forgekit/`
   - Copy đệ quy `templates` và `schemas` vào `.forgekit/`
   - Bê toàn bộ `harness/` đập thẳng vào `.agents/skills/`
   - Tạo file `.agents/mcp_config.json` chỉ đích danh `forgekit-mcp`.
4. Lưu tất cả những câu trả lời cấu hình (Docs Root, Test Root) vào `.forgekit/config.json`.

---

**🔥 Dành cho Developer:**
Mọi thứ đã sẵn sàng. Bạn có thể mở terminal ngay tại repo này và chạy thử:
```bash
node bin/forgekit.mjs
```
để tự mình kiểm chứng luồng thiết lập cực kỳ mượt mà!
