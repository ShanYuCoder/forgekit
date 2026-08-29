# Data model

Shared domain notes (MD). Entity detail for a feature still belongs in that feature’s Code bundle `spec.entities`.

## Topics

- [Derived data (`#derived-data`)](./derived-data.md) — BE-only search/sort/compute/snapshot fields & tables

## Journeys vs ER

Runtime sequences live under [`architecture/06-runtime/journeys/`](/architecture/06-runtime/) (`FLOW-*`).  
When a journey persists data, **link** the relevant entity here or in the owning `CMP-*/code` bundle — **do not** paste ER diagrams into every sequence.

| Journey | Data notes |
|---------|------------|
| [FLOW-login](/architecture/06-runtime/journeys/FLOW-login) | Session/token — details TBD / ADR |
