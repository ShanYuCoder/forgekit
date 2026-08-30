# Forgekit (Unified AI Toolkit)

**Trạng thái:** Đã hợp nhất thành công từ 5 repository cũ (`codegenkit`, `docskit`, `testkit`, `platform-dna`, `artifactgraph`).

Forgekit là công cụ Command-Line (CLI) siêu cấp - All In One, giải quyết triệt để sự rườm rà và xung đột khi cài đặt hệ sinh thái AI vào dự án. Bạn chỉ cần cài đặt **DUY NHẤT 1 LẦN** để hưởng toàn bộ sức mạnh: sinh code (FE/BE), đồng bộ tài liệu, sinh testcase, vẽ sơ đồ kiến trúc, và nạp kĩ năng (Skills) cho Agent.

---

## ⚡ Cài đặt nhanh (One-liner)

Dành cho Linux / WSL. Yêu cầu hệ thống: `Node.js >= 22` và `git`.
Mở terminal và chạy:

```bash
curl -fsSL https://raw.githubusercontent.com/ShanYuCoder/forgekit/main/install.sh | bash
```
*(Script sẽ tự động tìm kiếm phiên bản Tag mới nhất, tải về, build qua `pnpm`/`npm` và thêm `forgekit` vào PATH của bạn).*

## 🏗 Kiến trúc & Sức mạnh cốt lõi

Forgekit được xây dựng dựa trên sự hội tụ của 2 bộ não và 3 bộ máy thực thi:
- **Platform-DNA & ArtifactGraph**: Bộ não trung tâm, chịu trách nhiệm quản lý DSL, Registry và vòng đời của Đặc tả (Lifecycle).
- **Bộ Docs (Docskit)**: Bộ xử lý tài liệu, thao tác cắt nhỏ/gộp Specs, tự động sinh sơ đồ kiến trúc và giao diện đọc (Vitepress/OpenAPI).
- **Bộ Code (Codegenkit)**: Bộ máy sinh mã nguồn thực thi (Component FE / API BE) và sinh Unit Test đa nền tảng (NextJS, NestJS, FastAPI...).
- **Bộ Test (Testkit)**: Bộ máy phân tích kịch bản kiểm thử (YAML), kết xuất Testplan Markdown và sinh tự động mã kiểm thử Playwright E2E.

---

## 📚 Tài liệu chi tiết

Để giữ cho trang chủ luôn gọn gàng, toàn bộ thông tin chuyên sâu đã được phân tách thành các cuốn Sổ tay:

1. 👉 **[Sổ tay Kiến trúc & Vòng đời hệ thống](./ARCHITECTURE_AND_LIFECYCLE.md)**
   *(Giải thích cách Spec di chuyển, luồng hoạt động của QA/Tech Debt, Sơ đồ khối)*
2. 👉 **[Danh sách Lệnh CLI & Agent Skills](./CLI_AND_SKILLS.md)**
   *(Toàn bộ hơn 20 lệnh CLI cho Docs, Code, Test và danh mục Skills chuyên sâu của Agent)*

---
**🔥 Dành cho Developer:** Mọi thứ đã sẵn sàng. Hãy cài đặt Forgekit ngay hôm nay và đưa năng suất của đội nhóm lên một tầm cao mới!
