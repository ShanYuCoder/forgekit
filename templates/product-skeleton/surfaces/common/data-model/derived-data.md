# Derived data (database)

BE-only fields/tables for search, sort, compute, or snapshots — **not** a substitute for fixing wrong FE↔BE relationships.

Tag: `#derived-data`

## Requirements

| Field | Meaning |
|-------|---------|
| `backendOnly: true` | Not owned by FE contract |
| `sourceOfTruth` | Canonical source entity/query |
| `refresh` | Strategy (sync job, trigger, on-write, …) |
| `staleness` | If not realtime — document lag / TTL |

## Rules

- Do **not** hide bad relationship design behind derived tables.
- Prefer documenting under this folder + feature Code `spec.entities` notes when shared.

## Grill / platform-mark

- Grill flags BE-only fields → ask member: add to contract · mark `#derived-data` · or remove.
- Code lane detect table still in `platform-mark` extracts; **policy SSOT = this page**.

Related: [`../data-model/`](./) · toolchain [`PLATFORM-MARK`](../../platform/toolchain/PLATFORM-MARK.md)
