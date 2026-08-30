# 📚 Mục Lục Tài Liệu Forgekit (Platform Docs)

Dưới đây là danh mục toàn bộ tài liệu kiến trúc (Platform) và sổ tay công cụ (Toolchain) của hệ sinh thái Forgekit. Bạn có thể bấm vào từng link để đọc chi tiết ngay trên GitHub/GitLab mà không cần phải mò mẫm cấu trúc thư mục.

> [!IMPORTANT]
> **Tài liệu tại Hub này đóng vai trò là SINGLE SOURCE OF TRUTH (SSOT) cho toàn hệ thống.**
> Mọi đặc tả nghiệp vụ (Business Logic), thiết kế kiến trúc (Architecture) và giao thức (Contracts) phải được thống nhất, chốt phương án và cập nhật TẠI ĐÂY trước khi chuyển cho Lập trình viên hoặc AI Agent tiến hành lập trình. Tuyệt đối không thay đổi logic trực tiếp trong code mà không phản ánh lại vào hệ thống tài liệu này.

---

## 🚀 Khởi Đầu (Getting Started)
*Các khái niệm tổng quan dành cho người mới và nắm bắt luồng hệ thống.*

- 📍 [Bắt đầu từ đây (Start Now)](./1-guide/getting-started.md) - Quy trình onboarding và ma trận trách nhiệm dự án.
- 🏗️ [Cấu trúc Tài liệu Hệ thống](./1-guide/system-doc-structure.md) - Giải thích ý nghĩa các tầng tài liệu: Overview, Surface, Module, Function.
- 🧰 [Forgekit & Các Bộ Công Cụ](./1-guide/toolkits.md) - Định nghĩa và phân loại **Bộ Docs, Bộ Code, Bộ Test** và **Common**.
- 🏢 [Platform Base Overview](#) - Tổng quan về bộ khung 4 tầng Frontend/Backend.
- 🤖 [YAML/Markdown AI Workflow](./1-guide/ai-workflow.md) - Phương pháp làm việc: YAML dành cho máy (IR) và Markdown dành cho con người.

---

## ⚙️ Sổ tay Công cụ (Toolchain)
*Chi tiết các lệnh, cấu trúc thư mục, quy ước đặt tên và các bản đồ luồng công việc.*

- 🏠 [Trang chủ Toolchain](./)

### Quy ước và Các bước Thực thi
- ⌨️ [Lệnh thực thi Forgekit](./6-reference/cli-and-commands.md) - Tổng hợp các script `split`, `render`, `publish`, `gen`.
- 📁 [Cấu trúc Vật lý của Artifact](./3-artifacts/layout.md) - Sắp xếp thư mục `CMP-*/NN…/`, `ir/`, `qa/`.
- 🧩 [Bundle IR & Nguồn sự thật (SSOT)](./3-artifacts/bundle-and-ir.md) - Cơ chế gộp và tách file YAML đặc tả.
- 🔥 [Quy trình Nướng (Grill)](./3-artifacts/grill-process.md) - Vòng lặp tối ưu hóa với `/grill-bqa` → `/grill-dev`.
- 💬 [Mẫu Prompt cho AI](./6-reference/prompt-templates.md) - Cách thức giao tiếp chuẩn xác với trợ lý.
- 📌 [Quy định Tagging & Marker](./3-artifacts/tags-and-markers.md) - Gắn thẻ metadata (GAP, Parity) vào codebase.

### Sơ đồ Luồng Công Việc (Workflows & Pipelines)
> Thay vì lộn xộn nhiều biểu đồ riêng lẻ, hệ thống hiện được gom thành 3 trục luồng chính:

- 🛤️ [Sơ đồ Toàn Trình (Pipeline & Design)](./2-lifecycle/overview.md) - Pipeline tổng từ Phase 0 đến Phase 4, tập trung mạnh vào Giai đoạn Thiết kế (Design Phase).
- 🏗️ [Luồng Phát Triển (Development Flows)](./2-lifecycle/development-flows.md) - Các luồng Code cho Backend, Tích hợp Wire, Component UI và Unit Test.
- 🛡️ [Luồng Chất lượng (Quality & Maintenance)](./2-lifecycle/quality-maintenance.md) - Các luồng dành cho Kiểm thử E2E, Giải quyết Nợ kỹ thuật (Tech Debt) và Cập nhật Đặc tả.

### Giao tiếp & Tích hợp Hệ thống
- 🗺️ [Bản đồ Phân tách Repo](./6-reference/repo-split-map.md) - Mapping trách nhiệm của từng Repo (Portal, FastAPI, Line, Integration).
- 🤝 [Hợp đồng Portal - FastAPI](./4-contracts/portal-to-fastapi.md) - Contract giao tiếp API chuẩn.
- 🗂️ [Quản lý Data Field Registry](./4-contracts/field-registry.md) - Tiêu chuẩn đặt tên và đồng bộ Field.

### Chất lượng & E2E Testing
- 🆔 [Quy ước E2E TestIDs](./5-testing/e2e-testids.md) - Cách đặt data-testid để tự động hóa.
- ✔️ [Kiểm tra UI Ngữ nghĩa (Semantic Assertions)](./5-testing/e2e-assertions.md)

### Kiến thức Chuyên Sâu (Deep Dive & Presentations)
- 🏛️ [Architecture](./7-architecture/portal-architecture.md) - Bức tranh toàn cảnh kiến trúc.
- ♻️ [Vòng đời Trang (Page Lifecycle)](./7-architecture/page-lifecycle.md) - Luồng vận hành vòng đời của một màn hình.
- 📈 [Thăng cấp Design (Registry Promotion)](./3-artifacts/design-registry-promotion.md)
- 📈 [Thăng cấp Unit Test (Registry Promotion)](./3-artifacts/unit-registry-promotion.md)
- 📊 [Slide: Workflow Team AI](./1-guide/team-ai-workflow-slides.md)
- 📊 [Slide: Backend Phase 3b](./1-guide/team-backend-phase3b-slides.md)
