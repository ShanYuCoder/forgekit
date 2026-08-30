---
name: business-process
description: /business-process — Models business action flows (actor + surface + action + outcome) as FLOW-*.
disable-model-invocation: true
extractBundle: architecture-core
---
# /business-process
**Target Paths:** resolve with `.cursor/extracts/common-scope.md` §4 — not a free `[Target Path]/Common/Business processes`.
**Guidelines:** Use standard MD + Mermaid `flowchart` or `sequenceDiagram`. Model the process by business actions on surfaces, not by repo/service topology.

**Placement (mandatory): Business-process MUST be documented across 2 distinct perspectives:**
1. **When co-activated with `/common` skill:**
   - Write pure Markdown describing the business logic at the UI surface.
   - The deeper the path goes into the module structure, the more exhaustively you must describe every detail and edge case of the UI flow.
   - Placement: `surfaces/**/common/` (e.g. `surfaces/<surface>/<CMP-id>/common/processes/FLOW-*.md` or `surfaces/<surface>/<CMP-id>/<NN>/common/processes/FLOW-*.md`).
2. **When co-activated with `/architecture` skill:**
   - Focus on pure technical Mermaid sequence diagrams (`sequenceDiagram`).
   - Dig deep into backend services, database interactions, external APIs, and 3rd-party services (e.g., S3, Redis).
   - Placement: `architecture/03-business-process/`.

**Additional routing rules:**
- Never write FLOW next to a single function bundle. VitePress/publish menu uses **Mã quy trình** only (vd `FLOW-PORTAL-AUTH-CHANGE`), not the H1.

## Process meaning
- Start from the business question: who is doing what on which surface/channel.
- Show handoffs, decisions, exceptions, and outcomes.
- A process can touch multiple surfaces or modules, but the primary lens is business action, not technical boundary.
- Use `sequenceDiagram` when interactions between actors/surfaces matter; use `flowchart` when decision paths matter more.
- **MANDATORY ERROR FLOWS IN DIAGRAMS:** When generating Mermaid `flowchart` or `sequenceDiagram`, Agent MUST explicitly model error paths and exception handling. This includes:
  - Global error redirects (e.g., 401 Unauthorized redirect to login, 403 IDOR blocking).
  - Validation failures (422) returning to the form state.
  - Conflict exceptions (409) and their UI resolutions.
- Do not describe the process as a service map unless the service boundary is the actual business concern.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /business-process`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: truy vết flow nghiệp vụ từ hệ thống cũ để ánh xạ thành các luồng `FLOW-*` tương ứng theo actor / surface / action / outcome. Đưa vào cùng thư mục đang thao tác nhưng tên file thêm tiền tố `legacy-` ở đầu (vd: `legacy-process.md`).
