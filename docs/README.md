# 📚 Mục Lục Tài Liệu Forgekit (Platform Docs)

Dưới đây là danh mục toàn bộ tài liệu kiến trúc (Platform) và sổ tay công cụ (Toolchain) của hệ sinh thái Forgekit. Bạn có thể bấm vào từng link để đọc chi tiết ngay trên GitHub/GitLab mà không cần phải mò mẫm cấu trúc thư mục.

> [!IMPORTANT]
> **Tài liệu tại Hub này đóng vai trò là SINGLE SOURCE OF TRUTH (SSOT) cho toàn hệ thống.**
> Mọi đặc tả nghiệp vụ (Business Logic), thiết kế kiến trúc (Architecture) và giao thức (Contracts) phải được thống nhất, chốt phương án và cập nhật TẠI ĐÂY trước khi chuyển cho Lập trình viên hoặc AI Agent tiến hành lập trình. Tuyệt đối không thay đổi logic trực tiếp trong code mà không phản ánh lại vào hệ thống tài liệu này.


## 📚 Mục Lục (Table of Contents)

### 1. Guide & Khái niệm
- 📍 [Getting Started](./1-guide/getting-started.md)
- 🧰 [Toolkits Overview](./1-guide/toolkits.md)
- 🏗️ [Cấu trúc Hệ thống Docs](./1-guide/system-doc-structure.md)
- 🤖 [AI Workflow](./1-guide/ai-workflow.md)

### 2. Lifecycle (Vòng Đời)
- 🛤️ [Tổng Quan Pipeline](./2-lifecycle/overview.md)
- 🏗️ [Luồng Phát Triển (Dev)](./2-lifecycle/development-flows.md)
- 🧠 [Luồng Backend AI](./2-lifecycle/backend-workflow.md)
- 🛡️ [Bảo Trì & Tech Debt](./2-lifecycle/quality-maintenance.md)

### 3. Artifacts
- 📁 [Cấu Trúc Layout](./3-artifacts/layout.md)
- 🧩 [Bundle & IR](./3-artifacts/bundle-and-ir.md)
- 🔥 [Quy trình Grill](./3-artifacts/grill-process.md)
- 📌 [Tags & Markers](./3-artifacts/tags-and-markers.md)

### 4. Contracts & Tiêu Chuẩn
- 🤝 [Portal ↔ FastAPI](./4-contracts/portal-to-fastapi.md)
- 🗂️ [Field Registry](./4-contracts/field-registry.md)

### 5. Kiểm Thử (Testing)
- 🆔 [Quy Ước E2E TestIDs](./5-testing/e2e-testids.md)
- ✔️ [E2E Semantic Assertions](./5-testing/e2e-assertions.md)

### 6. Tra Cứu Nhanh (Reference)
- ⌨️ [CLI & Commands](./6-reference/cli-and-commands.md)
- 💬 [Prompt Templates](./6-reference/prompt-templates.md)
- 🗺️ [Repo Split Map](./6-reference/repo-split-map.md)

### 7. Kiến Trúc (Architecture)
- 🏛️ [Portal Architecture](./7-architecture/portal-architecture.md)
- ♻️ [Page Lifecycle](./7-architecture/page-lifecycle.md)
