# 04 — Solution strategy

status: active

## Purpose

High-level approach: docs hub as arc42 TOC + C4 views; product Code under `CMP-*`; curated journeys.

## Content

| Theme | Decision |
|-------|----------|
| Docs structure | [ADR-001](../09-decisions/ADR-001-arc42-toc) — arc42 TOC over flat C4 folders |
| Admin runtime | Admin Web + Admin API ([§07](../07-deployment/)) |
| Auth entry | [CMP-01](/product/components/CMP-01-auth/) · [FLOW-login](../06-runtime/journeys/FLOW-login) |

Further ADRs land in [§09](../09-decisions/).

## Out of scope

Per-feature UI/API DSL (`product/**/code/`).

## See also

- [09 Decisions](/architecture/09-decisions/)
- [05 Building blocks](/architecture/05-building-blocks/)
