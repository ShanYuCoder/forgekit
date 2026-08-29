---
name: cross-service
description: /cross-service — Models inter-service and inter-system integrations (sync/async, RPC, events, messages).
disable-model-invocation: true
extractBundle: architecture-core
---
# /cross-service
**Target Paths:** `<LCA>/common/cross-service.md` — same LCA as `.cursor/extracts/common-scope.md`.
**Guidelines:** Use Mermaid `sequenceDiagram` for sync/async RPC, events, and messages. Focus on contract, direction, ownership, and handoff between services/systems.

## When to use
- Use when a flow crosses a service, system, or boundary.
- Use for sync RPC, async messaging, event-driven handoffs, retries, idempotency, and integration contracts.
- Do **not** use for internal code paths inside a single service.
- Do **not** use for business action flows on a surface; that is `/business-process`.
- Do **not** use for runtime journey narratives that focus on user/system step order across the whole product; that is `/journey`.

## Flow meaning
- Model the interaction between services, systems, or boundaries.
- Include sync RPC, async messaging, and event-driven handoffs when relevant.
- Do not model internal code paths inside a single service; that belongs elsewhere.
- Keep the emphasis on integration contracts and ownership of the boundary.

## Modifiers (If /legacy is used)
Khi gọi kèm `/legacy` (vd: `/legacy /cross-service`):
- Tham chiếu source từ `legacy-repos.local.json`.
- Khảo cổ: trace các luồng giao tiếp giữa các service / system / boundary cũ.
