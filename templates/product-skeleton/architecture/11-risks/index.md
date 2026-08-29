# 11 — Risks

status: active

Risks and mitigations for the docs hub migration and for relying on curated architecture docs.

## Docs hub

| Risk | Mitigation |
|------|------------|
| Stale paths after arc42 migrate | Redirect stubs on old flat paths; skills + start-now / SYSTEM-DOC-STRUCTURE |
| Orphan / wrong IDs in MD | Docskit MCP orphans + validate_links; add FLOW-* only with lead IDs |
| “Full sequence every story” pressure | Principle: curated ~10–20%; skill `/journey` refusal |
| Mermaid render confusion | Reader = VitePress only; no Mermaid MCP; Structurizr only if C4 hierarchy pain |
| Invented deployment topology | §07 stub-first; `/deployment` refuses fiction |

## Product / domain (stub)

New MES / IoT / ERP journeys only when lead assigns real `CTR-*`/`API-*` ownership — do not invent draft FLOW SSOT.

## See also

- [10 Quality](/architecture/10-quality/)
- [Start now](/platform/guide/start-now)
- [Doc structure](/platform/guide/SYSTEM-DOC-STRUCTURE)
