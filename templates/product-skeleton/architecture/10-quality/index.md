# 10 — Quality

status: active

Architecture quality concerns for this docs hub and its described systems.

**Not** E2E/`TC-*` plans — those stay on **`base-tests`** (link from scenarios → `FLOW-*` where useful).

## Architecture quality (docs)

| Concern | Expectation |
|---------|-------------|
| Link integrity | Prefer docskit `validate_links` / CI later; avoid orphan `FLOW-*`/`ADR-*` |
| ID consistency | Same keys across FE schema, API, BE when contract group exists |
| Journey density | Core / cross-system only — quality over coverage |
| Render UX | Mermaid readable in VitePress (`vitepress-mermaid-renderer`); no Kroki |

## Runtime quality (product — stub)

Fill when SLOs exist: availability, latency, auth failure rates, observability coverage.

Until then see §08 [security](../08-cross-cutting/security) / [observability](../08-cross-cutting/observability).

## See also

- [08 Cross-cutting](/architecture/08-cross-cutting/)
- [11 Risks](/architecture/11-risks/)
