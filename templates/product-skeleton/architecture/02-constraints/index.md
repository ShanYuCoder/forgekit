# 02 — Constraints

status: active

## Purpose

Constraints that shape how we write and structure architecture docs (and what we refuse to invent).

## Technical

| Constraint | Implication |
|------------|-------------|
| Docs live in git as Markdown | Diagrams = Mermaid in MD; no proprietary SSOT |
| Product IDs (`CMP-*`/`W-*`/`API-*`) are stable | Architecture migrate must not rename L3 schemas |
| VitePress Mermaid 11 | Prefer `sequenceDiagram` / `flowchart`; avoid Mermaid `C4Context` |
| Multi-repo workspace | Cross-repo links via `platform-repos`; FE↔BE contract only when mapped |

## Organizational

| Constraint | Implication |
|------------|-------------|
| Stub-first §07 | No invented prod topology — `DEP-*` only when placement matters |
| Curated journeys (~10–20%) | `/journey` refuses backlog-dump sequences |
| AI author + human review | Skills + optional docskit MCP validate IDs; humans own ADRs |

## Legal / security (docs)

No secrets, tokens, or real prod endpoints in architecture MD. Local IDE/WSL tips are out of scope for this hub.

## See also

- [04 Solution strategy](/architecture/04-solution-strategy/)
- [09 Decisions](/architecture/09-decisions/)
- [ADR-001](/architecture/09-decisions/ADR-001-arc42-toc)
