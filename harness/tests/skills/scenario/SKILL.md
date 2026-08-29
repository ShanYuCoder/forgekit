---
name: scenario
description: /scenario — author cross-flow E2E scenario YAML/MD on the tests hub.
disable-model-invocation: true
---

# /scenario

**Owner:** Testkit (`--type=tests`)

Author cross-flow scenarios (SC) on the current tests hub. Design rules stay on the docs hub.

Scenarios test a **business process** (`FLOW-*`) that spans multiple screens (`W-*`) or modules. They mirror the docs FLOW file **after** Docskit LCA `common/` placement (not a flat `product/common/` tree).

## Output Rules

- **Rich Business Descriptions:** When generating YAML scenarios, you MUST provide a detailed `description` (or `story`) field. Do not leave them empty or write sparse 1-liners.
- Explain the **Business Context**: Why does this cross-flow exist? What is the real-world process?
- Outline the **Expected Outcome**: Detail what the end-to-end user journey should achieve.
- Include metadata like `priority`, `status`, `module`, and `tags` if available.
- **Valid YAML Syntax:** Do NOT write raw JavaScript expressions directly into YAML values. If you need a long string, wrap the exact code expression entirely in single quotes (e.g., `value: '"a".repeat(256)'`).
- **Concise Naming Convention:** The `id` must be short (e.g., `SC-CHK-01`). The `title` MUST be extremely short and concise (limit 15-20 characters, e.g., `Guest Checkout`, `Refund Flow`). Put long explanations into `description`, not `title` or `id`.

## Target / ID Resolution Rule

- Agent MUST locate the **`FLOW-*.md`** file on the docs hub (`TESTKIT_DOCS_ROOT`) via `docskit_route` / `docskit_get_element` / glob. Filenames are `FLOW-…md`, not `flow-*`.
- Search in this order (same LCA as Docskit `common-scope.md`):
  1. `product/surfaces/<surface>/<CMP-id>/<NN>/common/processes/FLOW-*.md` (cluster)
  2. `product/surfaces/<surface>/<CMP-id>/common/processes/FLOW-*.md` (module)
  3. `product/surfaces/<surface>/common/processes/FLOW-*.md` (surface)
  4. `product/surfaces/common/processes/FLOW-*.md` (cross-surface product common)
  5. `architecture/03-business-process/FLOW-*.md` (org catalog only)
- **Strict:** Only author a scenario if that `FLOW-*.md` exists. Missing FLOW → hand off to docs-hub `/business-process`, do not invent SC.
- Do not treat `common/yaml/` or `common/patterns/` as scenario sources.

## Directory Mirroring Rule (Docs SSOT)

Mirror the FLOW file path onto the tests hub. Strip **only** these prefixes:

| Docs FLOW path | Tests hub |
|----------------|-----------|
| `product/surfaces/<rest>/common/processes/FLOW-checkout.md` | `scenarios/<rest>/common/processes/FLOW-checkout/SC-*.yaml` |
| `architecture/03-business-process/FLOW-checkout.md` | `scenarios/architecture/03-business-process/FLOW-checkout/SC-*.yaml` |

Examples:

- Docs `product/surfaces/admin/CMP-ADM-002/02/common/processes/FLOW-checkout.md` → `scenarios/admin/CMP-ADM-002/02/common/processes/FLOW-checkout/SC-*.yaml`
- Docs `product/surfaces/admin/CMP-ADM-002/common/processes/FLOW-onboard.md` → `scenarios/admin/CMP-ADM-002/common/processes/FLOW-onboard/SC-*.yaml`

Do **not** flatten to `scenarios/auth/…`. Do **not** use `product/common/` (legacy). Keep numeric cluster folders (`02/`) in the tests path.

## Accelerators (optional)

```text
if local ArtifactGraph available: taxonomy/coverage/gap hints from this tests hub
else: local deterministic coverage/search from scoped plan + docs evidence
```

ArtifactGraph on the tests hub uses `--type=common,test` and indexes this repo only. Docs-hub FLOW/design evidence comes through explicit docs references, never through ArtifactGraph.
